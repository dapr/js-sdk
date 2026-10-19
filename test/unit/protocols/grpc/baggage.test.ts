/*
Copyright 2026 The Dapr Authors
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { Code, ConnectError, createRouterTransport } from "@connectrpc/connect";
import * as connectNode from "@connectrpc/connect-node";
import { CommunicationProtocolEnum, DaprClient, GRPCClient, withBaggage } from "../../../../src";
import { Dapr } from "../../../../src/proto/dapr/proto/runtime/v1/dapr_pb";

describe("gRPC baggage", () => {
  let client: DaprClient;
  let transport: GRPCClient;
  let received: Headers[];

  beforeEach(() => {
    received = [];
    jest.spyOn(connectNode, "createGrpcTransport").mockImplementation((options) =>
      createRouterTransport(
        (router) =>
          router.service(Dapr, {
            getMetadata: (_request, context) => {
              received.push(new Headers(context.requestHeader));
              if (context.requestHeader.get("baggage") === "tenant=failed") {
                throw new ConnectError("failure", Code.Internal);
              }
              return {};
            },
            setBinaryFileAlpha1: async (requests, context) => {
              for await (const _request of requests) {
                // Consume the client stream before responding.
              }
              received.push(new Headers(context.requestHeader));
              return {};
            },
          }),
        { transport: { interceptors: options.interceptors } },
      ),
    );
    client = new DaprClient({ communicationProtocol: CommunicationProtocolEnum.GRPC, daprApiToken: "test-token" });
    if (!(client.daprClient instanceof GRPCClient)) {
      throw new Error("Expected gRPC client");
    }
    transport = client.daprClient;
    transport.setIsInitialized(true);
  });

  afterEach(async () => {
    await client.stop();
    jest.restoreAllMocks();
  });

  it("injects baggage at request time while preserving authentication and trace context", async () => {
    const rpc = await transport.getClient();
    const headers = { traceparent: "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01" };
    await withBaggage({ tenant: "acme inc" }, async () => {
      await Promise.resolve();
      await rpc.getMetadata({}, { headers });
    });
    expect(received[0].get("baggage")).toBe("tenant=acme%20inc");
    expect(received[0].get("dapr-api-token")).toBe("test-token");
    expect(received[0].get("traceparent")).toBe(headers.traceparent);
    expect(headers).not.toHaveProperty("baggage");
    await rpc.getMetadata({});
    expect(received[1].has("baggage")).toBe(false);
    expect(received[1].get("dapr-api-token")).toBe("test-token");
  });

  it("does not require an API token to propagate baggage", async () => {
    const unauthenticated = new GRPCClient({});
    const rpc = await unauthenticated.getClient(false);
    await withBaggage({ tenant: "acme" }, () => rpc.getMetadata({}));
    expect(received[0].get("baggage")).toBe("tenant=acme");
    expect(received[0].has("dapr-api-token")).toBe(false);
    await unauthenticated.stop();
  });

  it("preserves explicit baggage and API token headers", async () => {
    const rpc = await transport.getClient();
    await withBaggage({ tenant: "context" }, () =>
      rpc.getMetadata({}, { headers: { Baggage: "tenant=explicit", "dapr-api-token": "explicit-token" } }),
    );
    expect(received[0].get("baggage")).toBe("tenant=explicit");
    expect(received[0].get("dapr-api-token")).toBe("explicit-token");
  });

  it("adds no baggage outside a context or for an empty context", async () => {
    await client.metadata.get();
    await withBaggage({}, () => client.metadata.get());
    expect(received).toHaveLength(2);
    expect(received.every((headers) => !headers.has("baggage"))).toBe(true);
  });

  it("propagates baggage on client-streaming RPCs", async () => {
    await withBaggage({ tenant: "stream" }, () =>
      client.binaryStore.setBinaryFile("store", "file", Buffer.from("data")),
    );
    expect(received[0].get("baggage")).toBe("tenant=stream");
    expect(received[0].get("dapr-api-token")).toBe("test-token");
  });

  it("does not leak baggage after a failed RPC", async () => {
    await expect(withBaggage({ tenant: "failed" }, () => client.metadata.get())).rejects.toThrow("failure");
    await client.metadata.get();
    expect(received[1].has("baggage")).toBe(false);
  });
});
