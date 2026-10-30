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

import { createRouterTransport } from "@connectrpc/connect";
import * as connectNode from "@connectrpc/connect-node";
import { CommunicationProtocolEnum, DaprClient, GRPCClient, HttpMethod, withBaggage } from "../../../../src";
import { withTraceContext } from "../../../../src/utils/TraceContext.util";
import { Dapr } from "../../../../src/proto/dapr/proto/runtime/v1/dapr_pb";

const parent = "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01";
const traceHeaders = { traceparent: parent, tracestate: "vendor=value" };

describe("gRPC trace propagation", () => {
  let client: DaprClient;
  let received: Headers[];
  beforeEach(() => {
    received = [];
    jest.spyOn(connectNode, "createGrpcTransport").mockImplementation((options) =>
      createRouterTransport(
        (router) =>
          router.service(Dapr, {
            getMetadata: (_request, ctx) => {
              received.push(new Headers(ctx.requestHeader));
              return {};
            },
            invokeService: (_request, ctx) => {
              received.push(new Headers(ctx.requestHeader));
              return { data: { value: Buffer.from("{}") } };
            },
            publishEvent: (_request, ctx) => {
              received.push(new Headers(ctx.requestHeader));
              return {};
            },
            setBinaryFileAlpha1: async (requests, ctx) => {
              for await (const _request of requests) {
                /* Consume the stream. */
              }
              received.push(new Headers(ctx.requestHeader));
              return {};
            },
          }),
        { transport: { interceptors: options.interceptors } },
      ),
    );
    client = new DaprClient({ communicationProtocol: CommunicationProtocolEnum.GRPC, daprApiToken: "test-token" });
    (client.daprClient as GRPCClient).setIsInitialized(true);
  });
  afterEach(async () => {
    await client.stop();
    jest.restoreAllMocks();
  });

  it("propagates to invocation, pubsub and client streaming while retaining baggage and authentication", async () => {
    await withTraceContext(traceHeaders, () =>
      withBaggage({ tenant: "one" }, async () => {
        await client.invoker.invoke("app", "method", HttpMethod.POST, { hello: "world" });
        await client.pubsub.publish("pubsub", "topic", { hello: "world" });
        await client.binaryStore.setBinaryFile("store", "file", Buffer.from("data"));
      }),
    );
    expect(received).toHaveLength(3);
    for (const headers of received) {
      expect(headers.get("traceparent")).toBe(parent);
      expect(headers.get("tracestate")).toBe("vendor=value");
      expect(headers.get("baggage")).toBe("tenant=one");
      expect(headers.get("dapr-api-token")).toBe("test-token");
    }
    await client.metadata.get();
    expect(received[3].has("traceparent")).toBe(false);
  });

  it("preserves explicit context without adding inherited tracestate", async () => {
    const rpc = await (client.daprClient as GRPCClient).getClient();
    await withTraceContext(traceHeaders, () => rpc.getMetadata({}, { headers: { Traceparent: "explicit" } }));
    expect(received[0].get("traceparent")).toBe("explicit");
    expect(received[0].has("tracestate")).toBe(false);
  });

  it("does not inject invalid or absent context", async () => {
    await withTraceContext({ traceparent: "invalid", tracestate: "vendor=value" }, () => client.metadata.get());
    await client.metadata.get();
    expect(received.every((headers) => !headers.has("traceparent") && !headers.has("tracestate"))).toBe(true);
  });
});
