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

import { AbstractActor } from "../../src";
import ActorId from "../../src/actors/ActorId";
import ActorStateChange from "../../src/actors/runtime/ActorStateChange";
import StateChangeKind from "../../src/actors/runtime/StateChangeKind";
import StateProvider from "../../src/actors/runtime/StateProvider";
import DaprClient from "../../src/implementation/Client/DaprClient";

export type Deferred = { promise: Promise<void>; resolve: () => void };

export function deferred(): Deferred {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
}

export const store = new Map<string, any>();

export function counterKey(actorId: string): string {
  return `${actorId}/counter`;
}

export const gates = { entered: deferred(), release: deferred() };

// when set, the next state load takes its snapshot then waits for release
export const loadHold: { release?: Deferred; entered: Deferred } = { entered: deferred() };

export function resetActivationIdFixtures(): void {
  store.clear();
  gates.entered = deferred();
  gates.release = deferred();
  loadHold.release = undefined;
  loadHold.entered = deferred();
  DemoActorActivationIdImpl.created = [];
}

export function mockStateProvider(): void {
  const key = (actorId: ActorId, name: string) => `${actorId.getId()}/${name}`;
  jest
    .spyOn(StateProvider.prototype, "tryLoadState")
    .mockImplementation(async (_t: string, actorId: ActorId, name: string) => {
      const snapshot: [boolean, any] = store.has(key(actorId, name))
        ? [true, store.get(key(actorId, name))]
        : [false, undefined];
      const hold = loadHold.release;
      if (hold) {
        loadHold.release = undefined;
        loadHold.entered.resolve();
        await hold.promise;
      }
      return snapshot;
    });
  jest
    .spyOn(StateProvider.prototype, "containsState")
    .mockImplementation(async (_t: string, actorId: ActorId, name: string) => store.has(key(actorId, name)));
  jest
    .spyOn(StateProvider.prototype, "saveState")
    .mockImplementation(async (_t: string, actorId: ActorId, changes: ActorStateChange<any>[]) => {
      for (const change of changes) {
        if (change.getChangeKind() === StateChangeKind.REMOVE) {
          store.delete(key(actorId, change.getStateName()));
        } else {
          store.set(key(actorId, change.getStateName()), change.getValue());
        }
      }
    });
}

export default class DemoActorActivationIdImpl extends AbstractActor {
  static created: DemoActorActivationIdImpl[] = [];
  deactivations = 0;
  calls = 0;

  constructor(daprClient: DaprClient, id: ActorId) {
    super(daprClient, id);
    DemoActorActivationIdImpl.created.push(this);
  }

  async onDeactivate(): Promise<void> {
    this.deactivations++;
  }

  async read(): Promise<number> {
    const [hasValue, value] = await this.getStateManager<number>().tryGetState("counter");
    return hasValue ? (value as number) : 0;
  }

  async incr(): Promise<number> {
    const value = (await this.read()) + 1;
    await this.getStateManager<number>().setState("counter", value);
    return value;
  }

  async count(): Promise<void> {
    this.calls++;
  }

  async incrThenFail(): Promise<void> {
    await this.incr();
    throw new Error("callback failed");
  }

  async incrAfterGate(): Promise<number> {
    const value = (await this.read()) + 1;
    gates.entered.resolve();
    await gates.release.promise;
    await this.getStateManager<number>().setState("counter", value);
    return value;
  }

  async receiveReminder(data: string): Promise<void> {
    if (data === "gate") {
      await this.incrAfterGate();
    } else {
      await this.incr();
    }
  }
}

export class ReadOnActivateActor extends DemoActorActivationIdImpl {
  async onActivate(): Promise<void> {
    await this.read();
  }
}
