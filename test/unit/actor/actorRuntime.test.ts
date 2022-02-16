import { v4 as uuidv4 } from "uuid";
import { DaprClient, Temporal } from '../../../src';
import ActorRuntime from '../../../src/actors/runtime/ActorRuntime';
import ActorRuntimeConfig from '../../../src/actors/runtime/ActorRuntimeConfig';
import ActorId from "../../../src/actors/ActorId";
import DemoActorCounterImpl from '../../actor/DemoActorCounterImpl';
import DemoActorSayImpl from '../../actor/DemoActorSayImpl';

describe('ActorRuntime', () => {
  let client: DaprClient;
  let runtime: ActorRuntime;

  beforeAll(async () => {
    jest.mock('../../../src/implementation/Client/DaprClient'); // converts DaprClient into a mock constructor
    client = new DaprClient("127.0.0.1", "1000");
  });

  beforeEach(async () => {
    runtime = ActorRuntime.getInstanceByDaprClient(client);

    // Reset the runtime config
    const config = new ActorRuntimeConfig(
      Temporal.Duration.from({ hours: 1 })
      , Temporal.Duration.from({ seconds: 30 })
      , Temporal.Duration.from({ minutes: 1 })
      , true
    );
    runtime.setActorRuntimeConfig(config);

    // Clear the Actor Managers
    runtime.clearActorManagers();
  });

  it('should have an actor config that matches the default values', async () => {
    const config = runtime.getActorRuntimeConfig();

    // Normal getter should return number
    expect(config.getActorIdleTimeout()).toEqual(1 * 60 * 60);
    expect(config.getActorScanInterval()).toEqual(30);
    expect(config.getDrainOngoingCallTimeout()).toEqual(1 * 60);
    expect(config.getDrainRebalancedActors()).toEqual(true);

    // Dictionary should be ISO formatted
    const dict = config.toDictionary();
    expect(dict.actorIdleTimeout).toEqual("1h");
    expect(dict.actorScanInterval).toEqual("30s");
    expect(dict.drainOngoingCallTimeout).toEqual("1m");
    expect(dict.drainRebalancedActors).toEqual(true);

  });

  it('should allow us to change the actor runtime config values', async () => {
    const newConfig = new ActorRuntimeConfig(
      Temporal.Duration.from({ hours: 3 })
      , Temporal.Duration.from({ seconds: 10 })
      , Temporal.Duration.from({ minutes: 2 })
      , false
    );

    runtime.setActorRuntimeConfig(newConfig);

    const config = runtime.getActorRuntimeConfig();

    // Normal getter should return number
    expect(config.getActorIdleTimeout()).toEqual(3 * 60 * 60);
    expect(config.getActorScanInterval()).toEqual(10);
    expect(config.getDrainOngoingCallTimeout()).toEqual(2 * 60);
    expect(config.getDrainRebalancedActors()).toEqual(false);

    // Dictionary should be ISO formatted
    const dict = config.toDictionary();
    expect(dict.actorIdleTimeout).toEqual("3h");
    expect(dict.actorScanInterval).toEqual("10s");
    expect(dict.drainOngoingCallTimeout).toEqual("2m");
    expect(dict.drainRebalancedActors).toEqual(false);
  });

  it('should be able to register an actor', async () => {
    await runtime.registerActor(DemoActorCounterImpl);
    await runtime.registerActor(DemoActorSayImpl);

    expect(runtime.getRegisteredActorTypes().indexOf(DemoActorCounterImpl.name)).toBeGreaterThan(-1);
    expect(runtime.getRegisteredActorTypes().indexOf(DemoActorSayImpl.name)).toBeGreaterThan(-1);
  });

  it('should only register an actor once', async () => {
    await runtime.registerActor(DemoActorCounterImpl);
    await runtime.registerActor(DemoActorCounterImpl);

    expect(runtime.getRegisteredActorTypes().indexOf(DemoActorCounterImpl.name)).toBeGreaterThan(-1);
    expect(runtime.getRegisteredActorTypes().length).toEqual(1);
  });

  it('should be able to invoke an actor', async () => {
    const actorId = uuidv4();

    await runtime.registerActor(DemoActorSayImpl);

    const res = await runtime.invoke(DemoActorSayImpl.name, actorId, "sayString", Buffer.from("Hello World"));
    expect(res.toString()).toEqual(`Actor said: "Hello World"`);
  });

  it('should receive an error if the actor method does not exist', async () => {
    const actorId = uuidv4();

    await runtime.registerActor(DemoActorCounterImpl);

    try {
      await runtime.invoke(DemoActorCounterImpl.name, actorId, "someRandomMethod");
    } catch (e) {
      const msg = (e as Error).message;
      expect(msg).toEqual(`{"error":"ACTOR_METHOD_DOES_NOT_EXIST","errorMsg":"The actor method 'someRandomMethod' does not exist on ${DemoActorCounterImpl.name}"}`);
    }
  });

  it('should be able to fire a reminder', async () => {
    // TODO: add this test
    new ActorId(uuidv4());
  });

  it('should be able to fire a timer', async () => {
    // TODO: add this test
    new ActorId(uuidv4());
  });
})