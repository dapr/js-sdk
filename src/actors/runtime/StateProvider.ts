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

import { OperationType } from "../../types/Operation.type";
import ActorId from "../ActorId";
import ActorClient from "../client/ActorClient/ActorClient";
import ActorStateChange from "./ActorStateChange";
import StateChangeKind from "./StateChangeKind";

export default class StateProvider {
  actorClient: ActorClient;

  constructor(actorClient: ActorClient) {
    this.actorClient = actorClient;
  }

  async containsState(actorType: string, actorId: ActorId, stateName: string): Promise<boolean> {
    const rawStateValue = await this.actorClient.actor.stateGet(actorType, actorId, stateName);
    return !!rawStateValue && rawStateValue.length > 0;
  }

  // SEE https://github.com/dapr/python-sdk/blob/0f0b6f6a1cf45d2ac0c519b48fc868898d81124e/dapr/actor/runtime/_state_provider.py#L24
  async tryLoadState(actorType: string, actorId: ActorId, stateName: string): Promise<[boolean, any]> {
    const rawStateValue = await this.actorClient.actor.stateGet(actorType, actorId, stateName);

    if (!rawStateValue || rawStateValue.length === 0) {
      return [false, undefined];
    }

    // const result = this.serializer.deserialize(rawStateValue);

    return [true, rawStateValue];
  }

  /**
   * Create and save the state through a transactional update request body. E.g.
   * [
   *     {
   *         "operation": "upsert",
   *         "request": {
   *             "key": "key1",
   *             "value": "myData"
   *         }
   *     },
   *     {
   *         "operation": "delete",
   *         "request": {
   *             "key": "key2"
   *         }
   *     }
   * ]
   * @param actorType
   * @param actorId
   * @param stateChanges
   */
  async saveState(actorType: string, actorId: ActorId, stateChanges: ActorStateChange<any>[]): Promise<void> {
    const jsonOutput: OperationType[] = [];

    for (const state of stateChanges) {
      let operation;

      switch (state.getChangeKind()) {
        case StateChangeKind.ADD:
          // dapr doesn't know add, we use upsert
          // https://github.com/dapr/dapr/blob/master/pkg/actors/transactional_state_request.go
          operation = "upsert";
          break;
        case StateChangeKind.REMOVE:
          operation = "delete";
          break;
        case StateChangeKind.UPDATE:
          // dapr doesn't know add, we use upsert
          // https://github.com/dapr/dapr/blob/master/pkg/actors/transactional_state_request.go
          operation = "upsert";
          break;
        default:
          // skip
          continue;
      }

      jsonOutput.push({
        operation,
        request: {
          key: state.getStateName(),
          value: state.getValue() as string,
        },
      });
    }

    await this.actorClient.actor.stateTransaction(actorType, actorId, jsonOutput);
  }
}
