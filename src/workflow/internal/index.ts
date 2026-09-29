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

import type { TWorkflow } from "../../types/workflow/Workflow.type";
import type { TWorkflowActivity } from "../../types/workflow/Activity.type";
import { getName } from "../engine/task";
import { WorkflowClientOptions } from "../../types/workflow/WorkflowClientOption";
import { Settings } from "../../utils/Settings.util";
import { GrpcEndpoint } from "../../network/GrpcEndpoint";

export function getFunctionName(fn: TWorkflow | TWorkflowActivity<unknown, unknown>): string {
  return getName(fn as Function);
}

export function generateEndpoint(options: Partial<WorkflowClientOptions>): GrpcEndpoint {
  const host = options?.daprHost ?? Settings.getDefaultHost();
  const port = options?.daprPort ?? Settings.getDefaultGrpcPort();
  let uri = `${host}:${port}`;

  if (!(options?.daprHost || options?.daprPort)) {
    const endpoint = Settings.getDefaultGrpcEndpoint();
    if (endpoint != "") {
      uri = endpoint;
    }
  }

  return new GrpcEndpoint(uri);
}

export function getDaprApiToken(options: Partial<WorkflowClientOptions>): string | undefined {
  return options?.daprApiToken ?? Settings.getDefaultApiToken();
}
