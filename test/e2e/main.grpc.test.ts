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

import { CommunicationProtocolEnum, DaprClient, DaprServer, HttpMethod } from '../../src';
import { testIt } from './utils';

const serverHost = '127.0.0.1';
const serverPort = '50001';
const daprHost = '127.0.0.1';
const daprPort = '50000'; // Dapr Sidecar Port of this Example Server
const daprAppId = 'test-suite';

describe('grpc/main', () => {
  let server: DaprServer;
  let client: DaprClient;
  const mockBindingReceive = jest.fn(async (_data: object) => console.log('mockBindingReceive'));
  const mockPubSubSubscribe = jest.fn(async (_data: object) => console.log('mockPubSubSubscribe'));

  // We need to start listening on some endpoints already
  // this because Dapr is not dynamic and registers endpoints on boot
  beforeAll(async () => {
    server = new DaprServer(serverHost, serverPort, daprHost, daprPort, CommunicationProtocolEnum.GRPC);
    client = new DaprClient(daprHost, daprPort, CommunicationProtocolEnum.GRPC);

    await server.binding.receive('binding-mqtt', mockBindingReceive);

    // Test with:
    // dapr publish --publish-app-id test-suite --pubsub pubsub-redis --topic test-topic --data '{ "hello": "world" }'
    await server.pubsub.subscribe('pubsub-redis', 'test-topic', mockPubSubSubscribe);

    // Start server
    await server.start();
  }, 10 * 1000);

  afterAll(async () => {
    await server.stop();
  });

  describe('metadata', () => {
    testIt('should be able to get the metadata of the Dapr sidecar', async () => {
      await client.metadata.get();

      // app id is not set in grpc?
      // expect(res.id.length).toBeGreaterThan(0);
      // expect(res.components.length).toBeGreaterThan(0);
    });

    testIt('should be able to set a custom metadata value of the Dapr sidecar', async () => {
      await client.metadata.set("testKey", "Hello World");

      const res = await client.metadata.get();

      // app id is not set in grpc?
      // expect(res.id.length).toBeGreaterThan(0);
      // expect(res.id.length).toBeGreaterThan(0);
      // expect(res.components.length).toBeGreaterThan(0);
      expect(res.extended["testKey"]).toEqual("Hello World");
    });
  });

  describe('health', () => {
    testIt('should return true if Dapr is ready', async () => {
      const res = await client.health.isHealthy();
      expect(res).toEqual(true);
    });
  });

  describe('binding', () => {
    testIt('should be able to receive events', async () => {
      await client.binding.send('binding-mqtt', 'create', { hello: 'world' });

      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 250));
      expect(mockBindingReceive.mock.calls.length).toBe(1);

      // Also test for receiving data
      // @ts-ignore
      expect(mockBindingReceive.mock.calls[0][0]['hello']).toEqual('world');
    });
  });

  describe('pubsub', () => {
    testIt('should be able to send and receive events', async () => {
      await client.pubsub.publish('pubsub-redis', 'test-topic', { hello: 'world' });

      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 250));

      expect(mockPubSubSubscribe.mock.calls.length).toBe(1);

      // Also test for receiving data
      // @ts-ignore
      expect(mockPubSubSubscribe.mock.calls[0][0]['hello']).toEqual('world');
    });

    testIt('should receive if it was successful or not', async () => {
      const res = await client.pubsub.publish('pubsub-redis', 'test-topic', { hello: 'world' });
      expect(res).toEqual(true);
    });
  });

  describe('invoker', () => {
    testIt('should be able to listen and invoke a service with GET', async () => {
      const mock = jest.fn(async (_data: object) => ({ hello: 'world' }));

      await server.invoker.listen('hello-world', mock, { method: HttpMethod.GET });
      const res = await client.invoker.invoke(daprAppId, 'hello-world', HttpMethod.GET);

      // Delay a bit for event to arrive
      // await new Promise((resolve, reject) => setTimeout(resolve, 250));

      expect(mock.mock.calls.length).toBe(1);
      expect(JSON.stringify(res)).toEqual(`{"hello":"world"}`);
    });

    testIt('should be able to listen and invoke a service with POST data', async () => {
      const mock = jest.fn(async (_data: object) => ({ hello: 'world' }));

      await server.invoker.listen('hello-world', mock, { method: HttpMethod.POST });
      const res = await client.invoker.invoke(daprAppId, 'hello-world', HttpMethod.POST, {
        hello: 'world',
      });

      // Delay a bit for event to arrive
      // await new Promise((resolve, reject) => setTimeout(resolve, 250));

      expect(mock.mock.calls.length).toBe(1);
      expect(JSON.stringify(res)).toEqual(`{"hello":"world"}`);
    });
  });

  describe('secrets', () => {
    testIt('should be able to correctly fetch the secrets by a single key', async () => {
      const res = await client.secret.get('secret-envvars', 'TEST_SECRET_1');
      expect(JSON.stringify(res)).toEqual(`{"TEST_SECRET_1":"secret_val_1"}`);
    });

    testIt('should be able to correctly fetch the secrets in bulk', async () => {
      const res = await client.secret.getBulk('secret-envvars');
      expect(Object.keys(res).length).toBeGreaterThan(1);
    });
  });

  describe('state', () => {
    testIt('should be able to save the state', async () => {
      await client.state.save('state-redis', [
        {
          key: 'key-1',
          value: 'value-1',
        },
        {
          key: 'key-2',
          value: 'value-2',
        },
        {
          key: 'key-3',
          value: 'value-3',
        },
      ]);

      const res = await client.state.get('state-redis', 'key-1');
      expect(res).toEqual('value-1');
    });

    testIt('should be able to get the state in bulk', async () => {
      await client.state.save('state-redis', [
        {
          key: 'key-1',
          value: 'value-1',
        },
        {
          key: 'key-2',
          value: 'value-2',
        },
        {
          key: 'key-3',
          value: 'value-3',
        },
      ]);

      const res = await client.state.getBulk('state-redis', ['key-3', 'key-2']);

      expect(res).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ key: 'key-2', data: 'value-2' }),
          expect.objectContaining({ key: 'key-3', data: 'value-3' }),
        ]),
      );
    });

    testIt('should be able to delete a key from the state store', async () => {
      await client.state.save('state-redis', [
        {
          key: 'key-1',
          value: 'value-1',
        },
        {
          key: 'key-2',
          value: 'value-2',
        },
        {
          key: 'key-3',
          value: 'value-3',
        },
      ]);

      await client.state.delete('state-redis', 'key-2');
      const res = await client.state.get('state-redis', 'key-2');
      expect(res).toEqual('');
    });

    testIt('should be able to perform a transaction that replaces a key and deletes another', async () => {
      await client.state.transaction('state-redis', [
        {
          operation: 'upsert',
          request: {
            key: 'key-1',
            value: 'my-new-data-1',
          },
        },
        {
          operation: 'delete',
          request: {
            key: 'key-3',
          },
        },
      ]);

      const resTransactionDelete = await client.state.get('state-redis', 'key-3');
      const resTransactionUpsert = await client.state.get('state-redis', 'key-1');
      expect(resTransactionDelete).toEqual('');
      expect(resTransactionUpsert).toEqual('my-new-data-1');
    });

    testIt('should be able to perform a transaction with metadata', async () => {
      await client.state.transaction('state-redis', [
        {
          operation: 'upsert',
          request: {
            key: 'key-with-metadata-1',
            value: 'my-new-data-with-metadata-1',
          },
        },
        {
          operation: 'delete',
          request: {
            key: 'key-with-metadata-2',
          },
        },
      ], {
        trace_id: 'mock trace id here',
      });

      const resTransactionDelete = await client.state.get('state-redis', 'key-with-metadata-2');
      const resTransactionUpsert = await client.state.get('state-redis', 'key-with-metadata-1');
      expect(resTransactionDelete).toEqual('');
      expect(resTransactionUpsert).toEqual('my-new-data-with-metadata-1');
    });
  });

  // Note: actors require an external dependency and are disabled by default for now until we can have actors in Javascript
  // describe('actors', () => {
  //     testIt('should be able to invoke a method on an actor', async () => {
  //         const clientActor = new DaprClient(daprHost, daprPortActor);

  //         await clientActor.actor.invoke("POST", "DemoActor", "MyActorId1", "SetDataAsync", { PropertyA: "hello", PropertyB: "world", ToNotExistKey: "this should not exist since we only have PropertyA and PropertyB" });
  //         const res = await clientActor.actor.invoke("GET", "DemoActor", "MyActorId1", "GetDataAsync"); // will only return PropertyA and PropertyB since these are the only properties that can be set

  //         expect(JSON.stringify(res)).toEqual(`{\"propertyA\":\"hello\",\"propertyB\":\"world\"}`);
  //     });

  //     testIt('should be able to manipulate the state through a transaction of an actor', async () => {
  //         const clientActor = new DaprClient(daprHost, daprPortActor);
  //         await clientActor.actor.stateTransaction("DemoActor", "MyActorId1", [
  //             {
  //                 operation: "upsert",
  //                 request: {
  //                     key: "key-1",
  //                     value: "my-new-data-1"
  //                 }
  //             },
  //             {
  //                 operation: "upsert",
  //                 request: {
  //                     key: "key-to-delete",
  //                     value: "my-new-data-1"
  //                 }
  //             },
  //             {
  //                 operation: "delete",
  //                 request: {
  //                     key: "key-to-delete"
  //                 }
  //             }
  //         ]);

  //         const resActorStateGet = await clientActor.actor.stateGet("DemoActor", "MyActorId1", "key-to-delete");
  //         const resActorStateGet2 = await clientActor.actor.stateGet("DemoActor", "MyActorId1", "key-1");

  //         expect(JSON.stringify(resActorStateGet)).toEqual(`{}`);
  //         expect(JSON.stringify(resActorStateGet2)).toEqual(`\"my-new-data-1\"`);
  //     });

  //     testIt('should be able to get all the actors', async () => {
  //         const clientActor = new DaprClient(daprHost, daprPortActor);

  //         const res = await clientActor.actor.getActors();
  //         console.log(res)

  //         expect(JSON.stringify(res)).toEqual(`{}`);
  //     });
  // });
});
