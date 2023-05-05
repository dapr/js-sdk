/*
Copyright 2023 The Dapr Authors
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

import { AbstractActor } from "../../src";
import DemoActorTTLStateInterface from "./DemoActorTTLStateInterface";

export default class DemoActorTTLStateImpl extends AbstractActor implements DemoActorTTLStateInterface {
  async init(): Promise<string> {
    await this.getStateManager().getOrAddState("data", "Hello World!");

    return "state initialized";
  }

  async getState<T>(): Promise<T | null> {
    return await this.getStateManager<T>().getState("data");
  }

  async deleteState(key: string): Promise<void> {
    await this.getStateManager().removeState(key);
    await this.getStateManager().saveState();
  }

  async setStateWithTTL<T>(key: string, value: T, ttl: number): Promise<void> {
    await this.getStateManager<T>().setStateWithTTL(key, value, ttl);
    await this.getStateManager().saveState();
  }
}
