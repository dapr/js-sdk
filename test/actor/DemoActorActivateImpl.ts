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
import DemoActorActivateInterface from "./DemoActorActivateInterface";

export default class DemoActorActivateImpl extends AbstractActor implements DemoActorActivateInterface {
  isActivated = false;
  activateCallCount = 0;
  isDeactivated = false;
  deactivatedCallCount = 0;

  async onActivate(): Promise<void> {
    try {
      const callCountActivated = (await this.getStateManager().getState("call_count_activated")) as number;
      await this.getStateManager().setState("is_activated", true);
      await this.getStateManager().setState("call_count_activated", callCountActivated + 1);
    } catch (e) {
      await this.getStateManager().setState("is_activated", true);
      await this.getStateManager().setState("call_count_activated", 1);
    }

    // Set the properties on activate from the state store
    const resIsActivated = (await this.getStateManager().getState("is_activated")) as boolean;
    const resCallCountActivated = (await this.getStateManager().getState("call_count_activated")) as number;
    this.isActivated = resIsActivated;
    this.activateCallCount = resCallCountActivated;

    // This will work the second time, so just catch but do nothing
    // the values are populated after deactivation
    try {
      const resCallCountDeactivated = (await this.getStateManager().getState("call_count_deactivated")) as number;
      const resIsDeactivated = (await this.getStateManager().getState("is_deactivated")) as boolean;
      this.isDeactivated = resIsDeactivated;
      this.deactivatedCallCount = resCallCountDeactivated;
    } catch (e) {
      console.log(e);
    }
  }

  async onDeactivate(): Promise<void> {
    try {
      const callCountDeactivated = (await this.getStateManager().getState("call_count_deactivated")) as number;
      await this.getStateManager().setState("is_deactivated", true);
      await this.getStateManager().setState("call_count_deactivated", callCountDeactivated + 1);
    } catch (e) {
      await this.getStateManager().setState("is_deactivated", true);
      await this.getStateManager().setState("call_count_deactivated", 1);
    }
  }

  async getIsActivated(): Promise<boolean> {
    return this.isActivated;
  }

  async getIsDeactivated(): Promise<boolean> {
    return this.isDeactivated;
  }

  async getDeactivatedCallCount(): Promise<number> {
    return this.deactivatedCallCount;
  }

  async getActivatedCallCount(): Promise<number> {
    return this.activateCallCount;
  }
}
