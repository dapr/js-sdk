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

import { CommunicationProtocolEnum, DaprClient } from '../../../src';
import { SubscribeConfigurationResponse } from '../../../src/types/configuration/SubscribeConfigurationResponse';
import * as DockerUtils from '../../utils/DockerUtil';

const daprHost = '127.0.0.1';
const daprPort = '50000'; // Dapr Sidecar Port of this Example Server

describe('grpc/client', () => {
  let client: DaprClient;

  // We need to start listening on some endpoints already
  // this because Dapr is not dynamic and registers endpoints on boot
  beforeAll(async () => {
    client = new DaprClient(daprHost, daprPort, CommunicationProtocolEnum.GRPC);
  }, 10 * 1000);

  afterAll(async () => {
    await client.stop();
  });

  describe('sidecar', () => {
    it('should return true if the sidecar has been started', async () => {
      // Note: difficult to test as we start up dapr with dapr run, which starts the sidecar for us automatically
      // there is however a delay between the sidecar being ready and the app starting as they are started asynchronously
      // if Dapr has to connect to a component, it might introduce a delay
      // the test will thus randomly have isStarted = true or isStarted = false depending on the startup delay of the sidecar
      await client.getDaprClient().isSidecarStarted();
      // expect(isStarted).toBe(false);
    })
  });

  describe('metadata', () => {
    it('should be able to get the metadata of the Dapr sidecar', async () => {
      await client.metadata.get();

      // app id is not set in grpc?
      // expect(res.id.length).toBeGreaterThan(0);
      // expect(res.components.length).toBeGreaterThan(0);
    });

    it('should be able to set a custom metadata value of the Dapr sidecar', async () => {
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
    it('should return true if Dapr is ready', async () => {
      const res = await client.health.isHealthy();
      expect(res).toEqual(true);
    });
  });

  describe('pubsub', () => {
    it('should receive if it was successful or not', async () => {
      const res = await client.pubsub.publish('pubsub-redis', 'test-topic', { hello: 'world' });
      expect(res).toEqual(true);
    });
  });

  describe('secrets', () => {
    it('should be able to correctly fetch the secrets by a single key', async () => {
      const res = await client.secret.get('secret-envvars', 'TEST_SECRET_1');
      expect(JSON.stringify(res)).toEqual(`{"TEST_SECRET_1":"secret_val_1"}`);
    });

    it('should be able to correctly fetch the secrets in bulk', async () => {
      const res = await client.secret.getBulk('secret-envvars');
      expect(Object.keys(res).length).toBeGreaterThan(1);
    });
  });

  describe('state', () => {
    it('should be able to save the state', async () => {
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

    it('should be able to get the state in bulk', async () => {
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

    it('should be able to delete a key from the state store', async () => {
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

    it('should be able to perform a transaction that replaces a key and deletes another', async () => {
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

    it('should be able to perform a transaction with metadata', async () => {
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

  describe('configuration', () => {
    beforeEach(async () => {
      // Reset the Configuration API
      await DockerUtils.executeDockerCommand("dapr_redis redis-cli MSET myconfigkey1 key1_initialvalue||1");
      await DockerUtils.executeDockerCommand("dapr_redis redis-cli MSET myconfigkey2 key2_initialvalue||1");
      await DockerUtils.executeDockerCommand("dapr_redis redis-cli MSET myconfigkey3 key3_initialvalue||1");
    });

    it('should be able to get the configuration items', async () => {
      const config = await client.configuration.get("config-redis", ["myconfigkey1", "myconfigkey2", "myconfigkey3"]);
      expect(config.items.length).toEqual(3);

      expect(config.items.map(i => i.key).indexOf("myconfigkey1")).toBeGreaterThan(-1);
      expect(config.items.map(i => i.key).indexOf("myconfigkey2")).toBeGreaterThan(-1);
      expect(config.items.map(i => i.key).indexOf("myconfigkey3")).toBeGreaterThan(-1);

      expect(config.items.filter(i => i.key == "myconfigkey1")[0].value).toEqual("key1_initialvalue");
      expect(config.items.filter(i => i.key == "myconfigkey2")[0].value).toEqual("key2_initialvalue");
      expect(config.items.filter(i => i.key == "myconfigkey3")[0].value).toEqual("key3_initialvalue");
    });

    it('should be able to get the configuration items with metadata', async () => {
      await client.configuration.get("config-redis", ["myconfigkey1"], { "hello": "world" });

      // Disabled for now as I am unsure if Dapr returns the metadata items
      // Java SDK: https://github.com/dapr/java-sdk/blob/06d92dafca62a6b48e74ccf939feeac7189e360f/sdk/src/test/java/io/dapr/client/DaprPreviewClientGrpcTest.java#L119
      // ^ shows that it is not being tested, it tries but doesn't assert
      // expect(conf.items.filter(i => i.key == "myconfigkey1")[0].metadata).toHaveProperty("hello");
    });

    // // @todo: figure out, subscribe doesn't pass keys but doesn't listen to anything?
    // // https://github.com/dapr/dapr/issues/4529
    // it('should be able to subscribe to configuration item changes on all keys', async () => {
    //   const m = jest.fn(async (res: SubscribeConfigurationResponse) => { });

    //   console.log("Creating Subscription");
    //   await client.configuration.subscribe("config-redis", m);

    //   // Change an item
    //   await DockerUtils.executeDockerCommand("dapr_redis redis-cli MSET myconfigkey3 mynewvalue||1");

    //   expect(m.mock.calls.length).toEqual(1);
    // });

    it('should be able to subscribe to configuration item changes on specific keys', async () => {
      const m = jest.fn(async (_res: SubscribeConfigurationResponse) => { return; });

      const stream1 = await client.configuration.subscribeWithKeys("config-redis", ["myconfigkey1", "myconfigkey2"], m);
      await DockerUtils.executeDockerCommand("dapr_redis redis-cli MSET myconfigkey1 key1_mynewvalue||1");

      expect(m.mock.calls.length).toEqual(1);
      expect(m.mock.calls[0][0].items[0].key).toEqual("myconfigkey1");
      expect(m.mock.calls[0][0].items[0].value).toEqual("key1_mynewvalue");

      await stream1.stop();
    });

    it('should be able to subscribe with metadata', async () => {
      const m = jest.fn(async (_res: SubscribeConfigurationResponse) => { return; });

      const stream1 = await client.configuration.subscribeWithMetadata("config-redis", ["myconfigkey1", "myconfigkey2"], { "hello": "world" }, m);
      await DockerUtils.executeDockerCommand("dapr_redis redis-cli MSET myconfigkey1 key1_mynewvalue||1");

      console.log(m.mock.calls)
      expect(m.mock.calls.length).toEqual(1);
      expect(m.mock.calls[0][0].items[0].key).toEqual("myconfigkey1");
      expect(m.mock.calls[0][0].items[0].value).toEqual("key1_mynewvalue");

      await stream1.stop();
    });

    it('should be able to unsubscribe', async () => {
      const m = jest.fn(async (_res: SubscribeConfigurationResponse) => { return; });

      const stream1 = await client.configuration.subscribeWithMetadata("config-redis", ["myconfigkey1", "myconfigkey2"], { "hello": "world" }, m);
      await DockerUtils.executeDockerCommand("dapr_redis redis-cli MSET myconfigkey1 key1_mynewvalue||1");

      expect(m.mock.calls.length).toEqual(1);
      expect(m.mock.calls[0][0].items[0].key).toEqual("myconfigkey1");
      expect(m.mock.calls[0][0].items[0].value).toEqual("key1_mynewvalue");

      await stream1.stop();

      await DockerUtils.executeDockerCommand("dapr_redis redis-cli MSET myconfigkey1 key1_mynewvalue2||1");

      // Expect no change after stop
      expect(m.mock.calls.length).toEqual(1);
      expect(m.mock.calls[0][0].items[0].key).toEqual("myconfigkey1");
      expect(m.mock.calls[0][0].items[0].value).toEqual("key1_mynewvalue");
    });

    it('should be able to subscribe to configuration items through multiple streams', async () => {
      const m1 = jest.fn(async (_res: SubscribeConfigurationResponse) => { return; });
      const m2 = jest.fn(async (_res: SubscribeConfigurationResponse) => { return; });

      const stream1 = await client.configuration.subscribeWithKeys("config-redis", ["myconfigkey1"], m1);
      const stream2 = await client.configuration.subscribeWithKeys("config-redis", ["myconfigkey1"], m2);

      await DockerUtils.executeDockerCommand("dapr_redis redis-cli MSET myconfigkey1 key1_mynewvalue||1");

      expect(m1.mock.calls.length).toEqual(1);
      expect(m1.mock.calls[0][0].items[0].key).toEqual("myconfigkey1");
      expect(m1.mock.calls[0][0].items[0].value).toEqual("key1_mynewvalue");

      expect(m2.mock.calls.length).toEqual(1);
      expect(m2.mock.calls[0][0].items[0].key).toEqual("myconfigkey1");
      expect(m2.mock.calls[0][0].items[0].value).toEqual("key1_mynewvalue");

      await stream1.stop();
      await stream2.stop();
    });
  });
});
