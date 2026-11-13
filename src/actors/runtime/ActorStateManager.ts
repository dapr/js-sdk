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

  /**
   * Converts an optional TTL into an absolute expiration time.
   *
   * @throws If the TTL is not a positive duration.
   */
  private static toTtlExpireTime(ttl?: Temporal.Duration): Date | undefined {
    if (ttl === undefined) {
      return undefined;
    }

    const ms = ttl.total({ unit: "milliseconds", relativeTo: Temporal.Now.zonedDateTimeISO() });

    if (!(ms > 0)) {
      throw new Error(`The actor state TTL must be a positive duration, received ${ttl.toString()}`);
    }

    return new Date(Date.now() + ms);
  }

  /**
   * Adds a state with the given name, throwing if it already exists.
   *
   * @param stateName - The name of the state.
   * @param value - The value of the state.
   * @param ttl - Optional time-to-live after which the state store expires the state.
   */
  async addState(stateName: string, value: T, ttl?: Temporal.Duration): Promise<void> {
    const res = await this.tryAddState(stateName, value, ttl);

    if (!res) {
      throw new Error(`The actor state name ${stateName} already exist`);
    }
  }

  /**
   * Attempts to add a state with the given name.
   *
   * @param stateName - The name of the state.
   * @param value - The value of the state.
   * @param ttl - Optional time-to-live after which the state store expires the state.
   * @returns true if the state was added, false if it already exists.
   */
  async tryAddState(stateName: string, value: T, ttl?: Temporal.Duration): Promise<boolean> {
    const ttlExpireTime = ActorStateManager.toTtlExpireTime(ttl);
    const stateChangeTracker = this.getContextualStateTracker();

    if (stateChangeTracker.has(stateName)) {
      const stateMetadata = stateChangeTracker.get(stateName);

      if (stateMetadata?.getChangeKind() === StateChangeKind.REMOVE || stateMetadata?.isExpired()) {
        stateChangeTracker.set(
          stateName,
          StateMetadata.replacing(stateMetadata, value, StateChangeKind.UPDATE, ttlExpireTime),
        );
        return true;
      }

      return false;
    }

    const didExist = await this.actor
      .getStateProvider()
      .containsState(this.actor.getActorType(), this.actor.getActorId(), stateName);

    if (didExist) {
      return false;
    }

    stateChangeTracker.set(stateName, new StateMetadata(value, StateChangeKind.ADD, ttlExpireTime));
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

      if (stateMetadata?.getChangeKind() === StateChangeKind.REMOVE || stateMetadata?.isExpired()) {
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
   * Sets a state, adding it if it does not exist.
   *
   * Setting a state without a TTL removes any TTL previously applied to it by this actor
   * instance (persisted as `ttlInSeconds: -1`). TTLs applied in an earlier activation are not
   * tracked, so the state store keeps them unless a new TTL is provided.
   *
   * Using a TTL requires the `ActorStateTTL` feature to be enabled in the Dapr Configuration and a
   * state store that supports TTLs.
   *
   * @param stateName - The name of the state.
   * @param value - The value of the state.
   * @param ttl - Optional time-to-live after which the state store expires the state.
   */
  // SEE: https://github.com/dapr/python-sdk/blob/0f0b6f6a1cf45d2ac0c519b48fc868898d81124e/dapr/actor/runtime/state_manager.py#L236
  async setState(stateName: string, value: T, ttl?: Temporal.Duration): Promise<void> {
    const ttlExpireTime = ActorStateManager.toTtlExpireTime(ttl);
    const stateChangeTracker = this.getContextualStateTracker();

    if (stateChangeTracker.has(stateName)) {
      const stateMetadata = stateChangeTracker.get(stateName);

      if (!stateMetadata) {
        return;
      }

      stateMetadata.setValue(value);
      stateMetadata.setTtlExpireTime(ttlExpireTime);

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
      stateChangeTracker.set(stateName, new StateMetadata(value, StateChangeKind.UPDATE, ttlExpireTime));
    } else {
      stateChangeTracker.set(stateName, new StateMetadata(value, StateChangeKind.ADD, ttlExpireTime));
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

      if (stateMetadata?.isExpired()) {
        stateChangeTracker.delete(stateName);
        return false;
      }

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
      return stateMetadata?.getChangeKind() !== StateChangeKind.REMOVE && !stateMetadata?.isExpired();
    }

    const doesContainState = await this.actor
      .getStateProvider()
      .containsState(this.actor.getActorType(), this.actor.getActorId(), stateName);
    return doesContainState;
  }

  /**
   * Gets a state, adding it with the given value if it does not exist.
   *
   * @param stateName - The name of the state.
   * @param value - The value to add if the state does not exist.
   * @param ttl - Optional time-to-live applied only when the state is added.
   */
  async getOrAddState(stateName: string, value: T, ttl?: Temporal.Duration): Promise<T | null> {
    const ttlExpireTime = ActorStateManager.toTtlExpireTime(ttl);
    const stateChangeTracker = this.getContextualStateTracker();
    const [hasValue, val] = await this.tryGetState(stateName);

    if (hasValue) {
      return val;
    }

    // A tracked (removed or expired) entry may still exist in the store, so upsert as an update.
    const changeKind = stateChangeTracker.has(stateName) ? StateChangeKind.UPDATE : StateChangeKind.ADD;
    stateChangeTracker.set(
      stateName,
      StateMetadata.replacing(stateChangeTracker.get(stateName), value, changeKind, ttlExpireTime),
    );

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

  /**
   * Adds a state if it does not exist, or updates it using the factory if it does.
   *
   * Like {@link setState}, omitting the TTL removes a TTL previously applied by this actor instance.
   *
   * @param stateName - The name of the state.
   * @param value - The value to add if the state does not exist.
   * @param updateValueFactory - Produces the new value from the existing one.
   * @param ttl - Optional time-to-live after which the state store expires the state.
   */
  async addOrUpdateState(
    stateName: string,
    value: T,
    updateValueFactory: (a: string, b: T) => T,
    ttl?: Temporal.Duration,
  ): Promise<T> {
    const ttlExpireTime = ActorStateManager.toTtlExpireTime(ttl);
    const stateChangeTracker = this.getContextualStateTracker();

    if (stateChangeTracker.has(stateName)) {
      const stateMetadata = stateChangeTracker.get(stateName);

      if (!stateMetadata) {
        throw new Error("State Metadata was not set");
      }

      if (stateMetadata.getChangeKind() === StateChangeKind.REMOVE || stateMetadata.isExpired()) {
        stateChangeTracker.set(
          stateName,
          StateMetadata.replacing(stateMetadata, value, StateChangeKind.UPDATE, ttlExpireTime),
        );
        return value;
      }

      const newValue = updateValueFactory(stateName, stateMetadata.getValue());
      stateMetadata.setValue(newValue);
      stateMetadata.setTtlExpireTime(ttlExpireTime);

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
      stateChangeTracker.set(stateName, new StateMetadata(newValue, StateChangeKind.UPDATE, ttlExpireTime));
      return newValue;
    }

    stateChangeTracker.set(stateName, new StateMetadata(value, StateChangeKind.ADD, ttlExpireTime));

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
          stateMetadata.getTtlExpireTime(),
          stateMetadata.isTtlRemoved(),
        ),
      );

      stateMetadata.clearTtlRemoved();

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
