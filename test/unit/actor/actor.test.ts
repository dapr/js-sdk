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