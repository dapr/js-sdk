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

import { Network, StartedNetwork, StartedTestContainer, TestContainers } from "testcontainers";
import { DaprContainer, StartedDaprContainer } from "@dapr/testcontainer-node";
import { CommunicationProtocolEnum, DaprClient, DaprServer, DaprPubSubStatusEnum } from "../../../src";
import { DaprGrpcAppContainer, StartedGrpcDaprContainer } from "../helpers/DaprGrpcAppContainer";
import {
  startRedisContainer,
  startMqttContainer,
  buildPubSubMqttComponent,
  DAPR_TEST_RUNTIME_IMAGE,
  DAPR_TEST_PLACEMENT_IMAGE,
  DAPR_TEST_SCHEDULER_IMAGE,
  runWithCleanupErrorSuppression,
} from "../helpers/containers";

const pubSubName = "pubsub-mqtt"; // MQTT is required by the tests with wildcard routes
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

function getDataFromCEObject(obj: object) {
  const values = Object.values(obj);
  return values[0];
}

describe("common/server/http", () => {
  jest.setTimeout(30000);

  let network: StartedNetwork;
  let redisContainer: StartedTestContainer;
  let mqttContainer: StartedTestContainer;
  let daprContainer: StartedDaprContainer;
  let httpServer: DaprServer;

  const protocol = "http";
  const appPort = 3501;
  const getTopic = (topic: string) => protocol + "-" + topic;

  const mockSubscribeHandler = jest.fn(async (_data: object, _headers: object) => null);
  const mockBulkSubscribeRawPayloadHandler = jest.fn(async (_data: object, _headers: object) => null);
  const mockBulkSubscribeCEHandler = jest.fn(async (_data: object, _headers: object) => null);
  const mockBulkSubscribeCloudEventToRawPayloadHandler = jest.fn(async (_data: object, _headers: object) => null);
  const mockBulkSubscribeRawPayloadToCloudEventHandler = jest.fn(async (_data: object, _headers: object) => null);
  const mockSubscribeDeadletterHandler = jest.fn(async (_data: object, _headers: object) => null);
  const mockSubscribeErrorHandler = jest.fn(async (_data: object, _headers: object) => {
    throw new Error("This will DROP the message!");
  });

  const statusHandlerVars = { counter: 0 };
  const mockSubscribeStatusHandler = jest.fn(async (_data: string, _headers: object) => {
    switch (_data) {
      case "DROP":
        return DaprPubSubStatusEnum.DROP;
      case "TEST_RETRY_TWICE":
        if (statusHandlerVars.counter < 2) {
          statusHandlerVars.counter++;
          return DaprPubSubStatusEnum.RETRY;
        }
        // Once we reach SUCCESS, reset the counter
        statusHandlerVars.counter = 0;
        return DaprPubSubStatusEnum.SUCCESS;
      default:
        statusHandlerVars.counter = 0;
        return DaprPubSubStatusEnum.SUCCESS;
    }
  });

  beforeAll(async () => {
    network = await new Network().start();
    [redisContainer, mqttContainer] = await Promise.all([startRedisContainer(network), startMqttContainer(network)]);

    await TestContainers.exposeHostPorts(appPort);

    httpServer = new DaprServer({
      serverHost: "127.0.0.1",
      serverPort: "3501",
      communicationProtocol: CommunicationProtocolEnum.HTTP,
      clientOptions: {
        // Placeholder — replaced with real container ports after daprContainer starts below.
        daprHost: "127.0.0.1",
        daprPort: "3500",
      },
    });

    // Register all subscriptions before starting the server
    await httpServer.pubsub.subscribe(pubSubName, getTopic(topicDefault), mockSubscribeHandler);

    await httpServer.pubsub.subscribeBulk(pubSubName, getTopic(bulkSubscribeTopic), mockBulkSubscribeRawPayloadHandler, {
      metadata: { rawPayload: true },
    });

    await httpServer.pubsub.subscribeBulk(pubSubName, getTopic(bulkSubscribeClodEventTopic), mockBulkSubscribeCEHandler);

    await httpServer.pubsub.subscribeBulk(
      pubSubName,
      getTopic(bulkSubscribeCloudEventToRawPayloadTopic),
      mockBulkSubscribeCloudEventToRawPayloadHandler,
      { metadata: { rawPayload: true } },
    );

    await httpServer.pubsub.subscribeBulk(
      pubSubName,
      getTopic(bulkSubscribeRawPayloadToClodEventTopic),
      mockBulkSubscribeRawPayloadToCloudEventHandler,
    );

    await httpServer.pubsub.subscribe(pubSubName, getTopic(topicRawPayload), mockSubscribeHandler, undefined, {
      rawPayload: true,
    });

    await httpServer.pubsub.subscribeWithOptions(pubSubName, getTopic(topicOptionsWithCallback), {
      callback: mockSubscribeHandler,
    });

    await httpServer.pubsub.subscribe(pubSubName, getTopic(topicSimpleRoute), mockSubscribeHandler, routeSimple);

    await httpServer.pubsub.subscribe(
      pubSubName,
      getTopic(topicLeadingSlashRoute),
      mockSubscribeHandler,
      routeWithLeadingSlash,
    );

    await httpServer.pubsub.subscribe(pubSubName, getTopic(topicCustomRules), mockSubscribeHandler, sampleRoutes);

    await httpServer.pubsub.subscribe(pubSubName, getTopic(topicWildcardHash), mockSubscribeHandler);
    await httpServer.pubsub.subscribe(pubSubName, getTopic(topicWildcardPlus), mockSubscribeHandler);
    await httpServer.pubsub.subscribe(pubSubName, getTopic(topicWithBulk), mockSubscribeHandler);

    await httpServer.pubsub.subscribeWithOptions(pubSubName, getTopic(topicCustomRulesInOptions), {
      route: sampleRoutes,
    });

    await httpServer.pubsub.subscribeWithOptions(pubSubName, getTopic(topicWithoutCallback), {});

    await httpServer.pubsub.subscribeWithOptions(pubSubName, getTopic(topicWithDeadletter), {
      deadLetterTopic: getTopic(deadLetterTopic),
    });

    await httpServer.pubsub.subscribeWithOptions(pubSubName, getTopic(topicWithDeadletterInOptions), {
      deadLetterTopic: getTopic(deadLetterTopic),
      deadLetterCallback: mockSubscribeHandler,
    });

    await httpServer.pubsub.subscribeWithOptions(pubSubName, getTopic(topicWithDeadletterInOptionsDefault), {
      deadLetterCallback: mockSubscribeHandler,
    });

    await httpServer.pubsub.subscribeWithOptions(pubSubName, getTopic(topicWithDeadletterAndErrorCb), {
      deadLetterCallback: mockSubscribeHandler,
      callback: mockSubscribeErrorHandler,
    });

    // Configure subscriptions for Status Message testing
    // to test, we use the message as the status (SUCCESS, RETRY, DROP, Other)
    await httpServer.pubsub.subscribeWithOptions(pubSubName, getTopic(topicWithStatusCb), {
      deadLetterCallback: mockSubscribeDeadletterHandler,
      callback: (_data, _headers) => mockSubscribeStatusHandler(_data as string, _headers),
    });

    // Start ONLY the HTTP listener (no sidecar wait) so the app is already
    // listening when the Dapr container probes it during its own init.
    await httpServer.daprServer.start("127.0.0.1", "3501");

    daprContainer = await new DaprContainer(DAPR_TEST_RUNTIME_IMAGE)
      .withPlacementImage(DAPR_TEST_PLACEMENT_IMAGE)
      .withSchedulerImage(DAPR_TEST_SCHEDULER_IMAGE)
      .withNetwork(network)
      .withAppPort(appPort)
      .withAppChannelAddress("host.testcontainers.internal")
      .withComponent(buildPubSubMqttComponent())
      .start();

    // Patch the DaprClient with real container ports, then wait for sidecar.
    (httpServer as any).client = new DaprClient({
      daprHost: daprContainer.getHost(),
      daprPort: daprContainer.getHttpPort().toString(),
      communicationProtocol: CommunicationProtocolEnum.HTTP,
    });
    await httpServer.client.start();
  }, 300 * 1000);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await runWithCleanupErrorSuppression(async () => {
      await httpServer.stop();
      await daprContainer.stop();
      await mqttContainer.stop();
      await redisContainer.stop();
      await network.stop();
    });
  }, 60 * 1000);


  describe("pubsub", () => {
    it("should mark messages as processed successfully (SUCCESS) by-default, and the same message should not be received anymore", async () => {
      const res = await httpServer.client.pubsub.publish(pubSubName, getTopic(topicWithStatusCb), "SUCCESS");
      expect(res.error).toBeUndefined();
      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 2000));
      expect(mockSubscribeStatusHandler.mock.calls.length).toBe(1);
      expect(mockSubscribeStatusHandler.mock.calls[0][0]).toEqual("SUCCESS");
      expect(mockSubscribeDeadletterHandler.mock.calls.length).toBe(0);
    });

    it("should mark messages as retried (RETRY), and the same message should be received again until we send SUCCESS", async () => {
      const res = await httpServer.client.pubsub.publish(pubSubName, getTopic(topicWithStatusCb), "TEST_RETRY_TWICE");
      expect(res.error).toBeUndefined();
      // Poll until all 3 deliveries arrive (EMQX QoS1 retry interval is 3 s; poll up to 45 s for CI headroom)
      const deadline = Date.now() + 45_000;
      while (mockSubscribeStatusHandler.mock.calls.length < 3 && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      // 3 as we retry twice
      expect(mockSubscribeStatusHandler.mock.calls.length).toBe(3);
      expect(mockSubscribeDeadletterHandler.mock.calls.length).toBe(0);
    }, 60_000);

    it("should mark messages as dropped (DROP), and the message should be deadlettered", async () => {
      const res = await httpServer.client.pubsub.publish(pubSubName, getTopic(topicWithStatusCb), "DROP");
      expect(res.error).toBeUndefined();
      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 1000));
      expect(mockSubscribeStatusHandler.mock.calls.length).toBe(1);
      expect(mockSubscribeStatusHandler.mock.calls[0][0]).toEqual("DROP");
    });

    it("should be able to send and receive plain events", async () => {
      const res = await httpServer.client.pubsub.publish(pubSubName, getTopic(topicDefault), "Hello, world!");
      expect(res.error).toBeUndefined();
      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 1000));
      expect(mockSubscribeHandler.mock.calls.length).toBe(1);
      expect(mockSubscribeHandler.mock.calls[0][0]).toEqual("Hello, world!");
      const headers = mockSubscribeHandler.mock.calls[0][1] as any;
      expect(headers["pubsubname"]).toEqual(pubSubName);
      expect(headers["content-type"]).toEqual("application/cloudevents+json");
    });

    it("should be able to publish multiple rawPayload messages and receive events using bulk subscribe", async () => {
      const res1 = await httpServer.client.pubsub.publish(
        pubSubName,
        getTopic(bulkSubscribeTopic),
        { message: "Message 1!" },
        { metadata: { rawPayload: "true" } },
      );
      const res2 = await httpServer.client.pubsub.publish(
        pubSubName,
        getTopic(bulkSubscribeTopic),
        { message: "Message 2!" },
        { metadata: { rawPayload: "true" } },
      );
      expect(res1.error).toBeUndefined();
      expect(res2.error).toBeUndefined();
      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 4000));
      expect(mockBulkSubscribeRawPayloadHandler.mock.calls.length).toBe(2);
      expect(mockBulkSubscribeRawPayloadHandler.mock.calls[0][0]).toEqual({ message: "Message 1!" });
      expect(mockBulkSubscribeRawPayloadHandler.mock.calls[1][0]).toEqual({ message: "Message 2!" });
    });

    it("should be able to publish multiple CloudEvents and receive events using bulk subscribe", async () => {
      const res1 = await httpServer.client.pubsub.publish(pubSubName, getTopic(bulkSubscribeClodEventTopic), {
        message: "Message 1!",
      });
      const res2 = await httpServer.client.pubsub.publish(pubSubName, getTopic(bulkSubscribeClodEventTopic), {
        message: "Message 2!",
      });
      expect(res1.error).toBeUndefined();
      expect(res2.error).toBeUndefined();
      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 4000));
      expect(mockBulkSubscribeCEHandler.mock.calls.length).toBe(2);
      expect(mockBulkSubscribeCEHandler.mock.calls[0][0]).toEqual({ message: "Message 1!" });
      expect(mockBulkSubscribeCEHandler.mock.calls[1][0]).toEqual({ message: "Message 2!" });
    });

    it("should be able to publish multiple CloudEvents but receive rawPayload events using bulk subscribe", async () => {
      const res1 = await httpServer.client.pubsub.publish(
        pubSubName,
        getTopic(bulkSubscribeCloudEventToRawPayloadTopic),
        { message: "Message 1!" },
      );
      const res2 = await httpServer.client.pubsub.publish(
        pubSubName,
        getTopic(bulkSubscribeCloudEventToRawPayloadTopic),
        { message: "Message 2!" },
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
    });

    it("should be able to publish multiple rawPayload messages and receive CloudEvents using bulk subscribe", async () => {
      const res1 = await httpServer.client.pubsub.publish(
        pubSubName,
        getTopic(bulkSubscribeRawPayloadToClodEventTopic),
        { message: "Message 1!" },
        { metadata: { rawPayload: "true" } },
      );
      const res2 = await httpServer.client.pubsub.publish(
        pubSubName,
        getTopic(bulkSubscribeRawPayloadToClodEventTopic),
        { message: "Message 2!" },
        { metadata: { rawPayload: "true" } },
      );
      expect(res1.error).toBeUndefined();
      expect(res2.error).toBeUndefined();
      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 4000));
      expect(mockBulkSubscribeRawPayloadToCloudEventHandler.mock.calls.length).toBe(2);
    });

    it("should be able to send and receive JSON events", async () => {
      const res = await httpServer.client.pubsub.publish(pubSubName, getTopic(topicDefault), {
        message: "Hello, world!",
      });
      expect(res.error).toBeUndefined();
      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 1000));
      expect(mockSubscribeHandler.mock.calls.length).toBe(1);
      expect(mockSubscribeHandler.mock.calls[0][0]).toEqual({ message: "Hello, world!" });
    });

    it("should be able to send and receive cloudevents", async () => {
      const ce = {
        specversion: "1.0",
        type: "com.github.pull.create",
        source: "https://github.com/cloudevents/spec/pull",
        id: "A234-1234-1234",
        data: "Hello, world!",
        datacontenttype: "text/plain",
      };
      const res = await httpServer.client.pubsub.publish(pubSubName, getTopic(topicDefault), ce);
      expect(res.error).toBeUndefined();
      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 500));
      expect(mockSubscribeHandler.mock.calls.length).toBe(1);
      expect(mockSubscribeHandler.mock.calls[0][0]).toEqual("Hello, world!");
    });

    it("should be able to send cloudevents as JSON and receive it", async () => {
      const ce = {
        specversion: "1.0",
        type: "com.github.pull.create",
        source: "https://github.com/cloudevents/spec/pull",
        id: "A234-1234-1234",
        data: "Hello, world!",
        datacontenttype: "text/plain",
      };
      const options = { contentType: "application/json" };
      const res = await httpServer.client.pubsub.publish(pubSubName, getTopic(topicDefault), ce, options);
      expect(res.error).toBeUndefined();
      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 500));
      expect(mockSubscribeHandler.mock.calls.length).toBe(1);
      // The cloudevent should contain an inner cloudevent since the content type was application/json
      const innerCe: any = mockSubscribeHandler.mock.calls[0][0];
      expect(innerCe["data"]).toEqual("Hello, world!");
    });

    it("should be able to send plain events and receive as raw payload", async () => {
      const res = await httpServer.client.pubsub.publish(pubSubName, getTopic(topicRawPayload), "Hello, world!");
      expect(res.error).toBeUndefined();
      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 1000));
      expect(mockSubscribeHandler.mock.calls.length).toBe(1);
      const rawData: any = mockSubscribeHandler.mock.calls[0][0];
      expect(rawData["data"]).toEqual("Hello, world!");
    });

    it("should be able to send JSON events and receive as raw payload", async () => {
      const res = await httpServer.client.pubsub.publish(pubSubName, getTopic(topicRawPayload), {
        message: "Hello, world!",
      });
      expect(res.error).toBeUndefined();
      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 1000));
      expect(mockSubscribeHandler.mock.calls.length).toBe(1);
      const rawData: any = mockSubscribeHandler.mock.calls[0][0];
      expect(rawData["data"]).toEqual({ message: "Hello, world!" });
    });

    it("should be able to send and receive plain events as raw payload", async () => {
      const res = await httpServer.client.pubsub.publish(pubSubName, getTopic(topicRawPayload), "Hello, world!", {
        metadata: { rawPayload: "true" },
      });
      expect(res.error).toBeUndefined();
      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 1000));
      expect(mockSubscribeHandler.mock.calls.length).toBe(1);
      expect(mockSubscribeHandler.mock.calls[0][0]).toEqual("Hello, world!");
    });

    it("should be able to send and receive JSON events as raw payload", async () => {
      const res = await httpServer.client.pubsub.publish(
        pubSubName,
        getTopic(topicRawPayload),
        { message: "Hello, world!" },
        { metadata: { rawPayload: "true" } },
      );
      expect(res.error).toBeUndefined();
      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 1000));
      expect(mockSubscribeHandler.mock.calls.length).toBe(1);
      expect(mockSubscribeHandler.mock.calls[0][0]).toEqual({ message: "Hello, world!" });
    });

    it("should be able to send and receive events when using options callback without a route", async () => {
      const res = await httpServer.client.pubsub.publish(pubSubName, getTopic(topicOptionsWithCallback), {
        message: "Hello, world!",
      });
      expect(res.error).toBeUndefined();
      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 1000));
      expect(mockSubscribeHandler.mock.calls.length).toBe(1);
      expect(mockSubscribeHandler.mock.calls[0][0]).toEqual({ message: "Hello, world!" });
    });

    it("should only allow one subscription per topic", async () => {
      const anotherMockHandler = jest.fn(async (_data: object) => null);
      const anotherTopic = getTopic(topicDefault + "-another");
      let exceptionThrown = false;
      try {
        let anotherServer = new DaprServer({
          serverHost: "127.0.0.1",
          serverPort: "50002",
          communicationProtocol: CommunicationProtocolEnum.HTTP,
          clientOptions: {
            daprHost: daprContainer.getHost(),
            daprPort: daprContainer.getHttpPort().toString(),
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

    it("should create subscriptions for default and custom routes", async () => {
      const topicRouteEntry = (topic: string, route: string) => [
        getTopic(topic),
        `/${pubSubName}--${getTopic(topic)}--${route}`,
      ];
      const topicRoutes = [topicRouteEntry(topicDefault, "default")];
      const subs = JSON.stringify(httpServer.pubsub.getSubscriptions());
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

    it("should create subscriptions with rules and default route", async () => {
      const getSubscriptionEntry = (topic: string) => {
        const rules = sampleRoutes.rules.map((rule) => {
          const path = rule.path.startsWith("/") ? rule.path.substring(1) : rule.path;
          return {
            match: rule.match,
            path: `/${pubSubName}--${getTopic(topic)}--${path}`,
          };
        });
        return {
          pubsubname: pubSubName,
          topic: getTopic(topic),
          routes: {
            default: `/${pubSubName}--${getTopic(topic)}--default`,
            rules: rules,
          },
        };
      };
      const expectedSubs = [getSubscriptionEntry(topicCustomRules), getSubscriptionEntry(topicCustomRulesInOptions)];
      const subs = JSON.stringify(httpServer.pubsub.getSubscriptions());
      expectedSubs.forEach((expectedSub) => {
        expect(subs).toContain(JSON.stringify(expectedSub));
      });
    });

    it("should allow to register a listener without event handler callback", async () => {
      const subs = JSON.stringify(httpServer.pubsub.getSubscriptions());
      expect(subs).toContain(
        JSON.stringify({
          pubsubname: pubSubName,
          topic: getTopic(topicWithoutCallback),
          route: `/${pubSubName}--${getTopic(topicWithoutCallback)}--default`,
        }),
      );
    });

    it("should allow to register an event handler after the server has started", async () => {
      const topic = getTopic(topicWithoutCallback);
      const count1 = httpServer.pubsub.getSubscriptions()[pubSubName][topic].routes["default"].eventHandlers.length;
      httpServer.pubsub.subscribeToRoute(pubSubName, topic, "", async () => null);
      const count2 = httpServer.pubsub.getSubscriptions()[pubSubName][topic].routes["default"].eventHandlers.length;
      expect(count2).toEqual(count1 + 1);
    });

    it("should allow to configure deadletter topic", async () => {
      const topic = getTopic(topicWithDeadletter);
      const topicDeadLetter = getTopic(deadLetterTopic);
      const subs = JSON.stringify(httpServer.pubsub.getSubscriptions());
      expect(subs).toContain(
        JSON.stringify({
          pubsubname: pubSubName,
          topic: topic,
          route: `/${pubSubName}--${topic}--default`,
          deadLetterTopic: topicDeadLetter,
        }),
      );
    });

    it("should allow to listen on the deadletter topic", async () => {
      const topic = getTopic(topicWithDeadletter);
      const topicDeadLetter = getTopic(deadLetterTopic);
      const count1 =
        httpServer.pubsub.getSubscriptions()[pubSubName][topic].routes[topicDeadLetter].eventHandlers.length;
      httpServer.pubsub.subscribeToRoute(pubSubName, topic, topicDeadLetter, async () => null);
      const count2 =
        httpServer.pubsub.getSubscriptions()[pubSubName][topic].routes[topicDeadLetter].eventHandlers.length;
      expect(count2).toEqual(count1 + 1);
    });

    it("should allow to configure deadletter topic through subscribeWithOptions", async () => {
      const topic = getTopic(topicWithDeadletterInOptions);
      const topicDeadLetter = getTopic(deadLetterTopic);
      const subs = JSON.stringify(httpServer.pubsub.getSubscriptions());
      expect(subs).toContain(
        JSON.stringify({
          pubsubname: pubSubName,
          topic: topic,
          route: `/${pubSubName}--${topic}--default`,
          deadLetterTopic: topicDeadLetter,
        }),
      );
      // Ensure that it has an event handler bound to it.
      const eventHandlers =
        httpServer.pubsub.getSubscriptions()[pubSubName][topic].routes[topicDeadLetter].eventHandlers;
      expect(eventHandlers.length).toEqual(1);
    });

    it("should allow to configure deadletter topic through subscribeWithOptions with a default deadletter topic if none was provided", async () => {
      const topic = getTopic(topicWithDeadletterInOptionsDefault);
      const routes = httpServer.pubsub.getSubscriptions()[pubSubName][topic].routes;
      expect(Object.keys(routes)).toContain(defaultDeadLetterTopic);
      expect(routes[defaultDeadLetterTopic].eventHandlers.length).toEqual(1);
    });

    it("should be able to send and receive events through deadletter", async () => {
      const res = await httpServer.client.pubsub.publish(pubSubName, getTopic(topicWithDeadletterAndErrorCb), {
        message: "Hello, world!",
      });
      expect(res.error).toBeUndefined();
      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 1000));
      expect(mockSubscribeErrorHandler).toHaveBeenCalledTimes(1);
      expect(mockSubscribeErrorHandler.mock.calls[0][0]).toEqual({ message: "Hello, world!" });
      expect(mockSubscribeHandler).toHaveBeenCalledTimes(0);
    });

    it("should be able to subscribe to wildcard topics with a # (e.g., myhome/groundfloor/#) - multi level wildcard", async () => {
      const topic = topicWildcardHash.replace("#", "foo/bar");
      await httpServer.client.pubsub.publish(pubSubName, getTopic(topic), {
        message: "Hello, world!",
      });
      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 1000));
      expect(mockSubscribeHandler.mock.calls.length).toBe(1);
      expect(mockSubscribeHandler.mock.calls[0][0]).toEqual({ message: "Hello, world!" });
    });

    it("should be able to subscribe to wildcard topics with a + (e.g., myhome/firstfloor/+/temperature) - multi level wildcard", async () => {
      const topic = topicWildcardPlus.replace("+", "foo");
      await httpServer.client.pubsub.publish(pubSubName, getTopic(topic), {
        message: "Hello, world!",
      });
      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 1000));
      expect(mockSubscribeHandler.mock.calls.length).toBe(1);
      expect(mockSubscribeHandler.mock.calls[0][0]).toEqual({ message: "Hello, world!" });
    });

    it("should be able to send and receive plain events with bulk publish", async () => {
      const messages = ["message1", "message2", "message3"];
      await httpServer.client.pubsub.publishBulk(pubSubName, getTopic(topicWithBulk), messages);
      // Delay a bit for events to arrive
      await new Promise((resolve) => setTimeout(resolve, 1000));
      expect(mockSubscribeHandler.mock.calls.length).toBe(3);
      // Check that the messages are present
      mockSubscribeHandler.mock.calls.forEach((call) => {
        expect(messages).toContain(call[0]);
      });
    });

    it("should not allow registering a topic if it is not subscribed to", async () => {
      const eh = jest.fn(async (_data: object) => null);
      let isThrown = false;
      try {
        await httpServer.pubsub.subscribeToRoute(pubSubName, "my-unexisting-topic-subscription", "", eh);
      } catch (e: any) {
        isThrown = true;
        expect(e.message).toEqual(
          `The topic 'my-unexisting-topic-subscription' is not subscribed to PubSub '${pubSubName}', cannot add event handler.`,
        );
      }
      expect(isThrown).toBe(true);
    });
  });
});

