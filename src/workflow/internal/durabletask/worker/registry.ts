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

import { getName } from "../task";
import { TActivity } from "../types/activity.type";
import { TInput } from "../types/input.type";
import { TOrchestrator } from "../types/orchestrator.type";
import { TOutput } from "../types/output.type";

export class Registry {
  private _orchestrators: Record<string, TOrchestrator>;
  private _activities: Record<string, TActivity<TInput, TOutput>>;

  constructor() {
    this._orchestrators = {};
    this._activities = {};
  }

  addOrchestrator(fn: TOrchestrator): string {
    if (!fn) {
      throw new Error("An orchestrator function argument is required.");
    }

    const name = getName(fn);
    this.addNamedOrchestrator(name, fn);
    return name;
  }

  addNamedOrchestrator(name: string, fn: TOrchestrator): void {
    if (!name) {
      throw new Error("A non-empty orchestrator name is required.");
    }

    if (name in this._orchestrators) {
      throw new Error(`A '${name}' orchestrator already exists.`);
    }

    this._orchestrators[name] = fn;
  }

  getOrchestrator(name?: string): TOrchestrator | undefined {
    if (!name) {
      return undefined;
    }

    return this._orchestrators[name];
  }

  addActivity(fn: TActivity<TInput, TOutput>): string {
    if (!fn) {
      throw new Error("An activity function argument is required.");
    }

    const name = getName(fn);
    this.addNamedActivity(name, fn);
    return name;
  }

  addNamedActivity(name: string, fn: TActivity<TInput, TOutput>): void {
    if (!name) {
      throw new Error("A non-empty activity name is required.");
    }

    if (name in this._activities) {
      throw new Error(`A '${name}' activity already exists.`);
    }

    this._activities[name] = fn;
  }

  getActivity(name: string): TActivity<TInput, TOutput> | undefined {
    return this._activities[name];
  }

}
