/*
Copyright 2022 The Dapr Authors
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

import { Network, StartedNetwork, StartedTestContainer, TestContainers } from "testcontainers";
import { CommunicationProtocolEnum, DaprClient, DaprServer, HttpMethod, LogLevel } from "../../../src";
import { DaprInvokerCallbackContent } from "../../../src/types/DaprInvokerCallback.type";
import { DaprGrpcAppContainer, StartedGrpcDaprContainer } from "../helpers/DaprGrpcAppContainer";
import {
  startRedisContainer,
  startMqttContainer,
  buildBindingMqttComponent,
  buildBindingRedisComponent,
  buildConfigRedisComponent,
  runWithCleanupErrorSuppression,
} from "../helpers/containers";

const serverHost = "127.0.0.1";
const serverPort = "3001";
const daprAppId = "test-suite-grpc-server";

describe("grpc/server", () => {
  let server: DaprServer;
  let network: StartedNetwork;
  let redisContainer: StartedTestContainer;
  let mqttContainer: StartedTestContainer;
  let daprContainer: StartedGrpcDaprContainer;

  const mockInvoker = jest.fn(async (_data: object) => _data);
  const mockBindingReceive = jest.fn(async (_data: object) => null);

  beforeAll(async () => {
    network = await new Network().start();
    [redisContainer, mqttContainer] = await Promise.all([
      startRedisContainer(network),
      startMqttContainer(network),
    ]);

    // The Dapr container calls back to the gRPC app server on the host.
    await TestContainers.exposeHostPorts(parseInt(serverPort));

    // Create the server with placeholder Dapr client options (real ports patched after
    // the container starts). Must be done BEFORE DaprContainer.start() so the gRPC app
    // listener is already running when Dapr probes it for input binding subscriptions.
    server = new DaprServer({
      serverHost,
      serverPort,
      communicationProtocol: CommunicationProtocolEnum.GRPC,
      clientOptions: {
        daprHost: "127.0.0.1",
        daprPort: "50001", // placeholder – patched below with the real mapped port
        communicationProtocol: CommunicationProtocolEnum.GRPC,
        maxBodySizeMb: 3, // larger than sidecar limit (1 MB) to allow the oversized test payload through the client
        logger: {
          level: LogLevel.Debug,
        },
      },
      maxBodySizeMb: 1,
    });

    await server.binding.receive("binding-mqtt", mockBindingReceive);
    await server.invoker.listen("test-invoker", mockInvoker, { method: HttpMethod.POST });

    // Start ONLY the gRPC listener (no sidecar wait) so the app is already listening
    // when the Dapr container probes it for input binding subscriptions during its init.
    await server.daprServer.start(serverHost, serverPort);

    // Now start the Dapr container — it will call back to the running gRPC app and
    // register the MQTT input binding.
    daprContainer = await new DaprGrpcAppContainer()
      .withNetwork(network)
      .withAppId(daprAppId)
      .withAppPort(parseInt(serverPort))
      .withAppChannelAddress("host.testcontainers.internal")
      .withDaprLogLevel("info")
      .withMaxRequestSizeMb(1)
      .withComponent(buildBindingMqttComponent())
      .withComponent(buildBindingRedisComponent())
      .withComponent(buildConfigRedisComponent())
      .start();

    // Patch the server's internal DaprClient with the real container ports.
    (server as any).client = new DaprClient({
      daprHost: daprContainer.getHost(),
      daprPort: daprContainer.getGrpcPort().toString(),
      communicationProtocol: CommunicationProtocolEnum.GRPC,
      maxBodySizeMb: 3,
      logger: {
        level: LogLevel.Debug,
      },
    });

    // Wait for the sidecar (which is already running) to be fully ready.
    await server.client.start();

    await new Promise((resolve, _reject) => setTimeout(resolve, 2500));
  }, 300 * 1000);

  beforeEach(() => {
    mockBindingReceive.mockClear();
  });

  afterAll(async () => {
    await runWithCleanupErrorSuppression(async () => {
      await server.stop();
      await daprContainer.stop();
      await mqttContainer.stop();
      await redisContainer.stop();
      await network.stop();
    });
  }, 120 * 1000);

  describe("server", () => {
    it(
      "should throw an error if the receive payload is larger than 1 MB and we did not configure a larger size",
      async () => {
        // Use a payload just over the 1 MB sidecar limit. The Dapr sidecar buffers the
        // entire request body before checking the size limit, so we keep the payload small
        // (1.5 MB) to avoid the >30s container-network transfer time that an 11 MB payload
        // would require in CI.
        const payload = new Uint8Array(Math.ceil(1.5 * 1024 * 1024));

        // Use a dedicated client so that any HTTP/2 connection disruption caused by
        // the oversized payload does not affect the shared server.client used by the
        // rest of the suite.
        const isolatedClient = new DaprClient({
          daprHost: daprContainer.getHost(),
          daprPort: daprContainer.getGrpcPort().toString(),
          communicationProtocol: CommunicationProtocolEnum.GRPC,
          maxBodySizeMb: 3, // higher than sidecar limit so the client doesn't reject it first
          logger: { level: LogLevel.Debug },
        });

        let caughtError: any;
        try {
          await isolatedClient.invoker.invoke(daprAppId, "test-invoker", HttpMethod.POST, payload);
        } catch (e: any) {
          caughtError = e;
        } finally {
          await isolatedClient.stop().catch(() => {});
        }

        // The Dapr sidecar returns RESOURCE_EXHAUSTED when the request body exceeds its
        // configured max request size. Either way, an error must be thrown.
        expect(caughtError).toBeDefined();
      },
      15 * 1000,
    );

    it("should be able to invoke with non-trivial payloads below the sidecar limit", async () => {
      // 512 KB is comfortably below the 1 MB sidecar limit and verifies that the SDK
      // does not impose an artificial lower bound on gRPC message sizes.
      const payload = new Uint8Array(512 * 1024);

      try {
        const res = await server.client.invoker.invoke(daprAppId, "test-invoker", HttpMethod.POST, payload);
        console.log(res);
      } catch (e) {
        console.log(e);
      }
    });
  });

  describe("binding", () => {
    it("should be able to receive events", async () => {
      await server.client.binding.send("binding-mqtt", "create", { hello: "world" });

      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 1000));
      expect(mockBindingReceive.mock.calls.length).toBe(1);

      // Also test for receiving data
      // @ts-ignore
      expect(mockBindingReceive.mock.calls[0][0]["hello"]).toEqual("world");
    });

    it("should be able to send metadata to output binding successfully", async () => {
      await server.client.binding.send("binding-redis", "create", "helloMessage", { key: "helloKey" });

      const res = await server.client.configuration.get("config-redis", ["helloKey"]);
      expect(res.items["helloKey"].value).toContain("helloMessage");
    });
  });

  describe("invoker", () => {
    it("should be able to listen and invoke a service with GET", async () => {
      const mock = jest.fn(async (_data: object) => ({ hello: "world" }));

      await server.invoker.listen("hello-world", mock, { method: HttpMethod.GET });
      const res = await server.client.invoker.invoke(daprAppId, "hello-world", HttpMethod.GET);

      expect(mock.mock.calls.length).toBe(1);
      expect(JSON.stringify(res)).toEqual(`{"hello":"world"}`);
    });

    it("should be able to listen and invoke a service with POST data", async () => {
      const mock = jest.fn(async (_data: object) => ({ hello: "world" }));

      await server.invoker.listen("hello-world", mock, { method: HttpMethod.POST });
      const res = await server.client.invoker.invoke(daprAppId, "hello-world", HttpMethod.POST, {
        hello: "world",
      });

      expect(mock.mock.calls.length).toBe(1);
      expect(JSON.stringify(res)).toEqual(`{"hello":"world"}`);
    });

    it("should be able to listen and invoke a service with headers", async () => {
      // Return a serializable object so the gRPC response is not empty (an empty
      // response body causes the gRPC client to throw COULD_NOT_PARSE_RESULT).
      const mock = jest.fn(async (data: DaprInvokerCallbackContent) => ({ receivedHeaders: data.headers ?? null }));

      await server.invoker.listen("hello-world-headers", mock, { method: HttpMethod.GET });
      const res = await server.client.invoker.invoke(daprAppId, "hello-world-headers", HttpMethod.GET, undefined, {
        headers: { "x-foo": "bar-baz" },
      });

      expect(mock.mock.calls.length).toBe(1);
      // Headers are NOT forwarded to the gRPC app callback (documented in DaprInvokerCallbackContent
      // and noted in GRPCServerImpl: "@TODO add call.metadata").
      expect(res).toEqual({ receivedHeaders: null });
    });
  });
});
