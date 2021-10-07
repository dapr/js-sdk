import { DaprClient } from "../..";
import { OperationType } from "../../types/Operation.type";
import ActorStateChange from "./ActorStateChange";
import StateChangeKind from "./StateChangeKind";

export default class StateProvider {
  stateClient: DaprClient;

  constructor(daprClient: DaprClient) {
    this.stateClient = daprClient;
  }

  async containsState(actorType: string, actorId: string, stateName: string): Promise<boolean> {
    const rawStateValue = await this.stateClient.actor.stateGet(actorType, actorId, stateName);
    return !!rawStateValue && rawStateValue.length > 0;
  }

  // SEE https://github.com/dapr/python-sdk/blob/0f0b6f6a1cf45d2ac0c519b48fc868898d81124e/dapr/actor/runtime/_state_provider.py#L24
  async tryLoadState(actorType: string, actorId: string, stateName: string): Promise<[boolean, any]> {
    const rawStateValue = await this.stateClient.actor.stateGet(actorType, actorId, stateName);

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
  async saveState(actorType: string, actorId: string, stateChanges: ActorStateChange<any>[]): Promise<void> {
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
          operation = "remove";
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
          value: state.getValue() as string
        }
      });
    }

    await this.stateClient.actor.stateTransaction(actorType, actorId, jsonOutput);
  }
}