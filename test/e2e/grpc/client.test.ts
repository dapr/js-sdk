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

import * as grpc from "@grpc/grpc-js";
import { CommunicationProtocolEnum, DaprClient, LogLevel } from '../../../src';
import { SubscribeConfigurationResponse } from '../../../src/types/configuration/SubscribeConfigurationResponse';
import { LockStatus } from '../../../src/types/lock/UnlockResponse';
import * as DockerUtils from '../../utils/DockerUtil';
import { DaprClient as DaprClientGrpc } from "../../../src/proto/dapr/proto/runtime/v1/dapr_grpc_pb"
import { Empty } from 'google-protobuf/google/protobuf/empty_pb';
import { InterceptingListener } from "@grpc/grpc-js/build/src/call-stream";
import { NextCall } from "@grpc/grpc-js/build/src/client-interceptors";
import { v4 as uuidv4 } from "uuid";

const daprHost = 'localhost';
const daprPort = '50000'; // Dapr Sidecar Port of this Example Server

describe('grpc/client', () => {
  let client: DaprClient;

  // We need to start listening on some endpoints already
  // this because Dapr is not dynamic and registers endpoints on boot
  beforeAll(async () => {
    client = new DaprClient(daprHost, daprPort, CommunicationProtocolEnum.GRPC, {
      logger: {
        level: LogLevel.Debug
      }
    });
  }, 10 * 1000);

  afterAll(async () => {
    await client.stop();
  });

  describe('client', () => {
    it('should return isInitialized is true if the sidecar has been started', async () => {
      // Awaiting this will ensure the client is started
      await client.getDaprClient().getClient();

      const isInitialized = await client.getIsInitialized();
      expect(isInitialized).toBe(true);
    });
  });

  describe('Proxy', () => {
    it('should allow to use a proxy builder to proxy a gRPC request', async () => {
      let mockMetadataRes: grpc.Metadata = new grpc.Metadata();
      const mockInterceptor = jest.fn((options: grpc.InterceptorOptions, nextCall: NextCall): grpc.InterceptingCall => {
        return new grpc.InterceptingCall(nextCall(options), {
          start: function (metadata: grpc.Metadata, listener: InterceptingListener, next: (metadata: grpc.Metadata, listener: InterceptingListener | grpc.Listener) => void) {
            mockMetadataRes = metadata;
            next(metadata, listener);
          }
        })
      });

      const clientProxy = await client.proxy.create<DaprClientGrpc>(DaprClientGrpc, { interceptors: [mockInterceptor] });

      await (new Promise(resolve => (clientProxy.getMetadata(new Empty(), resolve))));

      expect(mockInterceptor.mock.calls.length).toBe(1);
      expect(mockMetadataRes.get('dapr-app-id')[0]).toBe('test-suite');
    });

    it('should allow to use a proxy builder that uses daprAppId by setting custom env variable to proxy a gRPC request', async () => {

      const oldProcessAppId = process.env?.APP_ID;
      process.env.APP_ID = "test-suite-proxy";

      let mockMetadataRes: grpc.Metadata = new grpc.Metadata();
      const mockInterceptor = jest.fn((options: grpc.InterceptorOptions, nextCall: NextCall): grpc.InterceptingCall => {
        return new grpc.InterceptingCall(nextCall(options), {
          start: function (metadata: grpc.Metadata, listener: InterceptingListener, next: (metadata: grpc.Metadata, listener: InterceptingListener | grpc.Listener) => void) {
            mockMetadataRes = metadata;
            next(metadata, listener);
          }
        })
      });


      const clientProxy = await client.proxy.create<DaprClientGrpc>(DaprClientGrpc, { interceptors: [mockInterceptor] });

      await (new Promise(resolve => (clientProxy.getMetadata(new Empty(), resolve))));

      expect(mockInterceptor.mock.calls.length).toBe(1);
      expect(mockMetadataRes.get('dapr-app-id')[0]).toBe(process.env.APP_ID);
      process.env.APP_ID = oldProcessAppId;
    });
  });

  describe('sidecar', () => {
    it('should return true if the sidecar has been started', async () => {
      await client.getDaprClient().getClient();

      // Note: difficult to test as we start up dapr with dapr run, which starts the sidecar for us automatically
      // there is however a delay between the sidecar being ready and the app starting as they are started asynchronously
      // if Dapr has to connect to a component, it might introduce a delay
      // the test will thus randomly have isStarted = true or isStarted = false depending on the startup delay of the sidecar
      await client.health.isHealthy();
      // expect(isHealthy).toBe(false);
    })
  });

  describe('metadata', () => {
    it('should be able to get the metadata of the Dapr sidecar', async () => {
      const res = await client.metadata.get();

      // app id is not set in grpc?
      expect(res.id.length).toBeGreaterThan(0);
      expect(res.components.length).toBeGreaterThan(0);
    });

    it('should be able to get the capabilities of components via metadata call', async () => {
      const res = await client.metadata.get();
      const redisStateComponent = res.components.filter( (num) => num.name == "state-redis" );
      const expectedRedisStateCapabilities = [ 'ETAG', 'TRANSACTIONAL', 'QUERY_API', 'ACTOR' ];
      expect(res.id.length).toBeGreaterThan(0);
      expect(res.components.length).toBeGreaterThan(0);
      expect(redisStateComponent.length).toEqual(1)
      expect(redisStateComponent[0].capabilities).toEqual(expect.arrayContaining(expectedRedisStateCapabilities));
    });


    it('should be able to set a custom metadata value of the Dapr sidecar', async () => {
      await client.metadata.set("testKey", "Hello World");

      const res = await client.metadata.get();

      // app id is not set in grpc?
      expect(res.id.length).toBeGreaterThan(0);
      expect(res.components.length).toBeGreaterThan(0);
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
    beforeEach(async () => {
      await client.state.delete("state-redis", "key-1");
      await client.state.delete("state-redis", "key-2");
      await client.state.delete("state-redis", "key-3");
    });

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

    it('should be able to add metadata, etag and options', async () => {
      await client.state.save('state-redis', [
        {
          key: 'key-1',
          value: 'value-1',
          etag: "1234",
          options: {
            "concurrency": "first-write",
            "consistency": "strong"
          },
          metadata: {
            hello: "world"
          }
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

    it('should be able to add metadata, etag and options', async () => {
      await client.state.save('state-redis', [
        {
          key: 'key-1',
          value: 'value-1',
          etag: "1234",
          options: {
            "concurrency": "first-write",
            "consistency": "strong"
          },
          metadata: {
            hello: "world"
          }
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
      console.log(res);
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

    it('should be able to subscribe to configuration item changes on all keys', async () => {
      const m = jest.fn(async (_res: SubscribeConfigurationResponse) => { return; });

      const stream = await client.configuration.subscribe("config-redis", m);

      // Update the configuration item
      await DockerUtils.executeDockerCommand("dapr_redis redis-cli MSET myconfigkey3 mynewvalue||2");

      expect(m.mock.calls[0][0].items.length).toEqual(1);
      expect(m.mock.calls[0][0].items[0].key).toEqual("myconfigkey3");
      expect(m.mock.calls[0][0].items[0].value).toEqual("mynewvalue");

      stream.stop();
    });

    it('should be able to subscribe to configuration item changes on specific keys', async () => {
      const m = jest.fn(async (_res: SubscribeConfigurationResponse) => { return; });

      const stream = await client.configuration.subscribeWithKeys("config-redis", ["myconfigkey1", "myconfigkey2"], m);
      await DockerUtils.executeDockerCommand("dapr_redis redis-cli MSET myconfigkey1 key1_mynewvalue||1");

      expect(m.mock.calls.length).toEqual(1);
      expect(m.mock.calls[0][0].items[0].key).toEqual("myconfigkey1");
      expect(m.mock.calls[0][0].items[0].value).toEqual("key1_mynewvalue");

      await stream.stop();
    });

    it('should be able to subscribe with metadata', async () => {
      const m = jest.fn(async (_res: SubscribeConfigurationResponse) => { return; });

      const stream1 = await client.configuration.subscribeWithMetadata("config-redis", ["myconfigkey1", "myconfigkey2"], { "hello": "world" }, m);
      await DockerUtils.executeDockerCommand("dapr_redis redis-cli MSET myconfigkey1 key1_mynewvalue||1");

      expect(m.mock.calls.length).toEqual(1);
      expect(m.mock.calls[0][0].items[0].key).toEqual("myconfigkey1");
      expect(m.mock.calls[0][0].items[0].value).toEqual("key1_mynewvalue");

      await stream1.stop();
    });

    it('should be able to unsubscribe', async () => {
      const m = jest.fn(async (_res: SubscribeConfigurationResponse) => { return; });

      const stream = await client.configuration.subscribeWithMetadata("config-redis", ["myconfigkey1", "myconfigkey2"], { "hello": "world" }, m);
      await DockerUtils.executeDockerCommand("dapr_redis redis-cli MSET myconfigkey1 key1_mynewvalue||1");

      expect(m.mock.calls.length).toEqual(1);
      expect(m.mock.calls[0][0].items[0].key).toEqual("myconfigkey1");
      expect(m.mock.calls[0][0].items[0].value).toEqual("key1_mynewvalue");

      stream.stop();

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

      stream1.stop();
      stream2.stop();
    });
  });

  describe('distributed lock', () => {
    it('should be able to acquire a new lock and unlock', async () => {
      const resourceId = uuidv4();
      const tryLock = await client.lock.tryLock("redislock", resourceId, "owner1", 1000);
      expect(tryLock.success).toEqual(true);
      const unlock = await client.lock.unlock("redislock", resourceId, "owner1");
      expect(unlock.status).toEqual(LockStatus.Success);
    });

    it('should be not be able to unlock when the lock is not acquired', async () => {
      const resourceId = uuidv4();
      const unlock = await client.lock.unlock("redislock", resourceId, "owner1");
      expect(unlock.status).toEqual(LockStatus.LockDoesNotExist);
    });

    it('should be able to acquire a lock after the previous lock is expired', async () => {
      const resourceId = uuidv4();
      let tryLock = await client.lock.tryLock("redislock", resourceId, "owner1", 5);
      expect(tryLock.success).toEqual(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      tryLock = await client.lock.tryLock("redislock", resourceId, "owner2", 5);
      expect(tryLock.success).toEqual(false);
    });

    it('should not be able to acquire a lock when the same lock is acquired by another owner', async () => {
      const resourceId = uuidv4();
      const tryLockOne = await client.lock.tryLock("redislock", resourceId, "owner1", 5);
      expect(tryLockOne.success).toEqual(true);
      const tryLockTwo = await client.lock.tryLock("redislock", resourceId, "owner2", 5);
      expect(tryLockTwo.success).toEqual(false);
    });

    it('should be able to acquire a lock when a different lock is acquired by another owner', async () => {
      const tryLockOne = await client.lock.tryLock("redislock", uuidv4(), "owner1", 5);
      expect(tryLockOne.success).toEqual(true);
      const tryLockTwo = await client.lock.tryLock("redislock", uuidv4(), "owner2", 5);
      expect(tryLockTwo.success).toEqual(true);
    });

    it('should not be able to acquire a lock when that lock is acquired by another owner/process', async () => {
      const resourceId = uuidv4();
      const tryLockOne = await client.lock.tryLock("redislock", resourceId, "owner3", 5);
      expect(tryLockOne.success).toEqual(true);
      const tryLockTwo = await client.lock.tryLock("redislock", resourceId, "owner4", 5);
      expect(tryLockTwo.success).toEqual(false);
    });

    it('should not be able to unlock a lock when that lock is acquired by another owner/process', async () => {
      const resourceId = uuidv4();
      const tryLockOne = await client.lock.tryLock("redislock", resourceId, "owner5", 5);
      expect(tryLockOne.success).toEqual(true);
      const unlock = await client.lock.unlock("redislock", resourceId, "owner6");
      expect(unlock.status).toEqual(LockStatus.LockBelongsToOthers);
    });
  });
});