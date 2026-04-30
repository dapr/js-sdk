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
const serverPort = "4001";
const daprAppId = "test-suite-grpc-server";

describe("grpc/server", () => {
  let server: DaprServer;
  let network: StartedNetwork;
  let redisContainer: StartedTestContainer;
  let mqttContainer: StartedTestContainer;
  let daprContainer: StartedGrpcDaprContainer;

  // Return a small fixed response to avoid JSON-inflating large binary payloads:
  // a Uint8Array body gets UTF-8 decoded and JSON.stringify'd by the gRPC server,
  // turning 5 MB of binary into ~30 MB of escaped JSON — far exceeding sidecar limits.
  const mockInvoker = jest.fn(async (_data: object) => ({ ok: true }));
  const mockBindingReceive = jest.fn(async (_data: object) => null);

  beforeAll(async () => {
    network = await new Network().start();
    [redisContainer, mqttContainer] = await Promise.all([startRedisContainer(network), startMqttContainer(network)]);

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
        maxBodySizeMb: 20, // larger than the sidecar limit (10 MB) to support the 5 MB payload test
        logger: {
          level: LogLevel.Debug,
        },
      },
      maxBodySizeMb: 10,
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
      .withAppChannelAddress("host.docker.internal")
      .withDaprLogLevel("info")
      .withMaxRequestSizeMb(10)
      .withComponent(buildBindingMqttComponent())
      .withComponent(buildBindingRedisComponent())
      .withComponent(buildConfigRedisComponent())
      .start();

    // Patch the server's internal DaprClient with the real container ports.
    (server as any).client = new DaprClient({
      daprHost: daprContainer.getHost(),
      daprPort: daprContainer.getGrpcPort().toString(),
      communicationProtocol: CommunicationProtocolEnum.GRPC,
      maxBodySizeMb: 20,
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
      // The Dapr sidecar maintains a persistent HTTP/2 session to the gRPC app server
      // (port 3001). GRPCServer.stop() calls http2Server.close(), which waits for all
      // sessions to close. If the sidecar is still running, its session never closes and
      // server.stop() hangs indefinitely.
      //
      // Fix: stop the Dapr container FIRST (killing the sidecar closes its HTTP/2 session
      // to the app), then stop the app server (no open sessions → closes immediately).
      await daprContainer.stop();
      await server.stop();
      await mqttContainer.stop();
      await redisContainer.stop();
      await network.stop();
    });
  }, 120 * 1000);

  describe("server", () => {
    it(
      "should throw an error when sending a payload larger than the configured maxBodySizeMb limit",
      async () => {
        // The DaprClient's maxBodySizeMb sets both readMaxBytes and writeMaxBytes on the
        // ConnectRPC gRPC transport. When the serialized message exceeds writeMaxBytes, the
        // SDK fails immediately (before any data is transmitted) with ResourceExhausted.
        // This avoids the multi-minute wait caused by Go's gRPC server needing to receive
        // the full message body before it can reject it.
        const payload = new Uint8Array(11 * 1024 * 1024);

        // Use a dedicated client with the same 10 MB limit as the sidecar so the SDK
        // enforces the limit client-side for the 11 MB payload.
        const isolatedClient = new DaprClient({
          daprHost: daprContainer.getHost(),
          daprPort: daprContainer.getGrpcPort().toString(),
          communicationProtocol: CommunicationProtocolEnum.GRPC,
          maxBodySizeMb: 10, // same as sidecar — SDK rejects 11 MB before transmitting
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

        // The ConnectRPC transport rejects the request immediately with ResourceExhausted
        // (code 8) because the serialized message size exceeds writeMaxBytes (10 MB).
        expect(caughtError).toBeDefined();
      },
      15 * 1000,
    );

    it("should be able to receive payloads larger than 4 MB", async () => {
      const payload = new Uint8Array(5 * 1024 * 1024);

      const res = await server.client.invoker.invoke(daprAppId, "test-invoker", HttpMethod.POST, payload);

      expect(res).toBeDefined();
      expect(mockInvoker).toHaveBeenCalled();
    });

    it("should fail for payload > 4MB when maxBodySizeMb is NOT set (default behavior)", async () => {
      // Create a NEW container WITHOUT override
      const defaultDaprContainer = await new DaprGrpcAppContainer()
        .withNetwork(network)
        .withAppId(daprAppId)
        .withAppPort(parseInt(serverPort))
        .withAppChannelAddress("host.docker.internal")
        .withDaprLogLevel("info")
        // ❌ NO .withMaxRequestSizeMb()
        .withComponent(buildBindingMqttComponent())
        .withComponent(buildBindingRedisComponent())
        .withComponent(buildConfigRedisComponent())
        .start();

      const client = new DaprClient({
        daprHost: defaultDaprContainer.getHost(),
        daprPort: defaultDaprContainer.getGrpcPort().toString(),
        communicationProtocol: CommunicationProtocolEnum.GRPC,
      });

      await client.start();
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const payload = new Uint8Array(5 * 1024 * 1024); // 5MB (>4MB default)

      let error: any;
      try {
        await client.invoker.invoke(daprAppId, "test-invoker", HttpMethod.POST, payload);
      } catch (e: any) {
        error = e;
      }

      expect(error.message).toBeDefined();

      await client.stop().catch(() => {});
      await defaultDaprContainer.stop();
    }, 20000);
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
