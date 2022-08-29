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

import { Temporal } from "@js-temporal/polyfill";
import { ActorRuntimeOptions } from "../../../src/types/actors/ActorRuntimeOptions";
import { getRegisteredActorResponse } from "../../../src/utils/Actors.util";

describe('Actors.util', () => {
    describe('buildActorRuntimeConfigurationResponse', () => {
        it('only contains specified properties and entities', () => {
            const options: ActorRuntimeOptions = {
                drainRebalancedActors: true,
            }
            const res = getRegisteredActorResponse([], options);
            expect(res).toEqual({
                entities: [],
                drainRebalancedActors: true,
            });
        })

        it('propagates all the entities and options to response', () => {
            const options: ActorRuntimeOptions = {
                actorIdleTimeout: "1h",
                actorScanInterval: "30s",
                drainOngoingCallTimeout: "30s",
                drainRebalancedActors: true,
                remindersStoragePartitions: 1,
                reentrancy: {
                    enabled: true,
                    maxStackDepth: 10,
                }
            }
            const res = getRegisteredActorResponse(["e1", "e2"], options);
            expect(res).toEqual({
                entities: ["e1", "e2"],
                actorIdleTimeout: "1h",
                actorScanInterval: "30s",
                drainOngoingCallTimeout: "30s",
                drainRebalancedActors: true,
                remindersStoragePartitions: 1,
                reentrancy: {
                    enabled: true,
                    maxStackDepth: 10,
                }
            });
        });
    });
});