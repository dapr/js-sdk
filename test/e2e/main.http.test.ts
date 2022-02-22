import { CommunicationProtocolEnum, DaprClient, DaprServer, HttpMethod } from '../../src';

const serverHost = '127.0.0.1';
const serverPort = '50001';
const daprHost = '127.0.0.1';
const daprPort = '50000'; // Dapr Sidecar Port of this Example Server
const daprAppId = 'test-suite';

describe('http/main', () => {
  let server: DaprServer;
  let client: DaprClient;
  const mockBindingReceive = jest.fn(async (_data: object) => console.log('mockBindingReceive'));
  const mockPubSubSubscribe = jest.fn(async (_data: object) => console.log('mockPubSubSubscribe'));

  // We need to start listening on some endpoints already
  // this because Dapr is not dynamic and registers endpoints on boot
  // we put a timeout of 10s since it takes around 4s for Dapr to boot up
  beforeAll(async () => {
    server = new DaprServer(serverHost, serverPort, daprHost, daprPort, CommunicationProtocolEnum.HTTP);

    client = new DaprClient(daprHost, daprPort, CommunicationProtocolEnum.HTTP, {
      isKeepAlive: false
    });

    await server.binding.receive('binding-mqtt', mockBindingReceive);

    // Test with:
    // dapr publish --publish-app-id test-suite --pubsub pubsub-redis --topic test-topic --data '{ "hello": "world" }'
    await server.pubsub.subscribe('pubsub-redis', 'test-topic', mockPubSubSubscribe);

    // Start server
    await server.start();
  }, 10 * 1000);

  afterAll(async () => {
    await server.stop();
    await client.stop();
  });

  describe('metadata', () => {
    it('should be able to get the metadata of the Dapr sidecar', async () => {
      const res = await client.metadata.get();

      expect(res.id.length).toBeGreaterThan(0);
      expect(res.components.length).toBeGreaterThan(0);
    });

    it('should be able to set a custom metadata value of the Dapr sidecar', async () => {
      await client.metadata.set("testKey", "Hello World");

      const res = await client.metadata.get();

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

  describe('binding', () => {
    it('should be able to receive events', async () => {
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
    it('should be able to send and receive events', async () => {
      await client.pubsub.publish('pubsub-redis', 'test-topic', { hello: 'world' });

      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 250));

      expect(mockPubSubSubscribe.mock.calls.length).toBe(1);

      // Also test for receiving data
      // @ts-ignore
      expect(mockPubSubSubscribe.mock.calls[0][0]['hello']).toEqual('world');
    });

    it('should receive if it was successful or not', async () => {
      const res = await client.pubsub.publish('pubsub-redis', 'test-topic', { hello: 'world' });
      expect(res).toEqual(true);
    });
  });

  describe('invoker', () => {
    it('should be able to listen and invoke a service with GET', async () => {
      const mock = jest.fn(async (_data: object) => ({ hello: 'world' }));

      await server.invoker.listen('hello-world', mock, { method: HttpMethod.GET });
      const res = await client.invoker.invoke(daprAppId, 'hello-world', HttpMethod.GET);

      // Delay a bit for event to arrive
      // await new Promise((resolve, reject) => setTimeout(resolve, 250));

      expect(mock.mock.calls.length).toBe(1);
      expect(JSON.stringify(res)).toEqual(`{"hello":"world"}`);
    });

    it('should be able to listen and invoke a service with POST data', async () => {
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

    it('should be able to query state', async () => {
      // First save our data
      await client.state.save("state-mongodb", [
        {
          key: 'key-1',
          value: {
            person: {
              id: 1036,
              org: "Dev Ops"
            },
            city: "Seattle",
            state: "WA"
          }
        },
        {
          key: 'key-2',
          value: {
            person: {
              id: 1037,
              org: "Developers"
            },
            city: "Seattle",
            state: "WA"
          },
        },
        {
          key: 'key-3',
          value: {
            person: {
              id: 1038,
              org: "Developers"
            },
            city: "Seattle",
            state: "WA"
          },
        },
        {
          key: 'key-4',
          value: {
            person: {
              id: 1039,
              org: "Dev Ops"
            },
            city: "Spokane",
            state: "WA"
          },
        },
        {
          key: 'key-5',
          value: {
            person: {
              id: 1040,
              org: "Developers"
            },
            city: "Seattle",
            state: "WA"
          },
        },
        {
          key: 'key-6',
          value: {
            person: {
              id: 1041,
              org: "Dev Ops"
            },
            city: "Seattle",
            state: "WA"
          },
        },
        {
          key: 'key-7',
          value: {
            person: {
              id: 1042,
              org: "Finance"
            },
            city: "Brussels",
            state: "Flemish-Brabant"
          },
        },
        {
          key: 'key-8',
          value: {
            person: {
              id: 1043,
              org: "Finance"
            },
            city: "San Francisco",
            state: "CA"
          },
        }
      ]);

      const res = await client.state.query("state-mongodb", {
        filter: {
          OR: [
            {
              EQ: { "value.person.org": "Dev Ops" }
            },
            {
              "AND": [
                {
                  "EQ": { "value.person.org": "Finance" }
                },
                {
                  "IN": { "value.state": ["CA", "WA"] }
                }
              ]
            }
          ]
        },
        sort: [
          {
            key: "value.state",
            order: "DESC"
          }
        ],
        page: {
          limit: 10
        }
      });

      expect(res.results.length).toEqual(4);
      expect(res.results.map(i => i.key).indexOf("key-1")).toBeGreaterThan(-1);
      expect(res.results.map(i => i.key).indexOf("key-4")).toBeGreaterThan(-1);
      expect(res.results.map(i => i.key).indexOf("key-6")).toBeGreaterThan(-1);
      expect(res.results.map(i => i.key).indexOf("key-8")).toBeGreaterThan(-1);

      for (let i = 1; i <= 8; i++) {
        await client.state.delete("state-mongodb", `key-${i}`)
      }
    });
  });
});
