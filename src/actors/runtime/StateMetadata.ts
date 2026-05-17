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
 * Tracks the current value and modification state of a cached actor state item.
 *
 * The actor state manager uses StateMetadata to maintain a local cache of state
 * during an actor method invocation. Each state item tracks both its current value
 * and the kind of modification that has been applied to it since it was loaded or
 * created.
 *
 * This metadata is transient—it is cleared at the beginning of each actor method
 * invocation and persisted at the end through the state provider.
 *
 * @typeParam T - The type of the state value.
 *
 * @internal Intended for use by ActorStateManager; not typically used directly by application code.
 */
export default class StateMetadata<T> {
  private value: T;
  private changeKind: StateChangeKind;

  /**
   * Constructs a StateMetadata instance.
   *
   * @param value - The current state value.
   * @param changeKind - The type of modification applied to this state ({@link StateChangeKind}).
   */
  constructor(value: T, changeKind: StateChangeKind) {
    this.value = value;
    this.changeKind = changeKind;
  }

  /**
   * Retrieves the current state value.
   *
   * @returns The state value.
   */
  getValue(): T {
    return this.value;
  }

  /**
   * Retrieves the modification kind for this state item.
   *
   * @returns The {@link StateChangeKind} indicating ADD, UPDATE, REMOVE, or NONE.
   */
  getChangeKind(): StateChangeKind {
    return this.changeKind;
  }

  /**
   * Updates the state value.
   *
   * @param value - The new state value.
   */
  setValue(value: T): void {
    this.value = value;
  }

  /**
   * Updates the modification kind for this state item.
   *
   * @param changeKind - The new {@link StateChangeKind}.
   */
  setChangeKind(changeKind: StateChangeKind): void {
    this.changeKind = changeKind;
  }
}
