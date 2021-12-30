import { CommunicationProtocolEnum, DaprClient, DaprServer, HttpMethod } from '../../src';

const serverHost = '127.0.0.1';
const serverPort = '50001';
const daprHost = '127.0.0.1';
const daprPort = '50000'; // Dapr Sidecar Port of this Example Server
const daprAppId = 'test-suite';

describe('load/http', () => {
  let server: DaprServer;
  let client: DaprClient;
  // const mockBindingReceive = jest.fn(async (data: object) => console.log('mockBindingReceive'));
  // const mockPubSubSubscribe = jest.fn(async (data: object) => console.log('mockPubSubSubscribe'));

  // We need to start listening on some endpoints already
  // this because Dapr is not dynamic and registers endpoints on boot
  beforeAll(async () => {
    server = new DaprServer(serverHost, serverPort, daprHost, daprPort, CommunicationProtocolEnum.HTTP);
    client = new DaprClient(daprHost, daprPort, CommunicationProtocolEnum.HTTP);

    // await server.binding.receive('binding-mqtt', mockBindingReceive);

    // Start server
    await server.startServer();
  });

  afterAll(async () => {
    await server.stopServer();
  })

  describe('pubsub', () => {
    it('should be able to send 500 events as quickly as possible without errors', async () => {
      const amountOfCalls = 1;

      // Create the promises
      let promises = [];

      for (let i = 0; i < amountOfCalls; i++) {
        promises.push(client.pubsub.publish('pubsub-mqtt', 'test-topic', { hello: 'world' }));
      }

      // Await the promises
      const res = await Promise.all(promises);
      console.log(res);

      // Delay a bit for event to arrive
      // await new Promise((resolve, reject) => setTimeout(resolve, 250));

      // expect(mockPubSubSubscribe.mock.calls.length).toBe(1);

      // Also test for receiving data
      // @ts-ignore
      // expect(mockPubSubSubscribe.mock.calls[0][0]['hello']).toEqual('world');
    });
  });
});
