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

import { ActorReentrancyOptions } from "./ActorReentrancyOptions";

/**
 * ActorRuntimeOptions provides options for configuring the actor runtime in Dapr.
 * For more, see https://docs.dapr.io/developing-applications/building-blocks/actors/howto-actors/.
 */
export type ActorRuntimeOptions = {
    /**
     * The timeout before deactivating an idle actor. 
     * Checks for timeouts occur every `actorScanInterval` interval.
     * It uses the format required by [time.ParseDuration](https://pkg.go.dev/time#ParseDuration).
     */
    actorIdleTimeout?: string;

    /**
     * Specifies how often to scan for idle actors to deactivate them.
     * Actors that have been idle longer than `actorIdleTimeout` will be deactivated. 
     * It uses the format required by [time.ParseDuration](https://pkg.go.dev/time#ParseDuration).
     */
    actorScanInterval?: string;

    /**
     * The timeout before draining current active actor methods. 
     * If there is no current actor method call, this is ignored.
     * It uses the format required by [time.ParseDuration](https://pkg.go.dev/time#ParseDuration).
     */
    drainOngoingCallTimeout?: string;

    /**
     * If true, Dapr will wait for `drainOngoingCallTimeout` before 
     * draining current active actor methods.
     */
    drainRebalancedActors?: boolean;

    /**
     * Configures different reentrancy parameters.
     */
    reentrancy?: ActorReentrancyOptions;

    /**
     * Specifies the number of partitions for actor’s reminders.
     * If not provided, all reminders are saved as a single record in actor’s state store.
     */
    remindersStoragePartitions?: number;
}