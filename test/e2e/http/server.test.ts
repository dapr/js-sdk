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

const serverHost = '127.0.0.1';
const serverPort = '50001';
const daprHost = '127.0.0.1';
const daprPort = '50000'; // Dapr Sidecar Port of this Example Server
const daprAppId = 'test-suite';

describe('http/server', () => {
  let server: DaprServer;
  const mockBindingReceive = jest.fn(async (_data: object) => console.log('mockBindingReceive'));
  const mockPubSubSubscribeRouteSingleEmpty = jest.fn(async (_data: object) => { });
  const mockPubSubSubscribeRouteSingle = jest.fn(async (_data: object) => { });
  const mockPubSubSubscribeRouteSingleNoLeadingSlash = jest.fn(async (_data: object) => { });
  const mockPubSubSubscribeError = jest.fn(async (_data: object) => { throw new Error("mockPubSubSubscribeError") });

  // We need to start listening on some endpoints already
  // this because Dapr is not dynamic and registers endpoints on boot
  // we put a timeout of 10s since it takes around 4s for Dapr to boot up
  beforeAll(async () => {
    server = new DaprServer(serverHost, serverPort, daprHost, daprPort, CommunicationProtocolEnum.HTTP);

    await server.binding.receive('binding-mqtt', mockBindingReceive);

    // Test with:
    // dapr publish --publish-app-id test-suite --pubsub pubsub-redis --topic test-topic --data '{ "hello": "world" }'
    await server.pubsub.subscribe('pubsub-redis', 'topic-demo', mockPubSubSubscribeRouteSingleEmpty);
    await server.pubsub.subscribe('pubsub-redis', 'topic-demo', mockPubSubSubscribeRouteSingle, "single-route");
    await server.pubsub.subscribe('pubsub-redis', 'topic-demo', mockPubSubSubscribeRouteSingleNoLeadingSlash, "/single-route-no-leading-slash");
    // await server.pubsub.subscribe('pubsub-redis', 'topic-route-multiple', mockPubSubSubscribe);

    // Start server
    await server.start();
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

  // describe('binding', () => {
  //   it('should be able to receive events', async () => {
  //     await server.client.binding.send('binding-mqtt', 'create', { hello: 'world' });

  //     // Delay a bit for event to arrive
  //     await new Promise((resolve, _reject) => setTimeout(resolve, 250));
  //     expect(mockBindingReceive.mock.calls.length).toBe(1);

  //     // Also test for receiving data
  //     // @ts-ignore
  //     expect(mockBindingReceive.mock.calls[0][0]['hello']).toEqual('world');
  //   });
  // });

  describe('pubsub', () => {
    it('should be able to send and receive events', async () => {
      await server.client.pubsub.publish('pubsub-redis', 'topic-demo', { hello: 'world' });

      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 250));

      expect(mockPubSubSubscribeRouteSingleEmpty.mock.calls.length).toBe(1);

      // Also test for receiving data
      // @ts-ignore
      expect(mockPubSubSubscribeRouteSingleEmpty.mock.calls[0][0]['hello']).toEqual('world');
    });

    it('should receive if it was successful or not', async () => {
      const res = await server.client.pubsub.publish('pubsub-redis', 'topic-demo', { hello: 'world' });
      expect(res).toEqual(true);
    });

    it('should create route "default" if we don\'t provide a route for "topic-demo"', async () => {
      const subs = server.pubsub.getSubscriptions();

      expect(JSON.stringify(subs)).toContain(JSON.stringify({
        pubsubName: 'pubsub-redis',
        topic: 'topic-demo',
        metadata: undefined,
        route: 'pubsub-redis-topic-demo-default',
        routes: undefined,
        deadLetterTopic: undefined
      }));
    });

    it('should create route "single-route" if we provide a single route for "topic-demo"', async () => {
      const subs = server.pubsub.getSubscriptions();

      expect(JSON.stringify(subs)).toContain(JSON.stringify({
        pubsubName: 'pubsub-redis',
        topic: 'topic-demo',
        metadata: undefined,
        route: 'pubsub-redis-topic-demo-single-route',
        routes: undefined,
        deadLetterTopic: undefined
      }));
    });

    it('should create route "single-route-no-leading-slash" if we provide a single route with leading slash for "topic-demo"', async () => {
      const subs = server.pubsub.getSubscriptions();

      expect(JSON.stringify(subs)).toContain(JSON.stringify({
        pubsubName: 'pubsub-redis',
        topic: 'topic-demo',
        metadata: undefined,
        route: 'pubsub-redis-topic-demo-single-route-no-leading-slash',
        routes: undefined,
        deadLetterTopic: undefined
      }));
    });

    // it('should correctly work if we provide a single route with custom options', async () => {
    //   const res = await server.client.pubsub.publish('pubsub-redis', 'topic-route-empty', { hello: 'world' });
    //   expect(res).toEqual(true);
    // });
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
