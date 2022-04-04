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

/**
 * ActorReentrancyConfig configures the actor reentrancy feature.
 * 
 * See https://docs.dapr.io/developing-applications/building-blocks/actors/actor-reentrancy/
 */
export default class ActorReentrancyConfig {
    /**
     * Initializes {@link ActorReentrancyConfig} to configure actor reentrancy.
     * 
     * @param enabled If true, Reentrancy feature is enabled. Disabled by default.
     * @param maxStackDepth Optional limit after which concurrent reentrant requests
     * to an actor are stopped. This is a safety measure against infinite reentrant calls.
     */
    constructor(
        public enabled: Boolean = false,
        public maxStackDepth?: Number,
    ){}
}