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
  const mockPubSubSubscribe = jest.fn(async (_data: object) => console.log('mockPubSubSubscribe'));
  const mockPubSubSubscribeCloudEventRaw = jest.fn(async (_data: object) => console.log('mockPubSubSubscribeCloudEventRaw'));
  const mockPubSubSubscribeRawRaw = jest.fn(async (_data: object) => console.log('mockPubSubSubscribeRawRaw'));
  const mockPubSubSubscribeRawCloudEvent = jest.fn(async (_data: object) => console.log('mockPubSubSubscribeRawCloudEvent'));
  const mockPubSubSubscribeError = jest.fn(async (_data: object) => { throw new Error("mockPubSubSubscribeError") });

  // We need to start listening on some endpoints already
  // this because Dapr is not dynamic and registers endpoints on boot
  beforeAll(async () => {
    server = new DaprServer(serverHost, serverPort, daprHost, daprPort, CommunicationProtocolEnum.GRPC);

    await server.binding.receive('binding-mqtt', mockBindingReceive);

    // Test with:
    // dapr publish --publish-app-id test-suite --pubsub pubsub-redis --topic test-topic --data '{ "hello": "world" }'
    await server.pubsub.subscribe('pubsub-redis', 'test-topic', mockPubSubSubscribe);
    await server.pubsub.subscribe('pubsub-redis', 'test-topic-error', mockPubSubSubscribeError);
    await server.pubsub.subscribe('pubsub-redis', 'test-topic-ce-raw', mockPubSubSubscribeCloudEventRaw, undefined, { rawPayload: true });
    await server.pubsub.subscribe('pubsub-redis', 'test-topic-raw-raw', mockPubSubSubscribeRawRaw, undefined, { rawPayload: true });
    await server.pubsub.subscribe('pubsub-redis', 'test-topic-raw-ce', mockPubSubSubscribeRawCloudEvent);

    // Start server
    await server.start();

    await new Promise((resolve, _reject) => setTimeout(resolve, 2500));
  }, 10 * 1000);

  beforeEach(() => {
    mockBindingReceive.mockClear();
    mockPubSubSubscribe.mockClear();
    mockPubSubSubscribeCloudEventRaw.mockClear();
    mockPubSubSubscribeRawRaw.mockClear();
    mockPubSubSubscribeRawCloudEvent.mockClear();
    mockPubSubSubscribeError.mockClear();
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

    // Commenting out as it would need next version of Dapr to be used in E2E test.
    // It would specifically need changes from https://github.com/dapr/dapr/pull/5049
    // it('should be able to send metadata to output binding successfully', async () => {
    //   await server.client.binding.send('redisBinding', 'create', 'helloMessage', {"key": "helloKey"});
    //   const res = await server.client.configuration.get("config-redis", ["helloKey"]);

    //   expect(res.items[0].value).toContain("helloMessage");
    // });

  });

  describe('pubsub', () => {
    it('should be able to send and receive events', async () => {
      await server.client.pubsub.publish('pubsub-redis', 'test-topic', { hello: 'world' });

      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 250));
      expect(mockPubSubSubscribe.mock.calls.length).toBe(1);

      // Also test for receiving data
      // @ts-ignore
      expect(mockPubSubSubscribe.mock.calls[0][0]['hello']).toEqual('world');
    });

    // TODO: uncomment these tests once metadata over gRPC is supported. See https://github.com/dapr/dapr/issues/2860
    // it('should be able to send cloud event and receive raw payload', async () => {
    //   const res = await server.client.pubsub.publish('pubsub-redis', 'test-topic-ce-raw', { hello: 'world-ce-raw' });
    //   expect(res).toEqual(true);

    //   // Delay a bit for event to arrive
    //   await new Promise((resolve, _reject) => setTimeout(resolve, 250));
    //   expect(mockPubSubSubscribeCloudEventRaw.mock.calls.length).toBe(1);

    //   // Also test for receiving data
    //   // @ts-ignore
    //   const rawData = mockPubSubSubscribeCloudEventRaw.mock.calls[0][0];
    //   const data = JSON.parse(Buffer.from(rawData, 'base64').toString());
    //   // @ts-ignore
    //   expect(data['data']['hello']).toEqual('world-ce-raw');
    // })

    // it('should be able to send raw payload and receive raw payload', async () => {
    //   const res = await server.client.pubsub.publish('pubsub-redis', 'test-topic-raw-raw', { hello: 'world-raw-raw' }, { rawPayload: true });
    //   expect(res).toEqual(true);

    //   // Delay a bit for event to arrive
    //   await new Promise((resolve, _reject) => setTimeout(resolve, 250));
    //   expect(mockPubSubSubscribeRawRaw.mock.calls.length).toBe(1);

    //   // Also test for receiving data
    //   // @ts-ignore
    //   const rawData = mockPubSubSubscribeRawRaw.mock.calls[0][0]['data_base64'];
    //   const data = JSON.parse(Buffer.from(rawData, 'base64').toString());
    //   // @ts-ignore
    //   expect(data['hello']).toEqual('world-raw-raw');
    // })

    // it('should be able to send raw payload and receive cloud event', async () => {
    //   const res = await server.client.pubsub.publish('pubsub-redis', 'test-topic-raw-ce', { hello: 'world-raw-ce' }, { rawPayload: true });
    //   expect(res).toEqual(true);

    //   // Delay a bit for event to arrive
    //   await new Promise((resolve, _reject) => setTimeout(resolve, 250));
    //   expect(mockPubSubSubscribeRawCloudEvent.mock.calls.length).toBe(1);

    //   // Also test for receiving data
    //   // @ts-ignore
    //   expect(mockPubSubSubscribeRawCloudEvent.mock.calls[0][0]['hello']).toEqual('world-raw-ce');
    // })

    it('should receive if it was successful or not', async () => {
      const res = await server.client.pubsub.publish('pubsub-redis', 'test-topic', { hello: 'world' });
      expect(res).toEqual(true);
    });
  });

  describe('invoker', () => {
    it('should be able to listen and invoke a service with GET', async () => {
      const mock = jest.fn(async (_data: object) => ({ hello: 'world' }));

      await server.invoker.listen('hello-world', mock, { method: HttpMethod.GET });
      const res = await server.client.invoker.invoke(daprAppId, 'hello-world', HttpMethod.GET);

      // Delay a bit for event to arrive
      // await new Promise((resolve, reject) => setTimeout(resolve, 250));

      expect(mock.mock.calls.length).toBe(1);
      expect(JSON.stringify(res)).toEqual(`{"hello":"world"}`);
    });

    it('should be able to listen and invoke a service with POST data', async () => {
      const mock = jest.fn(async (_data: object) => ({ hello: 'world' }));

      await server.invoker.listen('hello-world', mock, { method: HttpMethod.POST });
      const res = await server.client.invoker.invoke(daprAppId, 'hello-world', HttpMethod.POST, {
        hello: 'world',
      });

      // Delay a bit for event to arrive
      // await new Promise((resolve, reject) => setTimeout(resolve, 250));

      expect(mock.mock.calls.length).toBe(1);
      expect(JSON.stringify(res)).toEqual(`{"hello":"world"}`);
    });
  });
});
