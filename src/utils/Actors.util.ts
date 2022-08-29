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

import { ActorRuntimeOptions } from "../types/actors/ActorRuntimeOptions";

/**
 * Get response object for /dapr/config API call.
 * See https://docs.dapr.io/reference/api/actors_api/#get-registered-actors
 */
export function buildActorRuntimeConfigurationResponse(entities: string[], options: ActorRuntimeOptions): any {
    var res: {[k: string]: any} = {};
    res["entities"] = entities

    if (options.actorIdleTimeout) { res["actorIdleTimeout"] = options.actorIdleTimeout.toString() }
    if (options.actorScanInterval) { res["actorScanInterval"] = options.actorScanInterval.toString() }
    if (options.drainOngoingCallTimeout) { res["drainOngoingCallTimeout"] = options.drainOngoingCallTimeout.toString() }
    if (options.drainRebalancedActors) { res["drainRebalancedActors"] = options.drainRebalancedActors }
    if (options.remindersStoragePartitions) { res["remindersStoragePartitions"] = options.remindersStoragePartitions }

    if (options.reentrancy) {
        res["reentrancy"] = {};
        if (options.reentrancy.enabled) {
            res["reentrancy"]["enabled"] = options.reentrancy.enabled;
        }
        if (options.reentrancy.maxStackDepth) {
            res["reentrancy"]["maxStackDepth"] = options.reentrancy.maxStackDepth;
        }
    }

    return res
}