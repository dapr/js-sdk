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

import { CommunicationProtocolEnum, DaprServer, HttpMethod } from "../../../src";

const serverHost = "localhost";
const serverPort = "50001";
const daprHost = "localhost";
const daprPort = "50000"; // Dapr Sidecar Port of this Example Server
const daprAppId = "test-suite";

describe("grpc/server", () => {
  let server: DaprServer;
  const mockBindingReceive = jest.fn(async (_data: object) => null);
  const mockPubSub = jest.fn(async (_data: object) => null);
  const mockPubSubWithHeaders = jest.fn(async (_data: object, _headers: object) => null);
  const mockPubSubError = jest.fn(async (_data: object) => {
    throw new Error("DROPPING MESSAGE");
  });

  // We need to start listening on some endpoints already
  // this because Dapr is not dynamic and registers endpoints on boot
  beforeAll(async () => {
    server = new DaprServer(serverHost, serverPort, daprHost, daprPort, CommunicationProtocolEnum.GRPC);

    await server.binding.receive("binding-mqtt", mockBindingReceive);

    // Test with:
    // dapr publish --publish-app-id test-suite --pubsub pubsub-redis --topic test-topic --data '{ "hello": "world" }'
    await server.pubsub.subscribeWithOptions("pubsub-redis", "topic-options-1", {});
    await server.pubsub.subscribeWithOptions("pubsub-redis", "topic-options-2", {
      deadLetterTopic: "my-deadletter-topic",
    });
    await server.pubsub.subscribeWithOptions("pubsub-redis", "topic-options-3", {
      deadLetterTopic: "my-deadletter-topic",
      deadLetterCallback: mockPubSub,
    });
    await server.pubsub.subscribeWithOptions("pubsub-redis", "topic-options-4", { deadLetterCallback: mockPubSub });
    await server.pubsub.subscribeWithOptions("pubsub-redis", "topic-options-5", {
      callback: mockPubSubError,
      deadLetterCallback: mockPubSub,
    });
    await server.pubsub.subscribeWithOptions("pubsub-redis", "topic-options-6", { callback: mockPubSub });
    await server.pubsub.subscribeWithOptions("pubsub-redis", "topic-options-7", {
      route: {
        default: "/default",
        rules: [
          {
            match: `event.type == "my-type-1"`,
            path: "/type-1",
          },
          {
            match: `event.type == "my-type-2"`,
            path: "/type-2",
          },
        ],
      },
    });

    await server.pubsub.subscribe("pubsub-redis", "topic-1", mockPubSub);
    await server.pubsub.subscribe("pubsub-redis", "topic-2", mockPubSub, "single-route");
    await server.pubsub.subscribe("pubsub-redis", "topic-3", mockPubSub, "/no-leading-slash");
    await server.pubsub.subscribe("pubsub-redis", "topic-4", mockPubSub, {
      default: "/default",
      rules: [
        {
          match: `event.type == "my-type-1"`,
          path: "/type-1",
        },
        {
          match: `event.type == "my-type-2"`,
          path: "/type-2",
        },
      ],
    });
    await server.pubsub.subscribe("pubsub-redis", "topic-5", mockPubSubWithHeaders);
    await server.pubsub.subscribe("pubsub-redis", "topic-6", mockPubSub, undefined, { rawPayload: true });
    await server.pubsub.subscribe("pubsub-redis", "test-topic-ce-raw", mockPubSub, undefined, { rawPayload: true });
    await server.pubsub.subscribe("pubsub-redis", "test-topic-raw-raw", mockPubSub, undefined, { rawPayload: true });
    await server.pubsub.subscribe("pubsub-redis", "test-topic-raw-ce", mockPubSub);

    // Start server
    await server.start();

    await new Promise((resolve, _reject) => setTimeout(resolve, 2500));
  }, 10 * 1000);

  beforeEach(() => {
    mockBindingReceive.mockClear();
    mockPubSub.mockClear();
    mockPubSubError.mockClear();
    mockPubSubWithHeaders.mockClear();
  });

  afterAll(async () => {
    await server.stop();
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

  describe("pubsub", () => {
    it("should allow us to create a route on the Dapr Spec with rules and default", async () => {
      const subs = server.pubsub.getSubscriptions();

      expect(JSON.stringify(subs)).toContain(
        JSON.stringify({
          pubsubname: "pubsub-redis",
          topic: "topic-4",
          routes: {
            default: "/pubsub-redis--topic-4--default",
            rules: [
              {
                match: `event.type == "my-type-1"`,
                path: "/pubsub-redis--topic-4--type-1",
              },
              {
                match: `event.type == "my-type-2"`,
                path: "/pubsub-redis--topic-4--type-2",
              },
            ],
          },
        }),
      );
    });

    it("should allow us to create a route on the Dapr Spec with rules and default through subscribeWithOptions", async () => {
      const subs = server.pubsub.getSubscriptions();

      expect(JSON.stringify(subs)).toContain(
        JSON.stringify({
          pubsubname: "pubsub-redis",
          topic: "topic-options-7",
          routes: {
            default: "/pubsub-redis--topic-options-7--default",
            rules: [
              {
                match: `event.type == "my-type-1"`,
                path: "/pubsub-redis--topic-options-7--type-1",
              },
              {
                match: `event.type == "my-type-2"`,
                path: "/pubsub-redis--topic-options-7--type-2",
              },
            ],
          },
        }),
      );
    });

    it("should correctly work if we provide a single route with custom options", async () => {
      const res = await server.client.pubsub.publish("pubsub-redis", "topic-route-empty", { hello: "world" });
      expect(res.error).toBeUndefined();
    });

    it("should allow us to register a listener without event handler callback", async () => {
      const subs = server.pubsub.getSubscriptions();
      expect(JSON.stringify(subs)).toContain(
        JSON.stringify({
          pubsubname: "pubsub-redis",
          topic: "topic-options-1",
          route: "/pubsub-redis--topic-options-1--default",
        }),
      );
    });

    it("should allow us to register an event handler after the server started", async () => {
      const countEventHandlers =
        server.pubsub.getSubscriptions()["pubsub-redis"]["topic-options-1"].routes["default"].eventHandlers.length;
      server.pubsub.subscribeToRoute("pubsub-redis", "topic-options-1", "", async () => null);
      const countEventHandlersNew =
        server.pubsub.getSubscriptions()["pubsub-redis"]["topic-options-1"].routes["default"].eventHandlers.length;
      expect(countEventHandlersNew).toEqual(countEventHandlers + 1);
    });

    it("should provide a deadletter route if we pass a deadletter topic to the options", async () => {
      const subs = server.pubsub.getSubscriptions();
      expect(JSON.stringify(subs)).toContain("pubsub-redis--topic-options-2--my-deadletter-topic");
    });

    it("should allow us to listen on the deadletter topic", async () => {
      const countEventHandlers =
        server.pubsub.getSubscriptions()["pubsub-redis"]["topic-options-2"].routes["my-deadletter-topic"].eventHandlers
          .length;
      server.pubsub.subscribeToRoute("pubsub-redis", "topic-options-2", "my-deadletter-topic", async () => null);
      const countEventHandlersNew =
        server.pubsub.getSubscriptions()["pubsub-redis"]["topic-options-2"].routes["my-deadletter-topic"].eventHandlers
          .length;
      expect(countEventHandlersNew).toEqual(countEventHandlers + 1);
    });

    it("should allow us to provide deadletter support through subscribeWithOptions with named deadletter route", async () => {
      const routes = server.pubsub.getSubscriptions()["pubsub-redis"]["topic-options-3"].routes;

      // Ensure the topic is named as we passed it
      expect(Object.keys(routes)).toContain("my-deadletter-topic");

      // Ensure it has an event handler bound to it
      expect(routes["my-deadletter-topic"].eventHandlers.length).toBeGreaterThan(0);
    });

    it("should allow us to provide deadletter support through subscribeWithOptions with a default deadletter route if none was provided", async () => {
      const routes = server.pubsub.getSubscriptions()["pubsub-redis"]["topic-options-4"].routes;

      // Ensure the topic is named with the default "deadletter" if none was provided
      expect(Object.keys(routes)).toContain("deadletter");

      // Ensure it has an event handler bound to it
      expect(routes["deadletter"].eventHandlers.length).toBeGreaterThan(0);
    });

    it("should be able to send and receive events through deadletter", async () => {
      // This call will throw an error on mock mockPubSubRouteDeadletterErrorHandle
      await server.client.pubsub.publish("pubsub-redis", "topic-options-5", { hello: "world" });

      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 250));

      // We expect that deadletter was handled
      expect(mockPubSubError.mock.calls.length).toBe(1);

      // Also test for receiving data
      // @ts-ignore
      expect(mockPubSubError.mock.calls[0][0]["hello"]).toEqual("world");
    });
  });

  describe("invoker", () => {
    it("should be able to listen and invoke a service with GET", async () => {
      const mock = jest.fn(async (_data: object) => ({ hello: "world" }));

      await server.invoker.listen("hello-world", mock, { method: HttpMethod.GET });
      const res = await server.client.invoker.invoke(daprAppId, "hello-world", HttpMethod.GET);

      // Delay a bit for event to arrive
      // await new Promise((resolve, reject) => setTimeout(resolve, 250));

      expect(mock.mock.calls.length).toBe(1);
      expect(JSON.stringify(res)).toEqual(`{"hello":"world"}`);
    });

    it("should be able to listen and invoke a service with POST data", async () => {
      const mock = jest.fn(async (_data: object) => ({ hello: "world" }));

      await server.invoker.listen("hello-world", mock, { method: HttpMethod.POST });
      const res = await server.client.invoker.invoke(daprAppId, "hello-world", HttpMethod.POST, {
        hello: "world",
      });

      // Delay a bit for event to arrive
      // await new Promise((resolve, reject) => setTimeout(resolve, 250));

      expect(mock.mock.calls.length).toBe(1);
      expect(JSON.stringify(res)).toEqual(`{"hello":"world"}`);
    });
  });
});
