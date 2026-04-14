// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

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

import * as pb from "../../proto/orchestrator_service_pb";
import { FailureDetails } from "../failure-details";

export class TaskFailedError extends Error {
  private _details: FailureDetails;

  constructor(message: string, details: pb.TaskFailureDetails) {
    super(message);

    this._details = new FailureDetails(
      details.getErrormessage(),
      details.getErrortype(),
      details?.getStacktrace()?.getValue(),
    );
  }

  get details(): FailureDetails {
    return this._details;
  }
}
