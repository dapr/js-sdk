import { CommunicationProtocolEnum, DaprClient, DaprServer, HttpMethod } from '../../src';
import { SubscribeConfigurationResponse } from '../../src/types/configuration/SubscribeConfigurationResponse';
import { sleep } from '../../src/utils/NodeJS.util';
import * as DockerUtils from "../utils/DockerUtil";

const serverHost = '127.0.0.1';
const serverPort = '50001';
const daprHost = '127.0.0.1';
const daprPort = '50000'; // Dapr Sidecar Port of this Example Server
const daprAppId = 'test-suite';

describe('grpc/configuration', () => {
  let server: DaprServer;
  let client: DaprClient;

  // We need to start listening on some endpoints already
  // this because Dapr is not dynamic and registers endpoints on boot
  beforeAll(async () => {
    server = new DaprServer(serverHost, serverPort, daprHost, daprPort, CommunicationProtocolEnum.GRPC);
    client = new DaprClient(daprHost, daprPort, CommunicationProtocolEnum.GRPC);

    // Start server
    await server.start();
  }, 10 * 1000);

  afterAll(async () => {
    await server.stop();
  });

  beforeEach(async () => {
    // Reset the Configuration API
    await DockerUtils.executeDockerCommand("dapr_redis redis-cli MSET myconfigkey1 initialvalue||1");
    await DockerUtils.executeDockerCommand("dapr_redis redis-cli MSET myconfigkey2 initialvalue||1");
    await DockerUtils.executeDockerCommand("dapr_redis redis-cli MSET myconfigkey3 initialvalue||1");
  })

  it('should be able to get the configuration items', async () => {
    // await server.configuration.subscribe();
    const conf = await client.configuration.get("config-redis", ["myconfigkey1", "myconfigkey2", "myconfigkey3"]);
    expect(conf.items.length).toEqual(3);

    expect(conf.items.map(i => i.key).indexOf("myconfigkey1")).toBeGreaterThan(-1);
    expect(conf.items.map(i => i.key).indexOf("myconfigkey2")).toBeGreaterThan(-1);
    expect(conf.items.map(i => i.key).indexOf("myconfigkey3")).toBeGreaterThan(-1);

    expect(conf.items.filter(i => i.key == "myconfigkey1")[0].value).toEqual("initialvalue");
    expect(conf.items.filter(i => i.key == "myconfigkey2")[0].value).toEqual("initialvalue");
    expect(conf.items.filter(i => i.key == "myconfigkey3")[0].value).toEqual("initialvalue");
  });

  // @todo Note: seems to be a bug upstream? Cannot fetch this
  // @todo Note #2: JAVA sdk doesn't seem to check if this is set in the tests? https://github.com/dapr/java-sdk/commit/185cdba293de21f92855815792ce936c5164691a#diff-eab2bac5cf4c2f6deea0453b132eada833a4781dc96dcc09aa625d32464978c9R105
  it('should be able to get the configuration items with metadata', async () => {
    // await server.configuration.subscribe();
    const conf = await client.configuration.get("config-redis", ["myconfigkey1"], { "hello": "world" });
    console.log(conf);
    expect(conf.items.filter(i => i.key == "myconfigkey1")[0].metadata).toHaveProperty("hello");
  });

  // @todo: figure out, subscribe doesn't pass keys but doesn't listen to anything?
  it('should be able to subscribe to configuration item changes on all keys', async () => {
    const m = jest.fn(async (res: SubscribeConfigurationResponse) => { });

    console.log("Creating Subscription");
    await client.configuration.subscribe("config-redis", m);

    // Change an item
    await DockerUtils.executeDockerCommand("dapr_redis redis-cli MSET myconfigkey3 mynewvalue||1");

    expect(m.mock.calls.length).toEqual(1);
  });

  it('should be able to subscribe to configuration item changes on specific keys', async () => {
    const m = jest.fn(async (res: SubscribeConfigurationResponse) => { });

    await client.configuration.subscribeWithKeys("config-redis", ["myconfigkey1", "myconfigkey2"], m);
    await DockerUtils.executeDockerCommand("dapr_redis redis-cli MSET myconfigkey1 mynewvalue||1");

    expect(m.mock.calls.length).toEqual(1);
    expect(m.mock.calls[0][0].items[0].key).toEqual("myconfigkey1");
    expect(m.mock.calls[0][0].items[0].value).toEqual("mynewvalue");
  });

  // @todo: not working, it is not able to open a steram on the same items as before
  it('should be able to subscribe to the same configuration item changes on identical specific keys through a second stream', async () => {
    const m = jest.fn(async (res: SubscribeConfigurationResponse) => { });

    await client.configuration.subscribeWithKeys("config-redis", ["myconfigkey1", "myconfigkey2"], m);
    await DockerUtils.executeDockerCommand("dapr_redis redis-cli MSET myconfigkey3 mynewvalue||1");

    expect(m.mock.calls.length).toEqual(1);
    expect(m.mock.calls[0][0].items[0].key).toEqual("myconfigkey2");
    expect(m.mock.calls[0][0].items[0].value).toEqual("mynewvalue");
  });

  it('should be able to subscribe to configuration item changes on specific keys through a second stream', async () => {
    const m = jest.fn(async (res: SubscribeConfigurationResponse) => { });

    await client.configuration.subscribeWithKeys("config-redis", ["myconfigkey3"], m);
    await DockerUtils.executeDockerCommand("dapr_redis redis-cli MSET myconfigkey3 mynewvalue||1");

    expect(m.mock.calls.length).toEqual(1);
    expect(m.mock.calls[0][0].items[0].key).toEqual("myconfigkey3");
    expect(m.mock.calls[0][0].items[0].value).toEqual("mynewvalue");
  });
});
