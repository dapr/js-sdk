/*
Copyright 2026 The Dapr Authors
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
import { AbstractActor } from "../../src";
import DemoActorStateTtlInterface from "./DemoActorStateTtlInterface";

const toTtl = (ttlSeconds?: number) =>
  ttlSeconds === undefined || ttlSeconds === null ? undefined : Temporal.Duration.from({ seconds: ttlSeconds });

export default class DemoActorStateTtlImpl extends AbstractActor implements DemoActorStateTtlInterface {
  async setState(key: string, value: string, ttlSeconds?: number): Promise<void> {
    await this.getStateManager<string>().setState(key, value, toTtl(ttlSeconds));
  }

  async addState(key: string, value: string, ttlSeconds?: number): Promise<void> {
    await this.getStateManager<string>().addState(key, value, toTtl(ttlSeconds));
  }

  async addOrUpdateState(key: string, value: string, ttlSeconds?: number): Promise<string> {
    return this.getStateManager<string>().addOrUpdateState(key, value, () => value, toTtl(ttlSeconds));
  }

  async getState(key: string): Promise<string | null> {
    const [hasValue, value] = await this.getStateManager<string>().tryGetState(key);
    return hasValue ? value : null;
  }

  async hasState(key: string): Promise<boolean> {
    return this.getStateManager<string>().containsState(key);
  }
}
