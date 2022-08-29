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
import { ActorReentrancyOptions } from "./ActorReentrancyOptions";

/**
 * ActorRuntimeOptions provides options for configuring the actor runtime in Dapr.
 * For more, see https://docs.dapr.io/developing-applications/building-blocks/actors/howto-actors/.
 */
export type ActorRuntimeOptions = {
    /**
     * The timeout before deactivating an idle actor. 
     * Checks for timeouts occur every `actorScanInterval` interval.
     */
    actorIdleTimeout?: Temporal.Duration;

    /**
     * Specifies how often to scan for idle actors to deactivate them.
     * Actors that have been idle longer than `actorIdleTimeout` will be deactivated. 
     */
    actorScanInterval?: Temporal.Duration;

    /**
     * The timeout before draining current active actor methods. 
     * If there is no current actor method call, this is ignored.
     */
    drainOngoingCallTimeout?: Temporal.Duration;

    /**
     * If true, Dapr will wait for `drainOngoingCallTimeout` before 
     * draining current active actor methods.
     */
    drainRebalancedActors?: boolean;

    /**
     * Configures different reentrancy parameters.
     */
    reentrancyOptions?: ActorReentrancyOptions;

    /**
     * Specifies the number of partitions for actor’s reminders.
     * If not provided, all reminders are saved as a single record in actor’s state store.
     */
    remindersStoragePartitions?: number;
}
// }

// export default class ActorRuntimeConfig {
//     private actorIdleTimeout: Temporal.Duration;
//     private actorScanInterval: Temporal.Duration;
//     private drainOngoingCallTimeout: Temporal.Duration;
//     private drainRebalancedActors: boolean;

//     /**
//      * 
//      * @param actorIdleTimeout 
//      * @param actorScanInterval The duration which specifies how often to scan for actors
//      * to deactivate idle actors. Actors that have been idle longer than actorIdleTimeout will be deactivated
//      * @param drainOngoingCallTimeout The duration when in the process of draining rebalanced actors.
//      * This specifies the timeout for the current active actor method to finish. 
//      * If there is no current actor method call, this is ignored.
//      * @param drainRebalancedActors If true, Dapr will wait for drainOngoingCallTimeout
//      * to allow a current actor call to complete before trying to deactivate an actor
//      */
//     constructor(
//         actorIdleTimeout = Temporal.Duration.from({ hours: 1 })
//         , actorScanInterval = Temporal.Duration.from({ seconds: 30 })
//         , drainOngoingCallTimeout = Temporal.Duration.from({ minutes: 1 })
//         , drainRebalancedActors = true
//     ) {
//         this.actorIdleTimeout = actorIdleTimeout;
//         this.actorScanInterval = actorScanInterval;
//         this.drainOngoingCallTimeout = drainOngoingCallTimeout;
//         this.drainRebalancedActors = drainRebalancedActors;
//     }

//     getActorIdleTimeout(): number {
//         return this.actorIdleTimeout.total({ unit: 'second' });
//     }

//     getActorScanInterval(): number {
//         return this.actorScanInterval.total({ unit: 'second' });
//     }

//     getDrainOngoingCallTimeout(): number {
//         return this.drainOngoingCallTimeout.total({ unit: 'second' });
//     }

//     getDrainRebalancedActors(): boolean {
//         return this.drainRebalancedActors;
//     }

//     toDictionary(): {
//         actorIdleTimeout: string,
//         actorScanInterval: string,
//         drainOngoingCallTimeout: string,
//         drainRebalancedActors: boolean,
//     } {
//         return {
//             actorIdleTimeout: this.actorIdleTimeout.toString().replace("PT", "").toLocaleLowerCase(),
//             actorScanInterval: this.actorScanInterval.toString().replace("PT", "").toLocaleLowerCase(),
//             drainOngoingCallTimeout: this.drainOngoingCallTimeout.toString().replace("PT", "").toLocaleLowerCase(),
//             drainRebalancedActors: this.drainRebalancedActors
//         }
//     }
// }