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

import StateChangeKind from "./StateChangeKind";

/**
 * Represents a single state mutation ready for persistence.
 *
 * ActorStateChange encapsulates a state modification that is ready to be sent to the
 * state provider for persistence. It combines the state key, the new value, and the
 * type of modification (add, update, or remove).
 *
 * These objects are created during the transactional batch process by ActorStateManager
 * and are sent to StateProvider for atomic persistence through the Dapr state management API.
 *
 * @typeParam T - The type of the state value.
 *
 * @internal Used by ActorStateManager and StateProvider for transactional persistence.
 */
export default class ActorStateChange<T> {
  private readonly stateName: string;
  private readonly value: T;
  private readonly changeKind: StateChangeKind;

  /**
   * Constructs an ActorStateChange.
   *
   * @param stateName - The key identifying this state item.
   * @param value - The new value to persist (or null for removes).
   * @param changeKind - The type of modification ({@link StateChangeKind}).
   */
  constructor(stateName: string, value: T, changeKind: StateChangeKind) {
    this.stateName = stateName;
    this.value = value;
    this.changeKind = changeKind;
  }

  /**
   * Retrieves the state key.
   *
   * @returns The key identifying this state item.
   */
  getStateName(): string {
    return this.stateName;
  }

  /**
   * Retrieves the state value to be persisted.
   *
   * @returns The new state value (or null for removes).
   */
  getValue(): T {
    return this.value;
  }

  /**
   * Retrieves the kind of modification.
   *
   * @returns The {@link StateChangeKind} (ADD, UPDATE, or REMOVE).
   */
  getChangeKind(): StateChangeKind {
    return this.changeKind;
  }
}
