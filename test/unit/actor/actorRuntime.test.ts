import { v4 as uuidv4 } from "uuid";
import { DaprClient } from '../../src';
import ActorRuntime from '../../src/actors/runtime/ActorRuntime';
import ActorRuntimeConfig from '../../src/actors/runtime/ActorRuntimeConfig';
import ActorId from "../../src/actors/ActorId";
import FakeSimpleActorImpl from '../actor/FakeSimpleActorImpl';
import FakeSimpleTimerActorImpl from '../actor/FakeSimpleTimerActorImpl';

describe('ActorRuntime', () => {
    let client: DaprClient;

    beforeAll(async () => {
        jest.mock('../../src/DaprClient'); // converts DaprClient into a mock constructor
        client = new DaprClient("", "");
    });

    beforeEach(async () => {
        const runtime = ActorRuntime.getInstance(client);

        // Reset the runtime config
        const config = runtime.getActorRuntimeConfig();
        const newConfig = new ActorRuntimeConfig(1 * 60 * 60, 30, 1 * 60, true);
        runtime.setActorRuntimeConfig(newConfig);

        // Clear the Actor Managers
        runtime.clearActorManagers();
    });

    it('should have an actor config that matches the default values', async () => {
        const runtime = ActorRuntime.getInstance(client);
        const config = runtime.getActorRuntimeConfig();
        expect(config.getActorIdleTimeout()).toEqual(1 * 60 * 60);
        expect(config.getActorScanInterval()).toEqual(30);
        expect(config.getDrainOngoingCallTimeout()).toEqual(1 * 60);
        expect(config.getDrainRebalancedActors()).toEqual(true);
    });

    it('should allow us to change the actor runtime config values', async () => {
        const runtime = ActorRuntime.getInstance(client);
        const newConfig = new ActorRuntimeConfig(3 * 60 * 60, 10, 2 * 60, false);
        runtime.setActorRuntimeConfig(newConfig);

        const config = runtime.getActorRuntimeConfig();
        expect(config.getActorIdleTimeout()).toEqual(3 * 60 * 60);
        expect(config.getActorScanInterval()).toEqual(10);
        expect(config.getDrainOngoingCallTimeout()).toEqual(2 * 60);
        expect(config.getDrainRebalancedActors()).toEqual(false);
    });

    it('should be able to register an actor', async () => {
        const runtime = ActorRuntime.getInstance(client);
        await runtime.registerActor(FakeSimpleActorImpl);
        await runtime.registerActor(FakeSimpleTimerActorImpl);

        expect(runtime.getRegisteredActorTypes().indexOf(FakeSimpleActorImpl.name)).toBeGreaterThan(-1);
        expect(runtime.getRegisteredActorTypes().indexOf(FakeSimpleTimerActorImpl.name)).toBeGreaterThan(-1);
    });

    it('should only register an actor once', async () => {
        const runtime = ActorRuntime.getInstance(client);
        await runtime.registerActor(FakeSimpleActorImpl);
        await runtime.registerActor(FakeSimpleActorImpl);

        expect(runtime.getRegisteredActorTypes().indexOf(FakeSimpleActorImpl.name)).toBeGreaterThan(-1);
        expect(runtime.getRegisteredActorTypes().length).toEqual(1);
    });

    it('should be able to invoke an actor', async () => {
        const actorId = uuidv4();

        const runtime = ActorRuntime.getInstance(client);
        await runtime.registerActor(FakeSimpleActorImpl);

        const res = await runtime.invoke(FakeSimpleActorImpl.name, actorId, "sayMessage", Buffer.from("Hello World"));
        expect(res[0].toString()).toEqual("Hello World");
    });

    it('should receive an error if the actor method does not exist', async () => {
        const actorId = uuidv4();

        const runtime = ActorRuntime.getInstance(client);
        await runtime.registerActor(FakeSimpleActorImpl);

        try {
            await runtime.invoke(FakeSimpleActorImpl.name, actorId, "someRandomMethod");
        } catch (e) {
            expect(e.message).toEqual(`{"error":"ACTOR_METHOD_DOES_NOT_EXIST","errorMsg":"The actor method 'someRandomMethod' does not exist on FakeSimpleActorImpl"}`);
        }
    });

    it('should be able to fire a reminder', async () => {
        const actorId = new ActorId(uuidv4());
    });

    it('should be able to fire a timer', async () => {
        const actorId = new ActorId(uuidv4());
    });
})