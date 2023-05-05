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

import { AbstractActor } from "../../src";
import DemoActorDeleteStateInterface from "./DemoActorDeleteStateInterface";

export default class DemoActorDeleteStateImpl extends AbstractActor implements DemoActorDeleteStateInterface {
  async init(): Promise<string> {
    await this.getStateManager().getOrAddState("data", "Hello World!");

    return "state initialized";
  }

  async tryGetState(): Promise<boolean | null> {
    const [hasValue, _] = await this.getStateManager().tryGetState("data");
    return hasValue;
  }

  async deleteState(key: string): Promise<void> {
    await this.getStateManager().removeState(key);
    await this.getStateManager().saveState();
  }
}
