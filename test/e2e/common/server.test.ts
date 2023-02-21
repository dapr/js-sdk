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

const serverHost = "127.0.0.1";
const serverGrpcPort = "50001";
const serverHttpPort = "3501";
const daprHost = "127.0.0.1";
const daprGrpcPort = "50000";
const daprHttpPort = "3500";
const customPort = "50002";

const protocolHttp = "http";
const protocolGrpc = "grpc";
const pubSubName = "pubsub-redis";
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
const deadLetterTopic = "deadletter-topic";
const routeSimple = "simple-route";
const routeWithLeadingSlash = "/leading-slash-route";
const defaultDeadLetterTopic = "deadletter";

describe("common/server", () => {
  let httpServer: DaprServer;
  let grpcServer: DaprServer;

  const getTopic = (topic: string, protocol: string) => topic + "-" + protocol;
  const mockSubscribeHandler = jest.fn(async (_data: object, _headers: object) => null);
  const mockSubscribeDeadletterHandler = jest.fn(async (_data: object, _headers: object) => null);

  let mockSubscribeStatusHandlerVars: {
    [protocol: string]: { 
      counter: number 
    }
  } = {
    "http": {
      counter: 0,
    },
    "grpc": {
      counter: 0,
    }
  }

  const mockSubscribeStatusHandler = jest.fn(async (_protocol: string, _data: string, _headers: object) => {
    switch (_data) {
      case "DROP":
        return DaprPubSubStatusEnum.DROP;
      case "TEST_RETRY_TWICE":
        if (mockSubscribeStatusHandlerVars[_protocol]["counter"] < 2) {
          mockSubscribeStatusHandlerVars[_protocol]["counter"]++;
          console.log(`FIRING RETRY (${_protocol}): `, mockSubscribeStatusHandlerVars[_protocol]["counter"], "/ 2")
          return DaprPubSubStatusEnum.RETRY;
        }

        // Once we reach the SUCCESS, we reset it
        console.log("RETRY TWICE DONE");
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
    httpServer = new DaprServer(serverHost, serverHttpPort, daprHost, daprHttpPort, CommunicationProtocolEnum.HTTP);
    grpcServer = new DaprServer(serverHost, serverGrpcPort, daprHost, daprGrpcPort, CommunicationProtocolEnum.GRPC);

    await setupPubSubSubscriptions();

    await httpServer.start();
    await grpcServer.start();
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
    // runIt(
    //   "should by default mark messagess as processed successfully (SUCCESS) and the same message should not be received anymore",
    //   async (server: DaprServer, protocol: string) => {
    //     const res = await server.client.pubsub.publish(pubSubName, getTopic(topicWithStatusCb, protocol), "SUCCESS");
    //     expect(res.error).toBeUndefined();

    //     // Delay a bit for event to arrive
    //     await new Promise((resolve, _reject) => setTimeout(resolve, 250));

    //     expect(mockSubscribeStatusHandler.mock.calls.length).toBe(1);
    //     expect(mockSubscribeStatusHandler.mock.calls[0][1]).toEqual("SUCCESS");

    //     expect(mockSubscribeDeadletterHandler.mock.calls.length).toBe(0);
    //   },
    // );

    runIt(
      "should mark messagess as retried (RETRY) and the same message should be received again until we send SUCCESS",
      async (server: DaprServer, protocol: string) => {
        const res = await server.client.pubsub.publish(
          pubSubName,
          getTopic(topicWithStatusCb, protocol),
          "TEST_RETRY_TWICE",
        );
        expect(res.error).toBeUndefined();

        // Delay a bit for event to arrive
        await new Promise((resolve, _reject) => setTimeout(resolve, 2500));

        expect(mockSubscribeStatusHandlerVars[protocol].counter).toBe(2);
        expect(mockSubscribeDeadletterHandler.mock.calls.length).toBe(0);
      },
    );

    // runIt(
    //   "should mark messagess as dropped (DROP) and the message should be deadlettered",
    //   async (server: DaprServer, protocol: string) => {
    //     const res = await server.client.pubsub.publish(pubSubName, getTopic(topicWithStatusCb, protocol), "DROP");
    //     expect(res.error).toBeUndefined();

    //     // Delay a bit for event to arrive
    //     await new Promise((resolve, _reject) => setTimeout(resolve, 250));

    //     // @todo: mocks are not called 3 times but the retry counter is incremented as expected?
    //     expect(mockSubscribeStatusHandler.mock.calls.length).toBe(1);
    //     expect(mockSubscribeStatusHandler.mock.calls[0][0]).toEqual("DROP");

    //     // @todo: are dropped messages thrown into deadletter?
    //     // expect(mockSubscribeDeadletterHandler.mock.calls.length).toBe(1);
    //   },
    // );

    // runIt("should be able to send and receive plain events", async (server: DaprServer, protocol: string) => {
    //   const res = await server.client.pubsub.publish(pubSubName, getTopic(topicDefault, protocol), "Hello, world!");
    //   expect(res.error).toBeUndefined();

    //   // Delay a bit for event to arrive
    //   await new Promise((resolve, _reject) => setTimeout(resolve, 250));

    //   expect(mockSubscribeHandler.mock.calls.length).toBe(1);
    //   expect(mockSubscribeHandler.mock.calls[0][0]).toEqual("Hello, world!");

    //   const headers = mockSubscribeHandler.mock.calls[0][1] as any;
    //   expect(headers["pubsubname"]).toEqual(pubSubName);

    //   if (protocol === protocolHttp) {
    //     expect(headers["content-type"]).toEqual("application/cloudevents+json");
    //   }
    // });

    // runIt("should be able to send and receive JSON events", async (server: DaprServer, protocol: string) => {
    //   const res = await server.client.pubsub.publish(pubSubName, getTopic(topicDefault, protocol), {
    //     message: "Hello, world!",
    //   });
    //   expect(res.error).toBeUndefined();

    //   // Delay a bit for event to arrive
    //   await new Promise((resolve, _reject) => setTimeout(resolve, 250));

    //   expect(mockSubscribeHandler.mock.calls.length).toBe(1);
    //   expect(mockSubscribeHandler.mock.calls[0][0]).toEqual({ message: "Hello, world!" });
    // });

    // runIt("should be able to send and receive cloud events", async (server: DaprServer, protocol: string) => {
    //   const ce = {
    //     specversion: "1.0",
    //     type: "com.github.pull.create",
    //     source: "https://github.com/cloudevents/spec/pull",
    //     id: "A234-1234-1234",
    //     data: "Hello, world!",
    //     datacontenttype: "text/plain",
    //   };

    //   const res = await server.client.pubsub.publish(pubSubName, getTopic(topicDefault, protocol), ce);
    //   expect(res.error).toBeUndefined();

    //   // Delay a bit for event to arrive
    //   await new Promise((resolve, _reject) => setTimeout(resolve, 500));

    //   expect(mockSubscribeHandler.mock.calls.length).toBe(1);
    //   expect(mockSubscribeHandler.mock.calls[0][0]).toEqual("Hello, world!");
    // });

    // runIt(
    //   "should be able to send plain events and receive as raw payload",
    //   async (server: DaprServer, protocol: string) => {
    //     const res = await server.client.pubsub.publish(
    //       pubSubName,
    //       getTopic(topicRawPayload, protocol),
    //       "Hello, world!",
    //     );
    //     expect(res.error).toBeUndefined();

    //     // Delay a bit for event to arrive
    //     await new Promise((resolve, _reject) => setTimeout(resolve, 250));

    //     expect(mockSubscribeHandler.mock.calls.length).toBe(1);
    //     const rawData: any = mockSubscribeHandler.mock.calls[0][0];
    //     expect(rawData["data"]).toEqual("Hello, world!");
    //   },
    // );

    // runIt(
    //   "should be able to send JSON events and receive as raw payload",
    //   async (server: DaprServer, protocol: string) => {
    //     const res = await server.client.pubsub.publish(pubSubName, getTopic(topicRawPayload, protocol), {
    //       message: "Hello, world!",
    //     });
    //     expect(res.error).toBeUndefined();

    //     // Delay a bit for event to arrive
    //     await new Promise((resolve, _reject) => setTimeout(resolve, 250));

    //     expect(mockSubscribeHandler.mock.calls.length).toBe(1);
    //     const rawData: any = mockSubscribeHandler.mock.calls[0][0];
    //     expect(rawData["data"]).toEqual({ message: "Hello, world!" });
    //   },
    // );

    // runIt(
    //   "should be able to send and receive plain events as raw payload",
    //   async (server: DaprServer, protocol: string) => {
    //     const res = await server.client.pubsub.publish(
    //       pubSubName,
    //       getTopic(topicRawPayload, protocol),
    //       "Hello, world!",
    //       { rawPayload: "true" },
    //     );
    //     expect(res.error).toBeUndefined();

    //     // Delay a bit for event to arrive
    //     await new Promise((resolve, _reject) => setTimeout(resolve, 250));

    //     expect(mockSubscribeHandler.mock.calls.length).toBe(1);
    //     expect(mockSubscribeHandler.mock.calls[0][0]).toEqual("Hello, world!");
    //   },
    // );

    // runIt(
    //   "should be able to send and receive JSON events as raw payload",
    //   async (server: DaprServer, protocol: string) => {
    //     const res = await server.client.pubsub.publish(
    //       pubSubName,
    //       getTopic(topicRawPayload, protocol),
    //       { message: "Hello, world!" },
    //       { rawPayload: "true" },
    //     );
    //     expect(res.error).toBeUndefined();

    //     // Delay a bit for event to arrive
    //     await new Promise((resolve, _reject) => setTimeout(resolve, 250));

    //     expect(mockSubscribeHandler.mock.calls.length).toBe(1);
    //     expect(mockSubscribeHandler.mock.calls[0][0]).toEqual({ message: "Hello, world!" });
    //   },
    // );

    // runIt(
    //   "should be able to send and receive events when using options callback without a route",
    //   async (server: DaprServer, protocol: string) => {
    //     const res = await server.client.pubsub.publish(pubSubName, getTopic(topicOptionsWithCallback, protocol), {
    //       message: "Hello, world!",
    //     });
    //     expect(res.error).toBeUndefined();

    //     // Delay a bit for event to arrive
    //     await new Promise((resolve, _reject) => setTimeout(resolve, 250));

    //     expect(mockSubscribeHandler.mock.calls.length).toBe(1);
    //     expect(mockSubscribeHandler.mock.calls[0][0]).toEqual({ message: "Hello, world!" });
    //   },
    // );

    // runIt("should only allow one subscription per topic", async (server: DaprServer, protocol: string) => {
    //   const anotherMockHandler = jest.fn(async (_data: object) => null);
    //   const anotherTopic = getTopic(topicDefault + "-another", protocol);
    //   const port = protocol === protocolHttp ? daprHttpPort : daprGrpcPort;
    //   const commProtocol = protocol === protocolHttp ? CommunicationProtocolEnum.HTTP : CommunicationProtocolEnum.GRPC;

    //   let exceptionThrown = false;

    //   try {
    //     let anotherServer = new DaprServer(serverHost, customPort, daprHost, port, commProtocol);
    //     await anotherServer.pubsub.subscribe(pubSubName, anotherTopic, anotherMockHandler);
    //     await anotherServer.pubsub.subscribe(pubSubName, anotherTopic, anotherMockHandler, "/another-route");
    //     anotherServer = undefined as any; // clean it up
    //   } catch (e: any) {
    //     exceptionThrown = true;
    //     expect(e.message).toEqual(
    //       `The topic '${anotherTopic}' is already being subscribed to on PubSub '${pubSubName}', there can only be one topic registered.`,
    //     );
    //   }

    //   expect(exceptionThrown).toBe(true);
    // });

    // runIt("should create subscriptions for default and custom routes", async (server: DaprServer, protocol: string) => {
    //   const topicRouteEntry = (topic: string, route: string) => [
    //     getTopic(topic, protocol),
    //     `/${pubSubName}--${getTopic(topic, protocol)}--${route}`,
    //   ];

    //   const topicRoutes = [
    //     topicRouteEntry(topicDefault, "default"),
    //     topicRouteEntry(topicSimpleRoute, routeSimple),
    //     topicRouteEntry(topicLeadingSlashRoute, routeWithLeadingSlash.substring(1)),
    //   ];

    //   const subs = JSON.stringify(server.pubsub.getSubscriptions());
    //   topicRoutes.forEach((topicRoute) => {
    //     expect(subs).toContain(
    //       JSON.stringify({
    //         pubsubname: pubSubName,
    //         topic: topicRoute[0],
    //         route: topicRoute[1],
    //       }),
    //     );
    //   });
    // });

    // runIt("should create subscriptions with rules and default route", async (server: DaprServer, protocol: string) => {
    //   const getSubscriptionEntry = (topic: string) => {
    //     const rules = sampleRoutes.rules.map((rule) => {
    //       const path = rule.path.startsWith("/") ? rule.path.substring(1) : rule.path;
    //       return {
    //         match: rule.match,
    //         path: `/${pubSubName}--${getTopic(topic, protocol)}--${path}`,
    //       };
    //     });
    //     return {
    //       pubsubname: pubSubName,
    //       topic: getTopic(topic, protocol),
    //       routes: {
    //         default: `/${pubSubName}--${getTopic(topic, protocol)}--default`,
    //         rules: rules,
    //       },
    //     };
    //   };

    //   const expectedSubs = [getSubscriptionEntry(topicCustomRules), getSubscriptionEntry(topicCustomRulesInOptions)];

    //   const subs = JSON.stringify(server.pubsub.getSubscriptions());
    //   expectedSubs.forEach((expectedSub) => {
    //     expect(subs).toContain(JSON.stringify(expectedSub));
    //   });
    // });

    // runIt(
    //   "should allow to register a listener without event handler callback",
    //   async (server: DaprServer, protocol: string) => {
    //     const subs = JSON.stringify(server.pubsub.getSubscriptions());

    //     expect(subs).toContain(
    //       JSON.stringify({
    //         pubsubname: pubSubName,
    //         topic: getTopic(topicWithoutCallback, protocol),
    //         route: `/${pubSubName}--${getTopic(topicWithoutCallback, protocol)}--default`,
    //       }),
    //     );
    //   },
    // );

    // runIt(
    //   "should allow to register an event handler after the server has started",
    //   async (server: DaprServer, protocol: string) => {
    //     const topic = getTopic(topicWithoutCallback, protocol);

    //     const count1 = server.pubsub.getSubscriptions()[pubSubName][topic].routes["default"].eventHandlers.length;
    //     server.pubsub.subscribeToRoute(pubSubName, topic, "", async () => null);
    //     const count2 = server.pubsub.getSubscriptions()[pubSubName][topic].routes["default"].eventHandlers.length;

    //     expect(count2).toEqual(count1 + 1);
    //   },
    // );

    // runIt("should allow to configure deadletter topic", async (server: DaprServer, protocol: string) => {
    //   const topic = getTopic(topicWithDeadletter, protocol);
    //   const topicDeadLetter = getTopic(deadLetterTopic, protocol);

    //   const subs = JSON.stringify(server.pubsub.getSubscriptions());

    //   expect(subs).toContain(
    //     JSON.stringify({
    //       pubsubname: pubSubName,
    //       topic: topic,
    //       route: `/${pubSubName}--${topic}--default`,
    //       deadLetterTopic: topicDeadLetter,
    //     }),
    //   );
    // });

    // runIt("should allow to listen on the deadletter topic", async (server: DaprServer, protocol: string) => {
    //   const topic = getTopic(topicWithDeadletter, protocol);
    //   const topicDeadLetter = getTopic(deadLetterTopic, protocol);

    //   const count1 = server.pubsub.getSubscriptions()[pubSubName][topic].routes[topicDeadLetter].eventHandlers.length;
    //   server.pubsub.subscribeToRoute(pubSubName, topic, topicDeadLetter, async () => null);
    //   const count2 = server.pubsub.getSubscriptions()[pubSubName][topic].routes[topicDeadLetter].eventHandlers.length;

    //   expect(count2).toEqual(count1 + 1);
    // });

    // runIt(
    //   "should allow to configure deadletter topic through subscribeWithOptions",
    //   async (server: DaprServer, protocol: string) => {
    //     const topic = getTopic(topicWithDeadletterInOptions, protocol);
    //     const topicDeadLetter = getTopic(deadLetterTopic, protocol);

    //     const subs = JSON.stringify(server.pubsub.getSubscriptions());
    //     expect(subs).toContain(
    //       JSON.stringify({
    //         pubsubname: pubSubName,
    //         topic: topic,
    //         route: `/${pubSubName}--${topic}--default`,
    //         deadLetterTopic: topicDeadLetter,
    //       }),
    //     );

    //     // Ensure that it has an event handler bound to it.
    //     const eventHandlers = server.pubsub.getSubscriptions()[pubSubName][topic].routes[topicDeadLetter].eventHandlers;
    //     expect(eventHandlers.length).toEqual(1);
    //   },
    // );

    // runIt(
    //   "should allow to configure deadletter topic through subscribeWithOptions with a default deadletter topic if none was provided",
    //   async (server: DaprServer, protocol: string) => {
    //     const topic = getTopic(topicWithDeadletterInOptionsDefault, protocol);

    //     const routes = server.pubsub.getSubscriptions()[pubSubName][topic].routes;
    //     expect(Object.keys(routes)).toContain(defaultDeadLetterTopic);

    //     expect(routes[defaultDeadLetterTopic].eventHandlers.length).toEqual(1);
    //   },
    // );

    // runIt(
    //   "should be able to send and receive events through deadletter",
    //   async (server: DaprServer, protocol: string) => {
    //     const res = await server.client.pubsub.publish(pubSubName, getTopic(topicWithDeadletterAndErrorCb, protocol), {
    //       message: "Hello, world!",
    //     });
    //     expect(res.error).toBeUndefined();

    //     // Delay a bit for event to arrive
    //     await new Promise((resolve, _reject) => setTimeout(resolve, 250));

    //     expect(mockSubscribeErrorHandler).toHaveBeenCalledTimes(1);
    //     expect(mockSubscribeErrorHandler.mock.calls[0][0]).toEqual({ message: "Hello, world!" });
    //     expect(mockSubscribeHandler).toHaveBeenCalledTimes(0);
    //   },
    // );
  });

  const setupPubSubSubscriptions = async () => {
    await httpServer.pubsub.subscribe(pubSubName, getTopic(topicDefault, protocolHttp), mockSubscribeHandler);
    await grpcServer.pubsub.subscribe(pubSubName, getTopic(topicDefault, protocolGrpc), mockSubscribeHandler);

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
    // to test, we use the message as the status (SUCCESS, RETRY, DROP, Other)
    // SUCCESS: Message is processed correctly
    // RETRY: Message is retried and will thus call the callback again
    // DROP: Message is dropped and will thus call the deadletter callback
    await httpServer.pubsub.subscribeWithOptions(pubSubName, getTopic(topicWithStatusCb, protocolHttp), {
      deadLetterCallback: mockSubscribeDeadletterHandler,
      callback: (_data, _headers) => mockSubscribeStatusHandler("http", _data, _headers),
    });

    await grpcServer.pubsub.subscribeWithOptions(pubSubName, getTopic(topicWithStatusCb, protocolGrpc), {
      deadLetterCallback: mockSubscribeDeadletterHandler,
      callback: (_data, _headers) => mockSubscribeStatusHandler("grpc", _data, _headers),
    });
  };
});
