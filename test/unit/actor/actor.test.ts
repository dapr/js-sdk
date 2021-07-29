import { v4 as uuidv4 } from "uuid";
import { DaprClient } from '../../../src';
import ActorRuntime from '../../../src/actors/runtime/ActorRuntime';
import ActorRuntimeConfig from '../../../src/actors/runtime/ActorRuntimeConfig';
import ActorId from "../../../src/actors/ActorId";
import FakeSimpleActorImpl from '../../actor/FakeSimpleActorImpl';
import FakeSimpleTimerActorImpl from '../../actor/FakeSimpleTimerActorImpl';

describe('Actor', () => {
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

    it('says hello', () => expect("hello").toEqual("hello"))
})