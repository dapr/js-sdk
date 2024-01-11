/*
Copyright 2024 The Dapr Authors
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

import WorkflowContext from "../../workflow/runtime/WorkflowContext";
import { Task } from "@microsoft/durabletask-js/task/task";
import { TOutput } from "./InputOutput.type";

/**
 * The type of the workflow.
 */
export type TWorkflow = (context: WorkflowContext, input: any) => Generator<Task<any>, any, any> | TOutput;
