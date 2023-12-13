/*
Copyright 2023 The Dapr Authors
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

import { CommunicationProtocolEnum, DaprServer, DaprPubSubStatusEnum } from "../../../src";
import * as NodeJSUtil from "../../../src/utils/NodeJS.util";

const serverHost = "127.0.0.1";
const serverGrpcPort = "50001";
const serverHttpPort = "3501";
const daprHost = "127.0.0.1";
const daprGrpcPort = "50000";
const daprHttpPort = "3500";
const customPort = "50002";

const protocolHttp = "http";
const protocolGrpc = "grpc";
const pubSubName = "pubsub-mqtt"; // MQTT is required by the tests with wilcard routes
const topicDefault = "test-topic";
const topicRawPayload = "test-topic-raw";
const topicOptionsWithCallback = "test-topic-options-callback";
const topicSimpleRoute = "test-topic-routes-1";
const topicLeadingSlashRoute = "test-topic-routes-2";
const topicCustomRules = "test-topic-routes-3";
const topicCustomRulesInOptions = "test-topic-routes-4";
const topicWithoutCallback = "test-topic-routes-5";
const topicWithDeadletter = "test-topic-6";
const topicWithDeadletterInOptions = "test-topic-7";
const topicWithDeadletterInOptionsDefault = "test-topic-8";
const topicWithDeadletterAndErrorCb = "test-topic-9";
const topicWithStatusCb = "test-topic-status-callback";
const topicWithBulk = "test-topic-bulk";
const topicWildcardHash = "myhome/groundfloor/#";
const topicWildcardPlus = "myhome/firstfloor/+/temperature";
const deadLetterTopic = "deadletter-topic";
const routeSimple = "simple-route";
const routeWithLeadingSlash = "/leading-slash-route";
const defaultDeadLetterTopic = "deadletter";
const bulkSubscribeTopic = "bulk-subscribe-topic";
const bulkSubscribeClodEventTopic = "bulk-subscribe-ce-topic";
const bulkSubscribeCloudEventToRawPayloadTopic = "bulk-subscribe-ce-rp-topic";
const bulkSubscribeRawPayloadToClodEventTopic = "bulk-subscribe-rp-ce-topic";

// Set timeout to 10s for all tests
jest.setTimeout(10000);

describe("common/server", () => {
  let httpServer: DaprServer;
  let grpcServer: DaprServer;

  const getTopic = (topic: string, protocol: string) => protocol + "-" + topic;
  const mockSubscribeHandler = jest.fn(async (_data: object, _headers: object) => null);
  const mockBulkSubscribeRawPayloadHandler = jest.fn(async (_data: object, _headers: object) => null);
  const mockBulkSubscribeCEHandler = jest.fn(async (_data: object, _headers: object) => null);
  const mockBulkSubscribeCloudEventToRawPayloadHandler = jest.fn(async (_data: object, _headers: object) => null);
  const mockBulkSubscribeRawPayloadToCloudEventHandler = jest.fn(async (_data: object, _headers: object) => null);
  const mockSubscribeDeadletterHandler = jest.fn(async (_data: object, _headers: object) => null);

  const mockSubscribeStatusHandlerVars: {
    [protocol: string]: {
      counter: number;
    };
  } = {
    http: {
      counter: 0,
    },
    grpc: {
      counter: 0,
    },
  };

  const mockSubscribeStatusHandler = jest.fn(async (_protocol: string, _data: string, _headers: object) => {
    switch (_data) {
      case "DROP":
        return DaprPubSubStatusEnum.DROP;
      case "TEST_RETRY_TWICE":
        if (mockSubscribeStatusHandlerVars[_protocol]["counter"] < 2) {
          mockSubscribeStatusHandlerVars[_protocol]["counter"]++;
          return DaprPubSubStatusEnum.RETRY;
        }

        // Once we reach the SUCCESS, we reset it
        // we can check the state of # calls in the mock
        mockSubscribeStatusHandlerVars[_protocol]["counter"] = 0;

        return DaprPubSubStatusEnum.SUCCESS;
      default:
        mockSubscribeStatusHandlerVars[_protocol]["counter"] = 0;
        return DaprPubSubStatusEnum.SUCCESS;
    }
  });

  const mockSubscribeErrorHandler = jest.fn(async (_data: object, _headers: object) => {
    throw new Error("This will DROP the message!");
  });

  const sampleRoutes = {
    default: "/default",
    rules: [
      {
        match: `event.type == "type-1"`,
        path: "/type-1",
      },
      {
        match: `event.type == "type-2"`,
        path: "/type-2",
      },
    ],
  };

  beforeAll(async () => {
    httpServer = new DaprServer({
      serverHost,
      serverPort: serverHttpPort,
      communicationProtocol: CommunicationProtocolEnum.HTTP,
      clientOptions: {
        daprHost,
        daprPort: daprHttpPort,
      },
    });
    grpcServer = new DaprServer({
      serverHost,
      serverPort: serverGrpcPort,
      communicationProtocol: CommunicationProtocolEnum.GRPC,
      clientOptions: {
        daprHost,
        daprPort: daprGrpcPort,
      },
    });

    await setupPubSubSubscriptions();
    // Sleep to make the tests less flaky.
    // TODO: https://github.com/dapr/js-sdk/issues/560
    await NodeJSUtil.sleep(2000);

    await httpServer.start();
    await grpcServer.start();
    // Sleep for 2 seconds to get servers ready
    await NodeJSUtil.sleep(2000);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await httpServer.stop();
    await grpcServer.stop();
  });

  // Helper function to run the test for both HTTP and gRPC.
  const runIt = async (name: string, fn: (server: DaprServer, protocol: string) => void) => {
    it(protocolHttp + "/" + name, async () => fn(httpServer, protocolHttp));
    it(protocolGrpc + "/" + name, async () => fn(grpcServer, protocolGrpc));
  };

  describe("pubsub", () => {
    runIt(
      "should mark messages as processed successfully (SUCCESS) by-default, and the same message should not be received anymore",
      async (server: DaprServer, protocol: string) => {
        const res = await server.client.pubsub.publish(pubSubName, getTopic(topicWithStatusCb, protocol), "SUCCESS");
        expect(res.error).toBeUndefined();
        // Delay a bit for event to arrive
        await new Promise((resolve, _reject) => setTimeout(resolve, 2000));
        expect(mockSubscribeStatusHandler.mock.calls.length).toBe(1);
        expect(mockSubscribeStatusHandler.mock.calls[0][1]).toEqual("SUCCESS");
        expect(mockSubscribeDeadletterHandler.mock.calls.length).toBe(0);
      },
    );

    runIt(
      "should mark messages as retried (RETRY), and the same message should be received again until we send SUCCESS",
      async (server: DaprServer, protocol: string) => {
        const res = await server.client.pubsub.publish(
          pubSubName,
          getTopic(topicWithStatusCb, protocol),
          "TEST_RETRY_TWICE",
        );
        expect(res.error).toBeUndefined();
        // Delay a bit for event to arrive
        await new Promise((resolve, _reject) => setTimeout(resolve, 1000));
        // 3 as we retry twice
        expect(mockSubscribeStatusHandler.mock.calls.length).toBe(3);
        expect(mockSubscribeDeadletterHandler.mock.calls.length).toBe(0);
      },
    );

    runIt(
      "should mark messages as dropped (DROP), and the message should be deadlettered",
      async (server: DaprServer, protocol: string) => {
        const res = await server.client.pubsub.publish(pubSubName, getTopic(topicWithStatusCb, protocol), "DROP");
        expect(res.error).toBeUndefined();
        // Delay a bit for event to arrive
        await new Promise((resolve, _reject) => setTimeout(resolve, 1000));
        expect(mockSubscribeStatusHandler.mock.calls.length).toBe(1);
        expect(mockSubscribeStatusHandler.mock.calls[0][1]).toEqual("DROP");
      },
    );

    runIt("should be able to send and receive plain events", async (server: DaprServer, protocol: string) => {
      const res = await server.client.pubsub.publish(pubSubName, getTopic(topicDefault, protocol), "Hello, world!");
      expect(res.error).toBeUndefined();
      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 1000));
      expect(mockSubscribeHandler.mock.calls.length).toBe(1);
      expect(mockSubscribeHandler.mock.calls[0][0]).toEqual("Hello, world!");
      const headers = mockSubscribeHandler.mock.calls[0][1] as any;
      expect(headers["pubsubname"]).toEqual(pubSubName);
      if (protocol === protocolHttp) {
        expect(headers["content-type"]).toEqual("application/cloudevents+json");
      }
    });

    runIt(
      "should be able to publish multiple rawPayload messages and receive events using bulk subscribe",
      async (server: DaprServer, protocol: string) => {
        const res1 = await server.client.pubsub.publish(
          pubSubName,
          getTopic(bulkSubscribeTopic, protocol),
          {
            message: "Message 1!",
          },
          { metadata: { rawPayload: "true" } },
        );
        const res2 = await server.client.pubsub.publish(
          pubSubName,
          getTopic(bulkSubscribeTopic, protocol),
          {
            message: "Message 2!",
          },
          { metadata: { rawPayload: "true" } },
        );
        expect(res1.error).toBeUndefined();
        expect(res2.error).toBeUndefined();
        // Delay a bit for event to arrive
        await new Promise((resolve, _reject) => setTimeout(resolve, 4000));
        expect(mockBulkSubscribeRawPayloadHandler.mock.calls.length).toBe(2);
        expect(mockBulkSubscribeRawPayloadHandler.mock.calls[0][0]).toEqual({ message: "Message 1!" });
        expect(mockBulkSubscribeRawPayloadHandler.mock.calls[1][0]).toEqual({ message: "Message 2!" });
      },
    );

    runIt(
      "should be able to publish multiple CloudEvents and receive events using bulk subscribe",
      async (server: DaprServer, protocol: string) => {
        const res1 = await server.client.pubsub.publish(pubSubName, getTopic(bulkSubscribeClodEventTopic, protocol), {
          message: "Message 1!",
        });
        const res2 = await server.client.pubsub.publish(pubSubName, getTopic(bulkSubscribeClodEventTopic, protocol), {
          message: "Message 2!",
        });
        expect(res1.error).toBeUndefined();
        expect(res2.error).toBeUndefined();
        // Delay a bit for event to arrive
        await new Promise((resolve, _reject) => setTimeout(resolve, 4000));
        expect(mockBulkSubscribeCEHandler.mock.calls.length).toBe(2);
        expect(mockBulkSubscribeCEHandler.mock.calls[0][0]).toEqual({ message: "Message 1!" });
        expect(mockBulkSubscribeCEHandler.mock.calls[1][0]).toEqual({ message: "Message 2!" });
      },
    );

    runIt(
      "should be able to publish multiple CloudEvents but receive rawPayload events using bulk subscribe",
      async (server: DaprServer, protocol: string) => {
        const res1 = await server.client.pubsub.publish(
          pubSubName,
          getTopic(bulkSubscribeCloudEventToRawPayloadTopic, protocol),
          {
            message: "Message 1!",
          },
        );
        const res2 = await server.client.pubsub.publish(
          pubSubName,
          getTopic(bulkSubscribeCloudEventToRawPayloadTopic, protocol),
          {
            message: "Message 2!",
          },
        );
        expect(res1.error).toBeUndefined();
        expect(res2.error).toBeUndefined();
        // Delay a bit for event to arrive
        await new Promise((resolve, _reject) => setTimeout(resolve, 4000));
        expect(mockBulkSubscribeCloudEventToRawPayloadHandler.mock.calls.length).toBe(2);
        expect(getDataFromCEObject(mockBulkSubscribeCloudEventToRawPayloadHandler.mock.calls[0][0])).toEqual({
          message: "Message 1!",
        });
        expect(getDataFromCEObject(mockBulkSubscribeCloudEventToRawPayloadHandler.mock.calls[1][0])).toEqual({
          message: "Message 2!",
        });
      },
    );

    runIt(
      "should be able to publish multiple rawPayload messages and receive CloudEvents using bulk subscribe",
      async (server: DaprServer, protocol: string) => {
        const res1 = await server.client.pubsub.publish(
          pubSubName,
          getTopic(bulkSubscribeRawPayloadToClodEventTopic, protocol),
          {
            message: "Message 1!",
          },
          { metadata: { rawPayload: "true" } },
        );
        const res2 = await server.client.pubsub.publish(
          pubSubName,
          getTopic(bulkSubscribeRawPayloadToClodEventTopic, protocol),
          {
            message: "Message 2!",
          },
          { metadata: { rawPayload: "true" } },
        );
        expect(res1.error).toBeUndefined();
        expect(res2.error).toBeUndefined();
        // Delay a bit for event to arrive
        await new Promise((resolve, _reject) => setTimeout(resolve, 4000));
        expect(mockBulkSubscribeRawPayloadToCloudEventHandler.mock.calls.length).toBe(2);
      },
    );

    runIt("should be able to send and receive JSON events", async (server: DaprServer, protocol: string) => {
      const res = await server.client.pubsub.publish(pubSubName, getTopic(topicDefault, protocol), {
        message: "Hello, world!",
      });
      expect(res.error).toBeUndefined();
      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 1000));
      expect(mockSubscribeHandler.mock.calls.length).toBe(1);
      expect(mockSubscribeHandler.mock.calls[0][0]).toEqual({ message: "Hello, world!" });
    });

    runIt("should be able to send and receive cloudevents", async (server: DaprServer, protocol: string) => {
      const ce = {
        specversion: "1.0",
        type: "com.github.pull.create",
        source: "https://github.com/cloudevents/spec/pull",
        id: "A234-1234-1234",
        data: "Hello, world!",
        datacontenttype: "text/plain",
      };
      const res = await server.client.pubsub.publish(pubSubName, getTopic(topicDefault, protocol), ce);
      expect(res.error).toBeUndefined();
      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 500));
      expect(mockSubscribeHandler.mock.calls.length).toBe(1);
      expect(mockSubscribeHandler.mock.calls[0][0]).toEqual("Hello, world!");
    });

    runIt("should be able to send cloudevents as JSON and receive it", async (server: DaprServer, protocol: string) => {
      const ce = {
        specversion: "1.0",
        type: "com.github.pull.create",
        source: "https://github.com/cloudevents/spec/pull",
        id: "A234-1234-1234",
        data: "Hello, world!",
        datacontenttype: "text/plain",
      };
      const options = { contentType: "application/json" };
      const res = await server.client.pubsub.publish(pubSubName, getTopic(topicDefault, protocol), ce, options);
      expect(res.error).toBeUndefined();
      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 500));
      expect(mockSubscribeHandler.mock.calls.length).toBe(1);
      // The cloudevent should contain an inner cloudevent since the content type was application/json
      const innerCe: any = mockSubscribeHandler.mock.calls[0][0];
      expect(innerCe["data"]).toEqual("Hello, world!");
    });

    runIt(
      "should be able to send plain events and receive as raw payload",
      async (server: DaprServer, protocol: string) => {
        const res = await server.client.pubsub.publish(
          pubSubName,
          getTopic(topicRawPayload, protocol),
          "Hello, world!",
        );
        expect(res.error).toBeUndefined();
        // Delay a bit for event to arrive
        await new Promise((resolve, _reject) => setTimeout(resolve, 1000));
        expect(mockSubscribeHandler.mock.calls.length).toBe(1);
        const rawData: any = mockSubscribeHandler.mock.calls[0][0];
        expect(rawData["data"]).toEqual("Hello, world!");
      },
    );

    runIt(
      "should be able to send JSON events and receive as raw payload",
      async (server: DaprServer, protocol: string) => {
        const res = await server.client.pubsub.publish(pubSubName, getTopic(topicRawPayload, protocol), {
          message: "Hello, world!",
        });
        expect(res.error).toBeUndefined();
        // Delay a bit for event to arrive
        await new Promise((resolve, _reject) => setTimeout(resolve, 1000));
        expect(mockSubscribeHandler.mock.calls.length).toBe(1);
        const rawData: any = mockSubscribeHandler.mock.calls[0][0];
        expect(rawData["data"]).toEqual({ message: "Hello, world!" });
      },
    );

    runIt(
      "should be able to send and receive plain events as raw payload",
      async (server: DaprServer, protocol: string) => {
        const res = await server.client.pubsub.publish(
          pubSubName,
          getTopic(topicRawPayload, protocol),
          "Hello, world!",
          { metadata: { rawPayload: "true" } },
        );
        expect(res.error).toBeUndefined();
        // Delay a bit for event to arrive
        await new Promise((resolve, _reject) => setTimeout(resolve, 1000));
        expect(mockSubscribeHandler.mock.calls.length).toBe(1);
        expect(mockSubscribeHandler.mock.calls[0][0]).toEqual("Hello, world!");
      },
    );

    runIt(
      "should be able to send and receive JSON events as raw payload",
      async (server: DaprServer, protocol: string) => {
        const res = await server.client.pubsub.publish(
          pubSubName,
          getTopic(topicRawPayload, protocol),
          { message: "Hello, world!" },
          { metadata: { rawPayload: "true" } },
        );
        expect(res.error).toBeUndefined();
        // Delay a bit for event to arrive
        await new Promise((resolve, _reject) => setTimeout(resolve, 1000));
        expect(mockSubscribeHandler.mock.calls.length).toBe(1);
        expect(mockSubscribeHandler.mock.calls[0][0]).toEqual({ message: "Hello, world!" });
      },
    );

    runIt(
      "should be able to send and receive events when using options callback without a route",
      async (server: DaprServer, protocol: string) => {
        const res = await server.client.pubsub.publish(pubSubName, getTopic(topicOptionsWithCallback, protocol), {
          message: "Hello, world!",
        });
        expect(res.error).toBeUndefined();
        // Delay a bit for event to arrive
        await new Promise((resolve, _reject) => setTimeout(resolve, 1000));
        expect(mockSubscribeHandler.mock.calls.length).toBe(1);
        expect(mockSubscribeHandler.mock.calls[0][0]).toEqual({ message: "Hello, world!" });
      },
    );

    runIt("should only allow one subscription per topic", async (server: DaprServer, protocol: string) => {
      const anotherMockHandler = jest.fn(async (_data: object) => null);
      const anotherTopic = getTopic(topicDefault + "-another", protocol);
      const port = protocol === protocolHttp ? daprHttpPort : daprGrpcPort;
      const commProtocol = protocol === protocolHttp ? CommunicationProtocolEnum.HTTP : CommunicationProtocolEnum.GRPC;
      let exceptionThrown = false;
      try {
        let anotherServer = new DaprServer({
          serverHost,
          serverPort: customPort,
          communicationProtocol: commProtocol,
          clientOptions: {
            daprHost,
            daprPort: port,
          },
        });
        await anotherServer.pubsub.subscribe(pubSubName, anotherTopic, anotherMockHandler);
        await anotherServer.pubsub.subscribe(pubSubName, anotherTopic, anotherMockHandler, "/another-route");
        anotherServer = undefined as any; // clean it up
      } catch (e: any) {
        exceptionThrown = true;
        expect(e.message).toEqual(
          `The topic '${anotherTopic}' is already subscribed to PubSub '${pubSubName}', there can be only one topic registered.`,
        );
      }
      expect(exceptionThrown).toBe(true);
    });

    runIt("should create subscriptions for default and custom routes", async (server: DaprServer, protocol: string) => {
      const topicRouteEntry = (topic: string, route: string) => [
        getTopic(topic, protocol),
        `/${pubSubName}--${getTopic(topic, protocol)}--${route}`,
      ];
      const topicRoutes = [
        topicRouteEntry(topicDefault, "default"),
        // topicRouteEntry(topicSimpleRoute, routeSimple),
        // topicRouteEntry(topicLeadingSlashRoute, routeWithLeadingSlash.substring(1)),
      ];
      const subs = JSON.stringify(server.pubsub.getSubscriptions());
      topicRoutes.forEach((topicRoute) => {
        expect(subs).toContain(
          JSON.stringify({
            pubsubname: pubSubName,
            topic: topicRoute[0],
            route: topicRoute[1],
          }),
        );
      });
    });

    runIt("should create subscriptions with rules and default route", async (server: DaprServer, protocol: string) => {
      const getSubscriptionEntry = (topic: string) => {
        const rules = sampleRoutes.rules.map((rule) => {
          const path = rule.path.startsWith("/") ? rule.path.substring(1) : rule.path;
          return {
            match: rule.match,
            path: `/${pubSubName}--${getTopic(topic, protocol)}--${path}`,
          };
        });
        return {
          pubsubname: pubSubName,
          topic: getTopic(topic, protocol),
          routes: {
            default: `/${pubSubName}--${getTopic(topic, protocol)}--default`,
            rules: rules,
          },
        };
      };
      const expectedSubs = [getSubscriptionEntry(topicCustomRules), getSubscriptionEntry(topicCustomRulesInOptions)];
      const subs = JSON.stringify(server.pubsub.getSubscriptions());
      expectedSubs.forEach((expectedSub) => {
        expect(subs).toContain(JSON.stringify(expectedSub));
      });
    });

    runIt(
      "should allow to register a listener without event handler callback",
      async (server: DaprServer, protocol: string) => {
        const subs = JSON.stringify(server.pubsub.getSubscriptions());
        expect(subs).toContain(
          JSON.stringify({
            pubsubname: pubSubName,
            topic: getTopic(topicWithoutCallback, protocol),
            route: `/${pubSubName}--${getTopic(topicWithoutCallback, protocol)}--default`,
          }),
        );
      },
    );

    runIt(
      "should allow to register an event handler after the server has started",
      async (server: DaprServer, protocol: string) => {
        const topic = getTopic(topicWithoutCallback, protocol);
        const count1 = server.pubsub.getSubscriptions()[pubSubName][topic].routes["default"].eventHandlers.length;
        server.pubsub.subscribeToRoute(pubSubName, topic, "", async () => null);
        const count2 = server.pubsub.getSubscriptions()[pubSubName][topic].routes["default"].eventHandlers.length;
        expect(count2).toEqual(count1 + 1);
      },
    );

    runIt("should allow to configure deadletter topic", async (server: DaprServer, protocol: string) => {
      const topic = getTopic(topicWithDeadletter, protocol);
      const topicDeadLetter = getTopic(deadLetterTopic, protocol);
      const subs = JSON.stringify(server.pubsub.getSubscriptions());
      expect(subs).toContain(
        JSON.stringify({
          pubsubname: pubSubName,
          topic: topic,
          route: `/${pubSubName}--${topic}--default`,
          deadLetterTopic: topicDeadLetter,
        }),
      );
    });

    runIt("should allow to listen on the deadletter topic", async (server: DaprServer, protocol: string) => {
      const topic = getTopic(topicWithDeadletter, protocol);
      const topicDeadLetter = getTopic(deadLetterTopic, protocol);
      const count1 = server.pubsub.getSubscriptions()[pubSubName][topic].routes[topicDeadLetter].eventHandlers.length;
      server.pubsub.subscribeToRoute(pubSubName, topic, topicDeadLetter, async () => null);
      const count2 = server.pubsub.getSubscriptions()[pubSubName][topic].routes[topicDeadLetter].eventHandlers.length;
      expect(count2).toEqual(count1 + 1);
    });

    runIt(
      "should allow to configure deadletter topic through subscribeWithOptions",
      async (server: DaprServer, protocol: string) => {
        const topic = getTopic(topicWithDeadletterInOptions, protocol);
        const topicDeadLetter = getTopic(deadLetterTopic, protocol);
        const subs = JSON.stringify(server.pubsub.getSubscriptions());
        expect(subs).toContain(
          JSON.stringify({
            pubsubname: pubSubName,
            topic: topic,
            route: `/${pubSubName}--${topic}--default`,
            deadLetterTopic: topicDeadLetter,
          }),
        );
        // Ensure that it has an event handler bound to it.
        const eventHandlers = server.pubsub.getSubscriptions()[pubSubName][topic].routes[topicDeadLetter].eventHandlers;
        expect(eventHandlers.length).toEqual(1);
      },
    );

    runIt(
      "should allow to configure deadletter topic through subscribeWithOptions with a default deadletter topic if none was provided",
      async (server: DaprServer, protocol: string) => {
        const topic = getTopic(topicWithDeadletterInOptionsDefault, protocol);
        const routes = server.pubsub.getSubscriptions()[pubSubName][topic].routes;
        expect(Object.keys(routes)).toContain(defaultDeadLetterTopic);
        expect(routes[defaultDeadLetterTopic].eventHandlers.length).toEqual(1);
      },
    );

    runIt(
      "should be able to send and receive events through deadletter",
      async (server: DaprServer, protocol: string) => {
        const res = await server.client.pubsub.publish(pubSubName, getTopic(topicWithDeadletterAndErrorCb, protocol), {
          message: "Hello, world!",
        });
        expect(res.error).toBeUndefined();
        // Delay a bit for event to arrive
        await new Promise((resolve, _reject) => setTimeout(resolve, 1000));
        expect(mockSubscribeErrorHandler).toHaveBeenCalledTimes(1);
        expect(mockSubscribeErrorHandler.mock.calls[0][0]).toEqual({ message: "Hello, world!" });
        expect(mockSubscribeHandler).toHaveBeenCalledTimes(0);
      },
    );

    runIt(
      "should be able to subscribe to wildcard topics with a # (e.g., myhome/groundfloor/#) - multi level wildcard",
      async (server: DaprServer, protocol: string) => {
        const topic = topicWildcardHash.replace("#", "foo/bar");
        await server.client.pubsub.publish(pubSubName, getTopic(topic, protocol), {
          message: "Hello, world!",
        });
        // Delay a bit for event to arrive
        await new Promise((resolve, _reject) => setTimeout(resolve, 1000));
        expect(mockSubscribeHandler.mock.calls.length).toBe(1);
        expect(mockSubscribeHandler.mock.calls[0][0]).toEqual({ message: "Hello, world!" });
      },
    );

    runIt(
      "should be able to subscribe to wildcard topics with a + (e.g., myhome/firstfloor/+/temperature) - multi level wildcard",
      async (server: DaprServer, protocol: string) => {
        const topic = topicWildcardPlus.replace("+", "foo");
        await server.client.pubsub.publish(pubSubName, getTopic(topic, protocol), {
          message: "Hello, world!",
        });
        // Delay a bit for event to arrive
        await new Promise((resolve, _reject) => setTimeout(resolve, 1000));
        expect(mockSubscribeHandler.mock.calls.length).toBe(1);
        expect(mockSubscribeHandler.mock.calls[0][0]).toEqual({ message: "Hello, world!" });
      },
    );

    runIt(
      "should be able to send and receive plain events with bulk publish",
      async (server: DaprServer, protocol: string) => {
        const messages = ["message1", "message2", "message3"];
        await server.client.pubsub.publishBulk(pubSubName, getTopic(topicWithBulk, protocol), messages);
        // Delay a bit for events to arrive
        await new Promise((resolve) => setTimeout(resolve, 1000));
        expect(mockSubscribeHandler.mock.calls.length).toBe(3);
        // Check that the messages are present
        mockSubscribeHandler.mock.calls.forEach((call) => {
          expect(messages).toContain(call[0]);
        });
      },
    );

    runIt(
      "should not allow registering a topic if it is not subscribed to",
      async (server: DaprServer, _protocol: string) => {
        const eh = jest.fn(async (_data: object) => null);

        let isThrown = false;

        // Register a subscription
        try {
          await server.pubsub.subscribeToRoute(pubSubName, "my-unexisting-topic-subscription", "", eh);
        } catch (e: any) {
          isThrown = true;

          expect(e.message).toEqual(
            `The topic 'my-unexisting-topic-subscription' is not subscribed to PubSub '${pubSubName}', cannot add event handler.`,
          );
        }

        expect(isThrown).toBe(true);
      },
    );
  });

  const setupPubSubSubscriptions = async () => {
    await httpServer.pubsub.subscribe(pubSubName, getTopic(topicDefault, protocolHttp), mockSubscribeHandler);
    await grpcServer.pubsub.subscribe(pubSubName, getTopic(topicDefault, protocolGrpc), mockSubscribeHandler);

    await grpcServer.pubsub.subscribeBulk(
      pubSubName,
      getTopic(bulkSubscribeTopic, protocolGrpc),
      mockBulkSubscribeRawPayloadHandler,
      {
        metadata: { rawPayload: true },
      },
    );

    await httpServer.pubsub.subscribeBulk(
      pubSubName,
      getTopic(bulkSubscribeTopic, protocolHttp),
      mockBulkSubscribeRawPayloadHandler,
      {
        metadata: { rawPayload: true },
      },
    );

    await grpcServer.pubsub.subscribeBulk(
      pubSubName,
      getTopic(bulkSubscribeClodEventTopic, protocolGrpc),
      mockBulkSubscribeCEHandler,
    );

    await httpServer.pubsub.subscribeBulk(
      pubSubName,
      getTopic(bulkSubscribeClodEventTopic, protocolHttp),
      mockBulkSubscribeCEHandler,
    );

    await grpcServer.pubsub.subscribeBulk(
      pubSubName,
      getTopic(bulkSubscribeCloudEventToRawPayloadTopic, protocolGrpc),
      mockBulkSubscribeCloudEventToRawPayloadHandler,
      {
        metadata: { rawPayload: true },
      },
    );

    await httpServer.pubsub.subscribeBulk(
      pubSubName,
      getTopic(bulkSubscribeCloudEventToRawPayloadTopic, protocolHttp),
      mockBulkSubscribeCloudEventToRawPayloadHandler,
      {
        metadata: { rawPayload: true },
      },
    );

    await grpcServer.pubsub.subscribeBulk(
      pubSubName,
      getTopic(bulkSubscribeRawPayloadToClodEventTopic, protocolGrpc),
      mockBulkSubscribeRawPayloadToCloudEventHandler,
    );

    await httpServer.pubsub.subscribeBulk(
      pubSubName,
      getTopic(bulkSubscribeRawPayloadToClodEventTopic, protocolHttp),
      mockBulkSubscribeRawPayloadToCloudEventHandler,
    );

    await httpServer.pubsub.subscribe(
      pubSubName,
      getTopic(topicRawPayload, protocolHttp),
      mockSubscribeHandler,
      undefined,
      { rawPayload: true },
    );

    await grpcServer.pubsub.subscribe(
      pubSubName,
      getTopic(topicRawPayload, protocolGrpc),
      mockSubscribeHandler,
      undefined,
      { rawPayload: true },
    );

    await httpServer.pubsub.subscribeWithOptions(pubSubName, getTopic(topicOptionsWithCallback, protocolHttp), {
      callback: mockSubscribeHandler,
    });

    await grpcServer.pubsub.subscribeWithOptions(pubSubName, getTopic(topicOptionsWithCallback, protocolGrpc), {
      callback: mockSubscribeHandler,
    });

    await httpServer.pubsub.subscribe(
      pubSubName,
      getTopic(topicSimpleRoute, protocolHttp),
      mockSubscribeHandler,
      routeSimple,
    );

    await grpcServer.pubsub.subscribe(
      pubSubName,
      getTopic(topicSimpleRoute, protocolGrpc),
      mockSubscribeHandler,
      routeSimple,
    );

    await httpServer.pubsub.subscribe(
      pubSubName,
      getTopic(topicLeadingSlashRoute, protocolHttp),
      mockSubscribeHandler,
      routeWithLeadingSlash,
    );

    await grpcServer.pubsub.subscribe(
      pubSubName,
      getTopic(topicLeadingSlashRoute, protocolGrpc),
      mockSubscribeHandler,
      routeWithLeadingSlash,
    );

    await httpServer.pubsub.subscribe(
      pubSubName,
      getTopic(topicCustomRules, protocolHttp),
      mockSubscribeHandler,
      sampleRoutes,
    );

    await grpcServer.pubsub.subscribe(
      pubSubName,
      getTopic(topicCustomRules, protocolGrpc),
      mockSubscribeHandler,
      sampleRoutes,
    );

    await httpServer.pubsub.subscribe(pubSubName, getTopic(topicWildcardHash, protocolHttp), mockSubscribeHandler);
    await grpcServer.pubsub.subscribe(pubSubName, getTopic(topicWildcardHash, protocolGrpc), mockSubscribeHandler);
    await httpServer.pubsub.subscribe(pubSubName, getTopic(topicWildcardPlus, protocolHttp), mockSubscribeHandler);
    await grpcServer.pubsub.subscribe(pubSubName, getTopic(topicWildcardPlus, protocolGrpc), mockSubscribeHandler);

    await httpServer.pubsub.subscribe(pubSubName, getTopic(topicWithBulk, protocolHttp), mockSubscribeHandler);
    await grpcServer.pubsub.subscribe(pubSubName, getTopic(topicWithBulk, protocolGrpc), mockSubscribeHandler);

    await httpServer.pubsub.subscribeWithOptions(pubSubName, getTopic(topicCustomRulesInOptions, protocolHttp), {
      route: sampleRoutes,
    });

    await grpcServer.pubsub.subscribeWithOptions(pubSubName, getTopic(topicCustomRulesInOptions, protocolGrpc), {
      route: sampleRoutes,
    });

    await httpServer.pubsub.subscribeWithOptions(pubSubName, getTopic(topicWithoutCallback, protocolHttp), {});
    await grpcServer.pubsub.subscribeWithOptions(pubSubName, getTopic(topicWithoutCallback, protocolGrpc), {});

    await httpServer.pubsub.subscribeWithOptions(pubSubName, getTopic(topicWithDeadletter, protocolHttp), {
      deadLetterTopic: getTopic(deadLetterTopic, protocolHttp),
    });

    await grpcServer.pubsub.subscribeWithOptions(pubSubName, getTopic(topicWithDeadletter, protocolGrpc), {
      deadLetterTopic: getTopic(deadLetterTopic, protocolGrpc),
    });

    await httpServer.pubsub.subscribeWithOptions(pubSubName, getTopic(topicWithDeadletterInOptions, protocolHttp), {
      deadLetterTopic: getTopic(deadLetterTopic, protocolHttp),
      deadLetterCallback: mockSubscribeHandler,
    });

    await grpcServer.pubsub.subscribeWithOptions(pubSubName, getTopic(topicWithDeadletterInOptions, protocolGrpc), {
      deadLetterTopic: getTopic(deadLetterTopic, protocolGrpc),
      deadLetterCallback: mockSubscribeHandler,
    });

    await httpServer.pubsub.subscribeWithOptions(
      pubSubName,
      getTopic(topicWithDeadletterInOptionsDefault, protocolHttp),
      {
        deadLetterCallback: mockSubscribeHandler,
      },
    );

    await grpcServer.pubsub.subscribeWithOptions(
      pubSubName,
      getTopic(topicWithDeadletterInOptionsDefault, protocolGrpc),
      {
        deadLetterCallback: mockSubscribeHandler,
      },
    );

    await httpServer.pubsub.subscribeWithOptions(pubSubName, getTopic(topicWithDeadletterAndErrorCb, protocolHttp), {
      deadLetterCallback: mockSubscribeHandler,
      callback: mockSubscribeErrorHandler,
    });

    await grpcServer.pubsub.subscribeWithOptions(pubSubName, getTopic(topicWithDeadletterAndErrorCb, protocolGrpc), {
      deadLetterCallback: mockSubscribeHandler,
      callback: mockSubscribeErrorHandler,
    });

    // Configure subscriptions for Status Message testing
    // to test, we use the message as the status(SUCCESS, RETRY, DROP, Other)
    // SUCCESS: Message is processed correctly
    // RETRY: Message is retried and will thus call the callback again
    // DROP: Message is dropped and will thus call the deadletter callback
    await httpServer.pubsub.subscribeWithOptions(pubSubName, getTopic(topicWithStatusCb, protocolHttp), {
      deadLetterCallback: mockSubscribeDeadletterHandler,
      callback: (_data, _headers) => mockSubscribeStatusHandler(protocolHttp, _data, _headers),
    });

    await grpcServer.pubsub.subscribeWithOptions(pubSubName, getTopic(topicWithStatusCb, protocolGrpc), {
      deadLetterCallback: mockSubscribeDeadletterHandler,
      callback: (_data, _headers) => mockSubscribeStatusHandler(protocolGrpc, _data, _headers),
    });
  };
});

function getDataFromCEObject(obj: object) {
  const values = Object.values(obj);
  return values[0];
}
