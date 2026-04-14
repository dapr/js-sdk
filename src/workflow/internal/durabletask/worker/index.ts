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

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { NonDeterminismError } from "../task/exception/non-determinism-error";
import * as pb from "../proto/orchestrator_service_pb";
import { enumValueToKey } from "../utils/enum.util";

export function getNonDeterminismError(taskId: number, actionName: string): NonDeterminismError {
  return new NonDeterminismError(
    `A previous execution called ${actionName} with ID=${taskId} but the current execution doesn't have this action with this ID. This problem occurs when either the orchestration has non-deterministic logic or if the code was changed after an instance of this orchestration already started running`,
  );
}

export function getWrongActionTypeError(
  taskId: number,
  expectedMethodName: string,
  action: pb.OrchestratorAction,
): NonDeterminismError {
  const unexpectedMethodName = getMethodNameForAction(action);
  return new NonDeterminismError(
    `Failed to restore orchestration state due to a history mismatch: A previous execution called ${expectedMethodName} with ID=${taskId}, but the current execution is instead trying to call ${unexpectedMethodName} as part of rebuilding its history. This kind of mismatch can happen if an orchestration has non-deterministic logic or if the code was changed after an instance of this orchestration already started running.`,
  );
}

export function getWrongActionNameError(
  taskId: number,
  methodName: string,
  expectedTaskName?: string,
  actualTaskName?: string,
): NonDeterminismError {
  return new NonDeterminismError(
    `Failed to restore orchestration state due to a history mismatch: A previous execution called ${methodName} with name='${expectedTaskName}' and sequence number ${taskId}, but the current execution is instead trying to call ${actualTaskName} as part of rebuilding its history. This kind of mismatch can happen if an orchestration has non-deterministic logic or if the code was changed after an instance of this orchestration already started running.`,
  );
}

export function getMethodNameForAction(action: pb.OrchestratorAction): string {
  const actionType = action.getOrchestratoractiontypeCase();

  // What we think is easy is not that easy in Typescript
  // it is not javascript, but typescript that implements methods as abstract
  // this means that we cannot just get the name of the method from the prototype
  // instead, we hardcode them here
  switch (actionType) {
    case pb.OrchestratorAction.OrchestratoractiontypeCase.SCHEDULETASK:
      return "callActivity";
    case pb.OrchestratorAction.OrchestratoractiontypeCase.CREATETIMER:
      return "createTimer";
    case pb.OrchestratorAction.OrchestratoractiontypeCase.CREATESUBORCHESTRATION:
      return "callSubOrchestrator";
    case pb.OrchestratorAction.OrchestratoractiontypeCase.COMPLETEORCHESTRATION:
      return "completeOrchestration";
    default:
      throw new Error(`Unknown action type: ${actionType}`);
  }
}

export function getNewEventSummary(newEvents: pb.HistoryEvent[]): string {
  if (!newEvents?.length) {
    return "[]";
  } else if (newEvents.length === 1) {
    const enumKey = enumValueToKey(pb.HistoryEvent.EventtypeCase, newEvents[0].getEventtypeCase());
    return `[${enumKey}]`;
  } else {
    const counts = new Map<string, number>();

    for (const event of newEvents) {
      const eventTypeName = enumValueToKey(pb.HistoryEvent.EventtypeCase, event.getEventtypeCase()) ?? "UNKNOWN";
      const count = counts.get(eventTypeName) ?? 0;
      counts.set(eventTypeName, count + 1);
    }

    return `[${Array.from(counts.entries())
      .map(([name, count]) => `${name}=${count}`)
      .join(", ")}]`;
  }
}

/**
 * Returns a summary of the new actions that can be used for logging
 * @param newActions
 */
export function getActionSummary(newActions: pb.OrchestratorAction[]): string {
  if (!newActions?.length) {
    return "[]";
  } else if (newActions.length === 1) {
    const actionType = newActions[0].getOrchestratoractiontypeCase();
    const actionTypeName = enumValueToKey(pb.OrchestratorAction.OrchestratoractiontypeCase, actionType) ?? "UNKNOWN";

    return actionTypeName;
  } else {
    const counts = new Map<string, number>();

    for (const action of newActions) {
      const actionType = action.getOrchestratoractiontypeCase();
      const actionTypeName = enumValueToKey(pb.OrchestratorAction.OrchestratoractiontypeCase, actionType) ?? "UNKNOWN";

      const count = counts.get(actionTypeName) ?? 0;
      counts.set(actionTypeName, count + 1);
    }

    return `[${Array.from(counts.entries())
      .map(([name, count]) => `${name}=${count}`)
      .join(", ")}]`;
  }
}

/**
 * Returns true of the event is one that can be suspended and resumed
 * @param event
 */
export function isSuspendable(event: pb.HistoryEvent): boolean {
  return (
    [pb.HistoryEvent.EventtypeCase.EXECUTIONRESUMED, pb.HistoryEvent.EventtypeCase.EXECUTIONTERMINATED].indexOf(
      event.getEventtypeCase(),
    ) === -1
  );
}
