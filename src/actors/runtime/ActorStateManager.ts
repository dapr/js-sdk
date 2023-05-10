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

import AbstractActor from "./AbstractActor";
import ActorStateChange from "./ActorStateChange";
import StateChangeKind from "./StateChangeKind";
import StateMetadata from "./StateMetadata";

export default class ActorStateManager<T> {
  actor: AbstractActor;
  defaultStateChangeTracker: Map<string, StateMetadata<T>>;

  constructor(actor: AbstractActor) {
    this.actor = actor;
    this.defaultStateChangeTracker = new Map<string, StateMetadata<T>>();
  }

  getContextualStateTracker(): Map<string, StateMetadata<T>> {
    // @todo: reentrancy and context tracking
    // https://github.com/dapr/python-sdk/blob/0f0b6f6a1cf45d2ac0c519b48fc868898d81124e/dapr/actor/runtime/state_manager.py#L236
    return this.defaultStateChangeTracker;
  }

  async addState(stateName: string, value: T): Promise<void> {
    const res = await this.tryAddState(stateName, value);

    if (!res) {
      throw new Error(`The actor state name ${stateName} already exist`);
    }
  }

  async tryAddState(stateName: string, value: T): Promise<boolean> {
    const stateChangeTracker = this.getContextualStateTracker();

    if (stateChangeTracker.has(stateName)) {
      const stateMetadata = stateChangeTracker.get(stateName);

      if (stateMetadata?.getChangeKind() === StateChangeKind.REMOVE) {
        stateChangeTracker.set(stateName, new StateMetadata(value, StateChangeKind.UPDATE));
        return true;
      }

      return false;
    }

    const didExist = await this.actor
      .getStateProvider()
      .containsState(this.actor.getActorType(), this.actor.getActorId(), stateName);

    if (!didExist) {
      return false;
    }

    stateChangeTracker.set(stateName, new StateMetadata(value, StateChangeKind.ADD));
    return true;
  }

  async getState(stateName: string): Promise<T | null> {
    const [hasValue, value] = await this.tryGetState(stateName);

    if (hasValue) {
      return value;
    }

    throw new Error(`Actor state with name ${stateName} was not found`);
  }

  async tryGetState(stateName: string): Promise<[boolean, T | null]> {
    const stateChangeTracker = this.getContextualStateTracker();

    if (stateChangeTracker.has(stateName)) {
      const stateMetadata = stateChangeTracker.get(stateName);

      if (stateMetadata?.getChangeKind() === StateChangeKind.REMOVE) {
        return [false, null];
      }

      const val = stateMetadata?.getValue();
      return [true, val !== undefined ? val : null];
    }

    const [hasValue, value] = await this.actor
      .getStateProvider()
      .tryLoadState(this.actor.getActorType(), this.actor.getActorId(), stateName);

    if (hasValue) {
      stateChangeTracker.set(stateName, new StateMetadata(value, StateChangeKind.NONE));
    }

    return [hasValue, value];
  }

  /**
   * Sets the state of the actor with the given name to the given value.
   *
   * Note: It is recommended that you use setStateWithTTL() instead, unless you have specifically
   * created some kind of Actor State clean up outside of Dapr or you don't have an issue with the
   * Actor State store keeping state indefinitely.
   *
   * @param stateName The name of the state to set.
   * @param value The value to set the state to.
   * @returns A Promise that resolves when the state is successfully set.
   */
  async setState(stateName: string, value: T): Promise<void> {
    const stateChangeTracker = this.getContextualStateTracker();

    if (stateChangeTracker.has(stateName)) {
      const stateMetadata = stateChangeTracker.get(stateName);

      if (!stateMetadata) {
        return;
      }

      stateMetadata.setValue(value);

      if (
        stateMetadata.getChangeKind() === StateChangeKind.NONE ||
        stateMetadata.getChangeKind() === StateChangeKind.REMOVE
      ) {
        stateMetadata.setChangeKind(StateChangeKind.UPDATE);
      }

      stateChangeTracker.set(stateName, stateMetadata);

      return;
    }

    const didExist = await this.actor
      .getStateProvider()
      .containsState(this.actor.getActorType(), this.actor.getActorId(), stateName);

    if (didExist) {
      stateChangeTracker.set(stateName, new StateMetadata(value, StateChangeKind.UPDATE));
    } else {
      stateChangeTracker.set(stateName, new StateMetadata(value, StateChangeKind.ADD));
    }
  }

  /**
   * Sets the state of the actor with the given name to the given value, with the given expiration time.
   *
   * @param stateName The name of the state to set.
   * @param value The value to set the state to.
   * @param ttl The time-to-live (in seconds) for the state, after which it will expire and be removed.
   * @returns A Promise that resolves when the state is successfully set.
   */
  async setStateWithTTL(stateName: string, value: T, ttl: number): Promise<void> {
    const stateChangeTracker = this.getContextualStateTracker();

    if (stateChangeTracker.has(stateName)) {
      const stateMetadata = stateChangeTracker.get(stateName);

      if (!stateMetadata) {
        return;
      }

      stateMetadata.setValue(value);
      stateMetadata.setTTL(ttl);

      if (
        stateMetadata.getChangeKind() === StateChangeKind.NONE ||
        stateMetadata.getChangeKind() === StateChangeKind.REMOVE
      ) {
        stateMetadata.setChangeKind(StateChangeKind.UPDATE);
      }

      stateChangeTracker.set(stateName, stateMetadata);

      return;
    }

    const didExist = await this.actor
      .getStateProvider()
      .containsState(this.actor.getActorType(), this.actor.getActorId(), stateName);

    if (didExist) {
      stateChangeTracker.set(stateName, new StateMetadata(value, StateChangeKind.UPDATE, ttl));
    } else {
      stateChangeTracker.set(stateName, new StateMetadata(value, StateChangeKind.ADD, ttl));
    }
  }

