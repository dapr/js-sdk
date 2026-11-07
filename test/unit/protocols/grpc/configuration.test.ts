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

import { create } from "@bufbuild/protobuf";
import { Code, ConnectError } from "@connectrpc/connect";
import GRPCClient from "../../../../src/implementation/Client/GRPCClient/GRPCClient";
import GRPCClientConfiguration from "../../../../src/implementation/Client/GRPCClient/configuration";
import { DeferredAsyncIterable } from "../../../../src/utils/Streams.util";
import {
  SubscribeConfigurationResponse,
  SubscribeConfigurationResponseSchema,
  UnsubscribeConfigurationResponseSchema,
} from "../../../../src/proto/dapr/proto/runtime/v1/configuration_pb";
import { ConfigurationItemSchema } from "../../../../src/proto/dapr/proto/common/v1/common_pb";

const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

describe("grpc/configuration subscribe stop", () => {
  async function harness() {
    const service = { error: jest.fn(), warn: jest.fn(), info: jest.fn(), verbose: jest.fn(), debug: jest.fn() };
    const grpc = new GRPCClient({ logger: { service } });
    grpc.setIsInitialized(true);
    const raw = await grpc.getClient();
    const responses = new DeferredAsyncIterable<SubscribeConfigurationResponse | Error>();
    let signal: AbortSignal | undefined;
    const unsubRequests: Array<{ storeName?: string; id?: string }> = [];

    jest.spyOn(raw, "subscribeConfiguration").mockImplementation((_req, options) => {
      signal = options?.signal;
      const end = () => responses.end();
      signal?.addEventListener("abort", end, { once: true });
      return (async function* () {
        try {
          for await (const response of responses) {
            if (signal?.aborted) {
              throw new ConnectError("canceled", Code.Canceled);
            }
            if (response instanceof Error) {
              throw response;
            }
            yield response;
          }
        } finally {
          signal?.removeEventListener("abort", end);
        }
      })();
    });
    jest.spyOn(raw, "unsubscribeConfiguration").mockImplementation(async (req) => {
      unsubRequests.push({ storeName: req.storeName, id: req.id });
      return create(UnsubscribeConfigurationResponseSchema, { ok: true });
    });

    return {
      configuration: new GRPCClientConfiguration(grpc),
      responses,
      unsubRequests,
      getSignal: () => signal,
    };
  }

  const firstMessage = (id = "stream-1") =>
    create(SubscribeConfigurationResponseSchema, {
      id,
      items: {
        "my-key": create(ConfigurationItemSchema, { value: "v1", version: "1" }),
      },
    });

  it("unsubscribes when stop is called after the stream id is known", async () => {
    const { configuration, responses, unsubRequests } = await harness();
    const cb = jest.fn();

    const stream = await configuration.subscribe("mystore", cb);
    responses.push(firstMessage("stream-ready"));
    await flush();
    await flush();

    await stream.stop();

    expect(unsubRequests).toEqual([{ storeName: "mystore", id: "stream-ready" }]);
  });

  it("still unsubscribes when stop is called before the stream id arrives", async () => {
    const { configuration, responses, unsubRequests } = await harness();
    const cb = jest.fn();

    const stream = await configuration.subscribe("mystore", cb);

    // stop() before any message — previously returned without unsubscribe
    const stopPromise = stream.stop();
    await flush();
    expect(unsubRequests).toEqual([]);

    responses.push(firstMessage("late-stream-id"));
    await stopPromise;

    expect(unsubRequests).toEqual([{ storeName: "mystore", id: "late-stream-id" }]);
    expect(cb).not.toHaveBeenCalled();
  });
});
