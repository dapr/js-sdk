import { DaprClient, Temporal } from '../../../src';
import ActorRuntime from '../../../src/actors/runtime/ActorRuntime';
import ActorRuntimeConfig from '../../../src/actors/runtime/ActorRuntimeConfig';

describe('Actor', () => {
    let client: DaprClient;

    beforeAll(async () => {
        jest.mock('../../../src/implementation/Client/DaprClient'); // converts DaprClient into a mock constructor
        client = new DaprClient("127.0.0.1", "1000");
    });

    beforeEach(async () => {
        const runtime = ActorRuntime.getInstanceByDaprClient(client);

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

    it('says hello', () => expect("hello").toEqual("hello"))
})