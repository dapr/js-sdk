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

import { CommunicationProtocolEnum, DaprServer, HttpMethod } from '../../../src';

const serverHost = 'localhost';
const serverPort = '50001';
const daprHost = 'localhost';
const daprPort = '50000'; // Dapr Sidecar Port of this Example Server
const daprAppId = 'test-suite';

describe('grpc/server', () => {
  let server: DaprServer;
  const mockBindingReceive = jest.fn(async (_data: object) => console.log('mockBindingReceive'));
  const mockPubSubSubscribeRouteSingleEmpty = jest.fn(async (_data: object) => { });
  const mockPubSubSubscribeRouteSingle = jest.fn(async (_data: object) => { });
  const mockPubSubSubscribeRouteSingleNoLeadingSlash = jest.fn(async (_data: object) => { });
  const mockPubSubSubscribeRouteMulti = jest.fn(async (_data: object) => { });
  const mockPubSubSubscribeError = jest.fn(async (_data: object) => { throw new Error("mockPubSubSubscribeError") });

  // We need to start listening on some endpoints already
  // this because Dapr is not dynamic and registers endpoints on boot
  beforeAll(async () => {
    server = new DaprServer(serverHost, serverPort, daprHost, daprPort, CommunicationProtocolEnum.GRPC);

    await server.binding.receive('binding-mqtt', mockBindingReceive);

    // Test with:
    // dapr publish --publish-app-id test-suite --pubsub pubsub-redis --topic test-topic --data '{ "hello": "world" }'
    await server.pubsub.subscribeWithOptions('pubsub-redis', 'topic-options-1', {});
    await server.pubsub.subscribe('pubsub-redis', 'topic-1', mockPubSubSubscribeRouteSingleEmpty);
    await server.pubsub.subscribe('pubsub-redis', 'topic-2', mockPubSubSubscribeRouteSingle, "single-route");
    await server.pubsub.subscribe('pubsub-redis', 'topic-3', mockPubSubSubscribeRouteSingleNoLeadingSlash, "/no-leading-slash");
    await server.pubsub.subscribe('pubsub-redis', 'topic-4', mockPubSubSubscribeRouteMulti, {
      default: "/default",
      rules: [
        {
          match: `event.type == "my-type-1"`,
          path: "/type-1"
        },
        {
          match: `event.type == "my-type-2"`,
          path: "/type-2"
        }
      ]
    });

    // Start server
    await server.start();

    await new Promise((resolve, _reject) => setTimeout(resolve, 2500));
  }, 10 * 1000);

  beforeEach(() => {
    mockBindingReceive.mockClear();
    mockPubSubSubscribeRouteSingleEmpty.mockClear();
    mockPubSubSubscribeRouteSingle.mockClear();
    mockPubSubSubscribeRouteSingleNoLeadingSlash.mockClear();
  });

  afterAll(async () => {
    await server.stop();
  });

  describe('binding', () => {
    it('should be able to receive events', async () => {
      await server.client.binding.send('binding-mqtt', 'create', { hello: 'world' });

      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 250));
      expect(mockBindingReceive.mock.calls.length).toBe(1);

      // Also test for receiving data
      // @ts-ignore
      expect(mockBindingReceive.mock.calls[0][0]['hello']).toEqual('world');
    });
  });

  describe('pubsub', () => {
    it('should be able to send and receive events', async () => {
      await server.client.pubsub.publish('pubsub-redis', 'topic-1', { hello: 'world' });

      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 250));

      expect(mockPubSubSubscribeRouteSingleEmpty.mock.calls.length).toBe(1);

      // Also test for receiving data
      // @ts-ignore
      expect(mockPubSubSubscribeRouteSingleEmpty.mock.calls[0][0]['hello']).toEqual('world');
    });

    it('should only allow one subscription per topic', async () => {
      const mock = jest.fn(async (_data: object) => { });

      try {
        let server2 = new DaprServer("127.0.0.1", "50002", daprHost, daprPort, CommunicationProtocolEnum.HTTP);
        await server2.pubsub.subscribe('pubsub-redis', 'demo-topic', mock);
        await server2.pubsub.subscribe('pubsub-redis', 'demo-topic', mock, '/test');
        server2 = undefined as any; // clean it up
      } catch (e: any) {
        expect(e.message).toEqual("The topic 'demo-topic' is already being subscribed to on PubSub 'pubsub-redis', there can only be one topic registered.")
      }
    });

    it('should receive if it was successful or not', async () => {
      const res = await server.client.pubsub.publish('pubsub-redis', 'topic-demo', { hello: 'world' });
      expect(res).toEqual(true);
    });

    it('should create route "default" if we don\'t provide a route', async () => {
      const subs = server.pubsub.getSubscriptions();

      expect(JSON.stringify(subs)).toContain(JSON.stringify({
        pubsubname: "pubsub-redis",
        topic: "topic-1",
        route: "/pubsub-redis--topic-1--default"
      }));
    });

    it('should create route "single-route" if we provide a single route', async () => {
      const subs = server.pubsub.getSubscriptions();

      expect(JSON.stringify(subs)).toContain(JSON.stringify({
        pubsubname: "pubsub-redis",
        topic: "topic-2",
        route: "/pubsub-redis--topic-2--single-route"
      }));
    });

    it('should create route and remove the leading slash if a route was provided with leading slash', async () => {
      const subs = server.pubsub.getSubscriptions();

      expect(JSON.stringify(subs)).toContain(JSON.stringify({
        pubsubname: "pubsub-redis",
        topic: "topic-3",
        route: "/pubsub-redis--topic-3--no-leading-slash"
      }));
    });

    it('should allow us to create a route on the Dapr Spec with rules and default', async () => {
      const subs = server.pubsub.getSubscriptions();

      expect(JSON.stringify(subs)).toContain(JSON.stringify({
        pubsubname: "pubsub-redis",
        topic: "topic-4",
        routes: {
          default: "/default",
          rules: [
            {
              match: `event.type == "my-type-1"`,
              path: "/pubsub-redis--topic-4--type-1"
            },
            {
              match: `event.type == "my-type-2"`,
              path: "/pubsub-redis--topic-4--type-2"
            }
          ]
        }
      }));
    });

    it('should correctly work if we provide a single route with custom options', async () => {
      const res = await server.client.pubsub.publish('pubsub-redis', 'topic-route-empty', { hello: 'world' });
      expect(res).toEqual(true);
    });

    it('should allow us to register a listener without event handler callback', async () => {
      const subs = server.pubsub.getSubscriptions();
      expect(JSON.stringify(subs)).toContain(JSON.stringify({
        pubsubname: "pubsub-redis",
        topic: "topic-options-1",
        route: "/pubsub-redis--topic-options-1--default"
      }));
    });

    it('should allow us to register an event handler after the server started', async () => {
      const countEventHandlers = server.pubsub.getSubscriptions()["pubsub-redis"]["topic-options-1"].routes["default"].eventHandlers.length;
      server.pubsub.subscribeOnEvent("pubsub-redis", "topic-options-1", "", async () => { });
      const countEventHandlersNew = server.pubsub.getSubscriptions()["pubsub-redis"]["topic-options-1"].routes["default"].eventHandlers.length;
      expect(countEventHandlersNew).toEqual(countEventHandlers + 1);
    });
  });

  // describe('invoker', () => {
  //   it('should be able to listen and invoke a service with GET', async () => {
  //     const mock = jest.fn(async (_data: object) => ({ hello: 'world' }));

  //     await server.invoker.listen('hello-world', mock, { method: HttpMethod.GET });
  //     const res = await server.client.invoker.invoke(daprAppId, 'hello-world', HttpMethod.GET);

  //     // Delay a bit for event to arrive
  //     // await new Promise((resolve, reject) => setTimeout(resolve, 250));

  //     expect(mock.mock.calls.length).toBe(1);
  //     expect(JSON.stringify(res)).toEqual(`{"hello":"world"}`);
  //   });

  //   it('should be able to listen and invoke a service with POST data', async () => {
  //     const mock = jest.fn(async (_data: object) => ({ hello: 'world' }));

  //     await server.invoker.listen('hello-world', mock, { method: HttpMethod.POST });
  //     const res = await server.client.invoker.invoke(daprAppId, 'hello-world', HttpMethod.POST, {
  //       hello: 'world',
  //     });

  //     // Delay a bit for event to arrive
  //     // await new Promise((resolve, reject) => setTimeout(resolve, 250));

  //     expect(mock.mock.calls.length).toBe(1);
  //     expect(JSON.stringify(res)).toEqual(`{"hello":"world"}`);
  //   });
  // });
});