  async removeState(stateName: string): Promise<void> {
    const res = await this.tryRemoveState(stateName);

    if (!res) {
      throw new Error(`The actor state with name ${stateName} was not found`);
    }
  }

  async tryRemoveState(stateName: string): Promise<boolean> {
    const stateChangeTracker = this.getContextualStateTracker();

    if (stateChangeTracker.has(stateName)) {
      const stateMetadata = stateChangeTracker.get(stateName);

      if (stateMetadata?.getChangeKind() === StateChangeKind.REMOVE) {
        return false;
      } else if (stateMetadata?.getChangeKind() === StateChangeKind.ADD) {
        stateChangeTracker.delete(stateName);
        return true;
      }

      stateMetadata?.setChangeKind(StateChangeKind.REMOVE);

      return true;
    }

    const didExist = await this.actor
      .getStateProvider()
      .containsState(this.actor.getActorType(), this.actor.getActorId(), stateName);

    if (didExist) {
      stateChangeTracker.set(stateName, new StateMetadata(null as any, StateChangeKind.REMOVE));
      return true;
    }

    return false;
  }

  async containsState(stateName: string): Promise<boolean> {
    const stateChangeTracker = this.getContextualStateTracker();

    if (stateChangeTracker.has(stateName)) {
      const stateMetadata = stateChangeTracker.get(stateName);
      return stateMetadata?.getChangeKind() !== StateChangeKind.REMOVE;
    }

    const doesContainState = await this.actor
      .getStateProvider()
      .containsState(this.actor.getActorType(), this.actor.getActorId(), stateName);
    return doesContainState;
  }

  async getOrAddState(stateName: string, value: T): Promise<T | null> {
    const stateChangeTracker = this.getContextualStateTracker();
    const [hasValue, val] = await this.tryGetState(stateName);

    if (hasValue) {
      return val;
    }

    const changeKind = (await this.isStateMarkedForRemove(stateName)) ? StateChangeKind.UPDATE : StateChangeKind.ADD;
    stateChangeTracker.set(stateName, new StateMetadata(value, changeKind));

    return value;
  }

  async isStateMarkedForRemove(stateName: string): Promise<boolean> {
    const stateChangeTracker = this.getContextualStateTracker();

    if (stateChangeTracker.has(stateName)) {
      const stateMetadata = stateChangeTracker.get(stateName);
      return stateMetadata?.getChangeKind() === StateChangeKind.REMOVE;
    }

    return false;
  }

  async addOrUpdateState(stateName: string, value: T, updateValueFactory: (a: string, b: T) => T): Promise<T> {
    const stateChangeTracker = this.getContextualStateTracker();

    if (stateChangeTracker.has(stateName)) {
      const stateMetadata = stateChangeTracker.get(stateName);

      if (!stateMetadata) {
        throw new Error("State Metadata was not set");
      }

      if (stateMetadata?.getChangeKind() === StateChangeKind.REMOVE) {
        stateChangeTracker.set(stateName, new StateMetadata(value, StateChangeKind.UPDATE));
        return value;
      }

      const newValue = updateValueFactory(stateName, stateMetadata.getValue());
      stateMetadata.setValue(newValue);

      if (stateMetadata.getChangeKind() === StateChangeKind.NONE) {
        stateMetadata.setChangeKind(StateChangeKind.UPDATE);
      }

      stateChangeTracker.set(stateName, stateMetadata);

      return newValue;
    }

    const [hasValue, val] = await this.actor
      .getStateProvider()
      .tryLoadState(this.actor.getActorType(), this.actor.getActorId(), stateName);

    if (hasValue) {
      const newValue = updateValueFactory(stateName, val);
      stateChangeTracker.set(stateName, new StateMetadata(newValue, StateChangeKind.UPDATE));
      return newValue;
    }

    stateChangeTracker.set(stateName, new StateMetadata(value, StateChangeKind.ADD));

    return value;
  }

  async getStateNames(): Promise<string[]> {
    const stateChangeTracker = this.getContextualStateTracker();

    const stateNames: string[] = [];

    stateChangeTracker.forEach((val: StateMetadata<T>, key: string) => {
      if (val.getChangeKind() === StateChangeKind.ADD || val.getChangeKind() === StateChangeKind.REMOVE) {
        stateNames.push(key);
      }
    });

    return stateNames;
  }

  async clearCache(): Promise<void> {
    const stateChangeTracker = this.getContextualStateTracker();
    stateChangeTracker.clear();
  }

  async saveState(): Promise<void> {
    const stateChangeTracker = this.getContextualStateTracker();

    if (stateChangeTracker.size === 0) {
      return;
    }

    const stateChanges: ActorStateChange<T>[] = [];
    const statesToRemove: string[] = [];

    stateChangeTracker.forEach((stateMetadata: StateMetadata<T>, stateName: string) => {
      if (stateMetadata.getChangeKind() === StateChangeKind.NONE) {
        return;
      }

      stateChanges.push(
        new ActorStateChange(
          stateName,
          stateMetadata.getValue(),
          stateMetadata.getChangeKind(),
          stateMetadata.getTTL(),
        ),
      );

      if (stateMetadata.getChangeKind() === StateChangeKind.REMOVE) {
        statesToRemove.push(stateName);
      }

      // Mark the state as unmodified so that tracking for next invocation is done correctly
      stateMetadata.setChangeKind(StateChangeKind.NONE);
    });

    if (stateChanges.length > 0) {
      await this.actor.getStateProvider().saveState(this.actor.getActorType(), this.actor.getActorId(), stateChanges);
    }

    for (const stateName of statesToRemove) {
      stateChangeTracker.delete(stateName);
    }
  }
}
