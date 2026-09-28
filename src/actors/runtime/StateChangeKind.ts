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

/**
 * Discriminates the type of modification made to an actor state item.
 *
 * The actor state manager tracks modifications to actor state through transactional
 * state batches. Each change is tagged with its kind to determine how the state
 * persistence layer should handle it when `saveState()` is called.
 *
 * State changes are staged locally and only persisted when {@link ActorStateManager#saveState}
 * is explicitly called (typically at the end of each actor method invocation).
 */
enum StateChangeKind {
  /**
   * No pending modification for this state item.
   *
   * The state item exists in persistent storage but has not been modified during
   * this invocation. No action is required on persistence.
   */
  NONE = 0,

  /**
   * State item is newly added and must be persisted.
   *
   * This state key did not exist before this invocation and has been created through
   * `addState()` or `getOrAddState()`. Will be persisted as an "upsert" (insert or update)
   * operation to the state provider.
   */
  ADD = 1,

  /**
   * State item has been modified and must be updated in persistent storage.
   *
   * The state key existed prior to this invocation (or was marked for removal) and has been
   * modified through `setState()` or `addOrUpdateState()`. Will be persisted as an "upsert"
   * operation to the state provider.
   */
  UPDATE = 2,

  /**
   * State item must be removed from persistent storage.
   *
   * This state key is marked for deletion through `removeState()` or `tryRemoveState()`.
   * Will be persisted as a "delete" operation to the state provider.
   */
  REMOVE = 3,
}

export default StateChangeKind;
