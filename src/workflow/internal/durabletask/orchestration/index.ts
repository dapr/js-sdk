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

import * as pb from "../proto/orchestrator_service_pb";
import { FailureDetails } from "../task/failure-details";
import { fromProtobuf } from "./enum/orchestration-status.enum";
import { OrchestrationState } from "./orchestration-state";

export function newOrchestrationState(
  instanceId: string,
  res?: pb.GetInstanceResponse,
): OrchestrationState | undefined {
  if (!res || !res.getExists()) {
    return;
  }

  const state = res.getOrchestrationstate();
  let failureDetails;

  const failureDetailsErrorMessage = state?.getFailuredetails()?.getErrormessage();
  const failureDetailsErrorType = state?.getFailuredetails()?.getErrortype();

  if (state && failureDetailsErrorMessage && failureDetailsErrorType) {
    failureDetails = new FailureDetails(
      failureDetailsErrorMessage,
      failureDetailsErrorType,
      state.getFailuredetails()?.getStacktrace()?.getValue(),
    );
  }

  // Convert Timestamp seconds and nanos to Date
  const tsCreated = state?.getCreatedtimestamp();
  const tsUpdated = state?.getLastupdatedtimestamp();

  let tsCreatedParsed = new Date();
  let tsUpdatedParsed = new Date();

  if (tsCreated) {
    tsCreatedParsed = new Date(tsCreated.getSeconds() * 1000 + tsCreated.getNanos() / 1000000);
  }

  if (tsUpdated) {
    tsUpdatedParsed = new Date(tsUpdated.getSeconds() * 1000 + tsUpdated.getNanos() / 1000000);
  }

  return new OrchestrationState(
    instanceId,
    state?.getName() ?? "",
    fromProtobuf(state?.getOrchestrationstatus() ?? 0),
    new Date(tsCreatedParsed),
    new Date(tsUpdatedParsed),
    state?.getInput()?.getValue(),
    state?.getOutput()?.getValue(),
    state?.getCustomstatus()?.getValue(),
    failureDetails,
  );
}
