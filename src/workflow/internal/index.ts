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

import { TInput, TOutput } from "../../types/workflow/InputOutput.type";
import { TWorkflowActivity } from "../../types/workflow/Activity.type";
import { TWorkflow } from "../../types/workflow/Workflow.type";
import * as grpc from "@grpc/grpc-js";
import { WorkflowClientOptions } from "../../types/workflow/WorkflowClientOption";
import { Settings } from "../../utils/Settings.util";
import { GrpcEndpoint } from "../../network/GrpcEndpoint";

/**
 * Gets the name of a function from its definition or string representation.
 *
 * @param fn - The function for which the name is to be retrieved. Can be either a function or a string representation of a function.
 * @returns The name of the function.
 *
 * @typeparam TWorkflow - The type of the workflow function.
 * @typeparam TInput - The type of the input for the workflow activity.
 * @typeparam TOutput - The type of the output for the workflow activity.
 */
export function getFunctionName(fn: TWorkflow | TWorkflowActivity<TInput, TOutput>): string {
  if (fn.name) {
    return fn.name;
  } else {
    const match = fn.toString().match(/function\s*([^(]*)\(/);
    if (match === null) {
      throw new Error("Unable to determine function name, try to sepecify the workflow/activity name explicitly.");
    }
    return match[1];
  }
}

/**
 * Generates a Dapr gRPC endpoint based on the provided options or defaults.
 *
 * @param options - An object containing optional settings for the WorkflowClient.
 * @returns A GrpcEndpoint representing the Dapr gRPC endpoint.
 */
export function generateEndpoint(options: Partial<WorkflowClientOptions>): GrpcEndpoint {
  const host = options?.daprHost ?? Settings.getDefaultHost();
  const port = options?.daprPort ?? Settings.getDefaultGrpcPort();
  const uri = `${host}:${port}`;
  return new GrpcEndpoint(uri);
}

/**
 * Gets the Dapr API token based on the provided options or defaults.
 *
 * @param options - An object containing optional settings for the WorkflowClient.
 * @returns A string representing the Dapr API token, or undefined if not set.
 */
export function getDaprApiToken(options: Partial<WorkflowClientOptions>): string | undefined {
  const daprApiToken = options?.daprApiToken ?? Settings.getDefaultApiToken();
  return daprApiToken;
}

/**
 * Generates a gRPC interceptor function that adds a Dapr API token to the metadata if not already present.
 * This interceptor is intended for use with gRPC client calls.
 *
 * @param options - The gRPC call options object.
 * @param nextCall - The next call function in the interceptor chain.
 * @returns A gRPC InterceptingCall instance with added functionality to include a Dapr API token in the metadata.
 */
export function generateApiTokenClientInterceptors(
  workflowOptions: Partial<WorkflowClientOptions>,
): (options: any, nextCall: any) => grpc.InterceptingCall {
  return (options: any, nextCall: any) => {
    return new grpc.InterceptingCall(nextCall(options), {
      start: (metadata, listener, next) => {
        if (metadata.get("dapr-api-token").length == 0) {
          metadata.add("dapr-api-token", workflowOptions.daprApiToken as grpc.MetadataValue);
        }
        next(metadata, listener);
      },
    });
  };
}
