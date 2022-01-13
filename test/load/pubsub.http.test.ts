import { CommunicationProtocolEnum, DaprClient } from '../../src';

const daprHost = '127.0.0.1';
const daprPort = '50000'; // Dapr Sidecar Port of this Example Server

describe('load/http', () => {
  let client: DaprClient;

  // We need to start listening on some endpoints already
  // this because Dapr is not dynamic and registers endpoints on boot
  beforeAll(async () => {
    client = new DaprClient(daprHost, daprPort, CommunicationProtocolEnum.HTTP);
  });

  describe('pubsub', () => {
    it('should be able to send 2500 events as quickly as possible without errors', async () => {
      const amountOfCalls = 2500;

      // Create the promises
      const promises = [];

      for (let i = 0; i < amountOfCalls; i++) {
        promises.push(client.pubsub.publish('pubsub-mqtt', 'test-topic', { hello: 'world' }));
      }

      // Await the promises
      const tStart = Date.now();
      const res = await Promise.all(promises);
      const tEnd = Date.now();

      expect(res.filter(i => i === true).length).toEqual(amountOfCalls);
      console.log(`Execution time: ${tEnd - tStart}ms`);
      // @todo: do we add an execution time test?
    }, 30 * 1000);
  });
});