describe("common/server/grpc", () => {
  jest.setTimeout(30000);

  let network: StartedNetwork;
  let redisContainer: StartedTestContainer;
  let mqttContainer: StartedTestContainer;
  let daprContainer: StartedGrpcDaprContainer;
  let grpcServer: DaprServer;

  const protocol = "grpc";
  const appPort = 3001;
  const getTopic = (topic: string) => protocol + "-" + topic;

  const mockSubscribeHandler = jest.fn(async (_data: object, _headers: object) => null);
  const mockBulkSubscribeRawPayloadHandler = jest.fn(async (_data: object, _headers: object) => null);
  const mockBulkSubscribeCEHandler = jest.fn(async (_data: object, _headers: object) => null);
  const mockBulkSubscribeCloudEventToRawPayloadHandler = jest.fn(async (_data: object, _headers: object) => null);
  const mockBulkSubscribeRawPayloadToCloudEventHandler = jest.fn(async (_data: object, _headers: object) => null);
  const mockSubscribeDeadletterHandler = jest.fn(async (_data: object, _headers: object) => null);
  const mockSubscribeErrorHandler = jest.fn(async (_data: object, _headers: object) => {
    throw new Error("This will DROP the message!");
  });

  const statusHandlerVars = { counter: 0 };
  const mockSubscribeStatusHandler = jest.fn(async (_data: string, _headers: object) => {
    switch (_data) {
      case "DROP":
        return DaprPubSubStatusEnum.DROP;
      case "TEST_RETRY_TWICE":
        if (statusHandlerVars.counter < 2) {
          statusHandlerVars.counter++;
          return DaprPubSubStatusEnum.RETRY;
        }
        // Once we reach SUCCESS, reset the counter
        statusHandlerVars.counter = 0;
        return DaprPubSubStatusEnum.SUCCESS;
      default:
        statusHandlerVars.counter = 0;
        return DaprPubSubStatusEnum.SUCCESS;
    }
  });

  beforeAll(async () => {
    network = await new Network().start();
    [redisContainer, mqttContainer] = await Promise.all([startRedisContainer(network), startMqttContainer(network)]);

    await TestContainers.exposeHostPorts(appPort);

    grpcServer = new DaprServer({
      serverHost: "127.0.0.1",
      serverPort: "3001",
      communicationProtocol: CommunicationProtocolEnum.GRPC,
      clientOptions: {
        // Placeholder — replaced with real container ports after daprContainer starts below.
        daprHost: "127.0.0.1",
        daprPort: "50000",
      },
    });

    // Register all subscriptions before starting the server
    await grpcServer.pubsub.subscribe(pubSubName, getTopic(topicDefault), mockSubscribeHandler);

    await grpcServer.pubsub.subscribeBulk(
      pubSubName,
      getTopic(bulkSubscribeTopic),
      mockBulkSubscribeRawPayloadHandler,
      { metadata: { rawPayload: true } },
    );

    await grpcServer.pubsub.subscribeBulk(
      pubSubName,
      getTopic(bulkSubscribeClodEventTopic),
      mockBulkSubscribeCEHandler,
    );

    await grpcServer.pubsub.subscribeBulk(
      pubSubName,
      getTopic(bulkSubscribeCloudEventToRawPayloadTopic),
      mockBulkSubscribeCloudEventToRawPayloadHandler,
      { metadata: { rawPayload: true } },
    );

    await grpcServer.pubsub.subscribeBulk(
      pubSubName,
      getTopic(bulkSubscribeRawPayloadToClodEventTopic),
      mockBulkSubscribeRawPayloadToCloudEventHandler,
    );

    await grpcServer.pubsub.subscribe(pubSubName, getTopic(topicRawPayload), mockSubscribeHandler, undefined, {
      rawPayload: true,
    });

    await grpcServer.pubsub.subscribeWithOptions(pubSubName, getTopic(topicOptionsWithCallback), {
      callback: mockSubscribeHandler,
    });

    await grpcServer.pubsub.subscribe(pubSubName, getTopic(topicSimpleRoute), mockSubscribeHandler, routeSimple);

    await grpcServer.pubsub.subscribe(
      pubSubName,
      getTopic(topicLeadingSlashRoute),
      mockSubscribeHandler,
      routeWithLeadingSlash,
    );

    await grpcServer.pubsub.subscribe(pubSubName, getTopic(topicCustomRules), mockSubscribeHandler, sampleRoutes);

    await grpcServer.pubsub.subscribe(pubSubName, getTopic(topicWildcardHash), mockSubscribeHandler);
    await grpcServer.pubsub.subscribe(pubSubName, getTopic(topicWildcardPlus), mockSubscribeHandler);
    await grpcServer.pubsub.subscribe(pubSubName, getTopic(topicWithBulk), mockSubscribeHandler);

    await grpcServer.pubsub.subscribeWithOptions(pubSubName, getTopic(topicCustomRulesInOptions), {
      route: sampleRoutes,
    });

    await grpcServer.pubsub.subscribeWithOptions(pubSubName, getTopic(topicWithoutCallback), {});

    await grpcServer.pubsub.subscribeWithOptions(pubSubName, getTopic(topicWithDeadletter), {
      deadLetterTopic: getTopic(deadLetterTopic),
    });

    await grpcServer.pubsub.subscribeWithOptions(pubSubName, getTopic(topicWithDeadletterInOptions), {
      deadLetterTopic: getTopic(deadLetterTopic),
      deadLetterCallback: mockSubscribeHandler,
    });

    await grpcServer.pubsub.subscribeWithOptions(pubSubName, getTopic(topicWithDeadletterInOptionsDefault), {
      deadLetterCallback: mockSubscribeHandler,
    });

    await grpcServer.pubsub.subscribeWithOptions(pubSubName, getTopic(topicWithDeadletterAndErrorCb), {
      deadLetterCallback: mockSubscribeHandler,
      callback: mockSubscribeErrorHandler,
    });

    // Configure subscriptions for Status Message testing
    // to test, we use the message as the status (SUCCESS, RETRY, DROP, Other)
    await grpcServer.pubsub.subscribeWithOptions(pubSubName, getTopic(topicWithStatusCb), {
      deadLetterCallback: mockSubscribeDeadletterHandler,
      callback: (_data, _headers) => mockSubscribeStatusHandler(_data as string, _headers),
    });

    // Start ONLY the gRPC listener (no sidecar wait) so the app is already
    // listening when the Dapr container probes it during its own init.
    await grpcServer.daprServer.start("127.0.0.1", "3001");

    daprContainer = await new DaprGrpcAppContainer()
      .withNetwork(network)
      .withAppPort(appPort)
      .withAppChannelAddress("host.testcontainers.internal")
      .withComponent(buildPubSubMqttComponent())
      .start();

    // Patch the DaprClient with real container ports, then wait for sidecar.
    (grpcServer as any).client = new DaprClient({
      daprHost: daprContainer.getHost(),
      daprPort: daprContainer.getGrpcPort().toString(),
      communicationProtocol: CommunicationProtocolEnum.GRPC,
    });
    await grpcServer.client.start();
  }, 300 * 1000);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await runWithCleanupErrorSuppression(async () => {
      await grpcServer.stop();
      await daprContainer.stop();
      await mqttContainer.stop();
      await redisContainer.stop();
      await network.stop();
    });
  }, 60 * 1000);

  describe("pubsub", () => {
    it("should mark messages as processed successfully (SUCCESS) by-default, and the same message should not be received anymore", async () => {
      const res = await grpcServer.client.pubsub.publish(pubSubName, getTopic(topicWithStatusCb), "SUCCESS");
      expect(res.error).toBeUndefined();
      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 2000));
      expect(mockSubscribeStatusHandler.mock.calls.length).toBe(1);
      expect(mockSubscribeStatusHandler.mock.calls[0][0]).toEqual("SUCCESS");
      expect(mockSubscribeDeadletterHandler.mock.calls.length).toBe(0);
    });

    it("should mark messages as retried (RETRY), and the same message should be received again until we send SUCCESS", async () => {
      const res = await grpcServer.client.pubsub.publish(pubSubName, getTopic(topicWithStatusCb), "TEST_RETRY_TWICE");
      expect(res.error).toBeUndefined();
      // Poll until all 3 deliveries arrive (EMQX QoS1 retry interval is 3 s; poll up to 45 s for CI headroom)
      const deadline = Date.now() + 45_000;
      while (mockSubscribeStatusHandler.mock.calls.length < 3 && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      // 3 as we retry twice
      expect(mockSubscribeStatusHandler.mock.calls.length).toBe(3);
      expect(mockSubscribeDeadletterHandler.mock.calls.length).toBe(0);
    }, 60_000);

    it("should mark messages as dropped (DROP), and the message should be deadlettered", async () => {
      const res = await grpcServer.client.pubsub.publish(pubSubName, getTopic(topicWithStatusCb), "DROP");
      expect(res.error).toBeUndefined();
      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 1000));
      expect(mockSubscribeStatusHandler.mock.calls.length).toBe(1);
      expect(mockSubscribeStatusHandler.mock.calls[0][0]).toEqual("DROP");
    });

    it("should be able to send and receive plain events", async () => {
      const res = await grpcServer.client.pubsub.publish(pubSubName, getTopic(topicDefault), "Hello, world!");
      expect(res.error).toBeUndefined();
      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 1000));
      expect(mockSubscribeHandler.mock.calls.length).toBe(1);
      expect(mockSubscribeHandler.mock.calls[0][0]).toEqual("Hello, world!");
      const headers = mockSubscribeHandler.mock.calls[0][1] as any;
      expect(headers["pubsubname"]).toEqual(pubSubName);
    });

    it("should be able to publish multiple rawPayload messages and receive events using bulk subscribe", async () => {
      const res1 = await grpcServer.client.pubsub.publish(
        pubSubName,
        getTopic(bulkSubscribeTopic),
        { message: "Message 1!" },
        { metadata: { rawPayload: "true" } },
      );
      const res2 = await grpcServer.client.pubsub.publish(
        pubSubName,
        getTopic(bulkSubscribeTopic),
        { message: "Message 2!" },
        { metadata: { rawPayload: "true" } },
      );
      expect(res1.error).toBeUndefined();
      expect(res2.error).toBeUndefined();
      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 4000));
      expect(mockBulkSubscribeRawPayloadHandler.mock.calls.length).toBe(2);
      expect(mockBulkSubscribeRawPayloadHandler.mock.calls[0][0]).toEqual({ message: "Message 1!" });
      expect(mockBulkSubscribeRawPayloadHandler.mock.calls[1][0]).toEqual({ message: "Message 2!" });
    });

    it("should be able to publish multiple CloudEvents and receive events using bulk subscribe", async () => {
      const res1 = await grpcServer.client.pubsub.publish(pubSubName, getTopic(bulkSubscribeClodEventTopic), {
        message: "Message 1!",
      });
      const res2 = await grpcServer.client.pubsub.publish(pubSubName, getTopic(bulkSubscribeClodEventTopic), {
        message: "Message 2!",
      });
      expect(res1.error).toBeUndefined();
      expect(res2.error).toBeUndefined();
      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 4000));
      expect(mockBulkSubscribeCEHandler.mock.calls.length).toBe(2);
      expect(mockBulkSubscribeCEHandler.mock.calls[0][0]).toEqual({ message: "Message 1!" });
      expect(mockBulkSubscribeCEHandler.mock.calls[1][0]).toEqual({ message: "Message 2!" });
    });

    it("should be able to publish multiple CloudEvents but receive rawPayload events using bulk subscribe", async () => {
      const res1 = await grpcServer.client.pubsub.publish(
        pubSubName,
        getTopic(bulkSubscribeCloudEventToRawPayloadTopic),
        { message: "Message 1!" },
      );
      const res2 = await grpcServer.client.pubsub.publish(
        pubSubName,
        getTopic(bulkSubscribeCloudEventToRawPayloadTopic),
        { message: "Message 2!" },
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
    });

    it("should be able to publish multiple rawPayload messages and receive CloudEvents using bulk subscribe", async () => {
      const res1 = await grpcServer.client.pubsub.publish(
        pubSubName,
        getTopic(bulkSubscribeRawPayloadToClodEventTopic),
        { message: "Message 1!" },
        { metadata: { rawPayload: "true" } },
      );
      const res2 = await grpcServer.client.pubsub.publish(
        pubSubName,
        getTopic(bulkSubscribeRawPayloadToClodEventTopic),
        { message: "Message 2!" },
        { metadata: { rawPayload: "true" } },
      );
      expect(res1.error).toBeUndefined();
      expect(res2.error).toBeUndefined();
      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 4000));
      expect(mockBulkSubscribeRawPayloadToCloudEventHandler.mock.calls.length).toBe(2);
    });

    it("should be able to send and receive JSON events", async () => {
      const res = await grpcServer.client.pubsub.publish(pubSubName, getTopic(topicDefault), {
        message: "Hello, world!",
      });
      expect(res.error).toBeUndefined();
      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 1000));
      expect(mockSubscribeHandler.mock.calls.length).toBe(1);
      expect(mockSubscribeHandler.mock.calls[0][0]).toEqual({ message: "Hello, world!" });
    });

    it("should be able to send and receive cloudevents", async () => {
      const ce = {
        specversion: "1.0",
        type: "com.github.pull.create",
        source: "https://github.com/cloudevents/spec/pull",
        id: "A234-1234-1234",
        data: "Hello, world!",
        datacontenttype: "text/plain",
      };
      const res = await grpcServer.client.pubsub.publish(pubSubName, getTopic(topicDefault), ce);
      expect(res.error).toBeUndefined();
      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 500));
      expect(mockSubscribeHandler.mock.calls.length).toBe(1);
      expect(mockSubscribeHandler.mock.calls[0][0]).toEqual("Hello, world!");
    });

    it("should be able to send cloudevents as JSON and receive it", async () => {
      const ce = {
        specversion: "1.0",
        type: "com.github.pull.create",
        source: "https://github.com/cloudevents/spec/pull",
        id: "A234-1234-1234",
        data: "Hello, world!",
        datacontenttype: "text/plain",
      };
      const options = { contentType: "application/json" };
      const res = await grpcServer.client.pubsub.publish(pubSubName, getTopic(topicDefault), ce, options);
      expect(res.error).toBeUndefined();
      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 500));
      expect(mockSubscribeHandler.mock.calls.length).toBe(1);
      // The cloudevent should contain an inner cloudevent since the content type was application/json
      const innerCe: any = mockSubscribeHandler.mock.calls[0][0];
      expect(innerCe["data"]).toEqual("Hello, world!");
    });

    it("should be able to send plain events and receive as raw payload", async () => {
      const res = await grpcServer.client.pubsub.publish(pubSubName, getTopic(topicRawPayload), "Hello, world!");
      expect(res.error).toBeUndefined();
      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 1000));
      expect(mockSubscribeHandler.mock.calls.length).toBe(1);
      const rawData: any = mockSubscribeHandler.mock.calls[0][0];
      expect(rawData["data"]).toEqual("Hello, world!");
    });

    it("should be able to send JSON events and receive as raw payload", async () => {
      const res = await grpcServer.client.pubsub.publish(pubSubName, getTopic(topicRawPayload), {
        message: "Hello, world!",
      });
      expect(res.error).toBeUndefined();
      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 1000));
      expect(mockSubscribeHandler.mock.calls.length).toBe(1);
      const rawData: any = mockSubscribeHandler.mock.calls[0][0];
      expect(rawData["data"]).toEqual({ message: "Hello, world!" });
    });

    it("should be able to send and receive plain events as raw payload", async () => {
      const res = await grpcServer.client.pubsub.publish(pubSubName, getTopic(topicRawPayload), "Hello, world!", {
        metadata: { rawPayload: "true" },
      });
      expect(res.error).toBeUndefined();
      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 1000));
      expect(mockSubscribeHandler.mock.calls.length).toBe(1);
      expect(mockSubscribeHandler.mock.calls[0][0]).toEqual("Hello, world!");
    });

    it("should be able to send and receive JSON events as raw payload", async () => {
      const res = await grpcServer.client.pubsub.publish(
        pubSubName,
        getTopic(topicRawPayload),
        { message: "Hello, world!" },
        { metadata: { rawPayload: "true" } },
      );
      expect(res.error).toBeUndefined();
      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 1000));
      expect(mockSubscribeHandler.mock.calls.length).toBe(1);
      expect(mockSubscribeHandler.mock.calls[0][0]).toEqual({ message: "Hello, world!" });
    });

    it("should be able to send and receive events when using options callback without a route", async () => {
      const res = await grpcServer.client.pubsub.publish(pubSubName, getTopic(topicOptionsWithCallback), {
        message: "Hello, world!",
      });
      expect(res.error).toBeUndefined();
      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 1000));
      expect(mockSubscribeHandler.mock.calls.length).toBe(1);
      expect(mockSubscribeHandler.mock.calls[0][0]).toEqual({ message: "Hello, world!" });
    });

    it("should only allow one subscription per topic", async () => {
      const anotherMockHandler = jest.fn(async (_data: object) => null);
      const anotherTopic = getTopic(topicDefault + "-another");
      let exceptionThrown = false;
      try {
        let anotherServer = new DaprServer({
          serverHost: "127.0.0.1",
          serverPort: "50003",
          communicationProtocol: CommunicationProtocolEnum.GRPC,
          clientOptions: {
            daprHost: daprContainer.getHost(),
            daprPort: daprContainer.getGrpcPort().toString(),
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

    it("should create subscriptions for default and custom routes", async () => {
      const topicRouteEntry = (topic: string, route: string) => [
        getTopic(topic),
        `/${pubSubName}--${getTopic(topic)}--${route}`,
      ];
      const topicRoutes = [topicRouteEntry(topicDefault, "default")];
      const subs = JSON.stringify(grpcServer.pubsub.getSubscriptions());
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

    it("should create subscriptions with rules and default route", async () => {
      const getSubscriptionEntry = (topic: string) => {
        const rules = sampleRoutes.rules.map((rule) => {
          const path = rule.path.startsWith("/") ? rule.path.substring(1) : rule.path;
          return {
            match: rule.match,
            path: `/${pubSubName}--${getTopic(topic)}--${path}`,
          };
        });
        return {
          pubsubname: pubSubName,
          topic: getTopic(topic),
          routes: {
            default: `/${pubSubName}--${getTopic(topic)}--default`,
            rules: rules,
          },
        };
      };
      const expectedSubs = [getSubscriptionEntry(topicCustomRules), getSubscriptionEntry(topicCustomRulesInOptions)];
      const subs = JSON.stringify(grpcServer.pubsub.getSubscriptions());
      expectedSubs.forEach((expectedSub) => {
        expect(subs).toContain(JSON.stringify(expectedSub));
      });
    });

    it("should allow to register a listener without event handler callback", async () => {
      const subs = JSON.stringify(grpcServer.pubsub.getSubscriptions());
      expect(subs).toContain(
        JSON.stringify({
          pubsubname: pubSubName,
          topic: getTopic(topicWithoutCallback),
          route: `/${pubSubName}--${getTopic(topicWithoutCallback)}--default`,
        }),
      );
    });

    it("should allow to register an event handler after the server has started", async () => {
      const topic = getTopic(topicWithoutCallback);
      const count1 = grpcServer.pubsub.getSubscriptions()[pubSubName][topic].routes["default"].eventHandlers.length;
      grpcServer.pubsub.subscribeToRoute(pubSubName, topic, "", async () => null);
      const count2 = grpcServer.pubsub.getSubscriptions()[pubSubName][topic].routes["default"].eventHandlers.length;
      expect(count2).toEqual(count1 + 1);
    });

    it("should allow to configure deadletter topic", async () => {
      const topic = getTopic(topicWithDeadletter);
      const topicDeadLetter = getTopic(deadLetterTopic);
      const subs = JSON.stringify(grpcServer.pubsub.getSubscriptions());
      expect(subs).toContain(
        JSON.stringify({
          pubsubname: pubSubName,
          topic: topic,
          route: `/${pubSubName}--${topic}--default`,
          deadLetterTopic: topicDeadLetter,
        }),
      );
    });

    it("should allow to listen on the deadletter topic", async () => {
      const topic = getTopic(topicWithDeadletter);
      const topicDeadLetter = getTopic(deadLetterTopic);
      const count1 =
        grpcServer.pubsub.getSubscriptions()[pubSubName][topic].routes[topicDeadLetter].eventHandlers.length;
      grpcServer.pubsub.subscribeToRoute(pubSubName, topic, topicDeadLetter, async () => null);
      const count2 =
        grpcServer.pubsub.getSubscriptions()[pubSubName][topic].routes[topicDeadLetter].eventHandlers.length;
      expect(count2).toEqual(count1 + 1);
    });

    it("should allow to configure deadletter topic through subscribeWithOptions", async () => {
      const topic = getTopic(topicWithDeadletterInOptions);
      const topicDeadLetter = getTopic(deadLetterTopic);
      const subs = JSON.stringify(grpcServer.pubsub.getSubscriptions());
      expect(subs).toContain(
        JSON.stringify({
          pubsubname: pubSubName,
          topic: topic,
          route: `/${pubSubName}--${topic}--default`,
          deadLetterTopic: topicDeadLetter,
        }),
      );
      // Ensure that it has an event handler bound to it.
      const eventHandlers =
        grpcServer.pubsub.getSubscriptions()[pubSubName][topic].routes[topicDeadLetter].eventHandlers;
      expect(eventHandlers.length).toEqual(1);
    });

    it("should allow to configure deadletter topic through subscribeWithOptions with a default deadletter topic if none was provided", async () => {
      const topic = getTopic(topicWithDeadletterInOptionsDefault);
      const routes = grpcServer.pubsub.getSubscriptions()[pubSubName][topic].routes;
      expect(Object.keys(routes)).toContain(defaultDeadLetterTopic);
      expect(routes[defaultDeadLetterTopic].eventHandlers.length).toEqual(1);
    });

    it("should be able to send and receive events through deadletter", async () => {
      const res = await grpcServer.client.pubsub.publish(pubSubName, getTopic(topicWithDeadletterAndErrorCb), {
        message: "Hello, world!",
      });
      expect(res.error).toBeUndefined();
      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 1000));
      expect(mockSubscribeErrorHandler).toHaveBeenCalledTimes(1);
      expect(mockSubscribeErrorHandler.mock.calls[0][0]).toEqual({ message: "Hello, world!" });
      expect(mockSubscribeHandler).toHaveBeenCalledTimes(0);
    });

    it("should be able to subscribe to wildcard topics with a # (e.g., myhome/groundfloor/#) - multi level wildcard", async () => {
      const topic = topicWildcardHash.replace("#", "foo/bar");
      await grpcServer.client.pubsub.publish(pubSubName, getTopic(topic), {
        message: "Hello, world!",
      });
      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 1000));
      expect(mockSubscribeHandler.mock.calls.length).toBe(1);
      expect(mockSubscribeHandler.mock.calls[0][0]).toEqual({ message: "Hello, world!" });
    });

    it("should be able to subscribe to wildcard topics with a + (e.g., myhome/firstfloor/+/temperature) - multi level wildcard", async () => {
      const topic = topicWildcardPlus.replace("+", "foo");
      await grpcServer.client.pubsub.publish(pubSubName, getTopic(topic), {
        message: "Hello, world!",
      });
      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 1000));
      expect(mockSubscribeHandler.mock.calls.length).toBe(1);
      expect(mockSubscribeHandler.mock.calls[0][0]).toEqual({ message: "Hello, world!" });
    });

    it("should be able to send and receive plain events with bulk publish", async () => {
      const messages = ["message1", "message2", "message3"];
      await grpcServer.client.pubsub.publishBulk(pubSubName, getTopic(topicWithBulk), messages);
      // Delay a bit for events to arrive
      await new Promise((resolve) => setTimeout(resolve, 1000));
      expect(mockSubscribeHandler.mock.calls.length).toBe(3);
      // Check that the messages are present
      mockSubscribeHandler.mock.calls.forEach((call) => {
        expect(messages).toContain(call[0]);
      });
    });

    it("should not allow registering a topic if it is not subscribed to", async () => {
      const eh = jest.fn(async (_data: object) => null);
      let isThrown = false;
      try {
        await grpcServer.pubsub.subscribeToRoute(pubSubName, "my-unexisting-topic-subscription", "", eh);
      } catch (e: any) {
        isThrown = true;
        expect(e.message).toEqual(
          `The topic 'my-unexisting-topic-subscription' is not subscribed to PubSub '${pubSubName}', cannot add event handler.`,
        );
      }
      expect(isThrown).toBe(true);
    });
  });
});
