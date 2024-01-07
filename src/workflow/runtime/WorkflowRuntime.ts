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

import * as grpc from "@grpc/grpc-js";
import { ActivityContext, OrchestrationContext, TaskHubGrpcWorker } from "kaibocai-durabletask-js";
import { TWorkflow } from "../../types/workflow/Workflow.type";
import { TWorkflowActivity } from "../../types/workflow/Activity.type";
import { TInput, TOutput } from "../../types/workflow/InputOutput.type";
import WorkflowActivityContext from "./WorkflowActivityContext";
import WorkflowContext from "./WorkflowContext";
import { generateInterceptors } from "../internal/ApiTokenClientInterceptor";
import { getFunctionName } from "../internal";

export default class WorkflowRuntime {
  private worker: TaskHubGrpcWorker;
  constructor(hostAddress?: string, options?: grpc.ChannelOptions) {
    const innerOptions = {
      ...options,
      interceptors: [generateInterceptors(), ...(options?.interceptors ?? [])],
    };
    this.worker = new TaskHubGrpcWorker(hostAddress, innerOptions);
  }

  /**
   * Registers a Workflow implementation for handling orchestrations.
   *
   * @param {TWorkflow} workflow - The instance of the Workflow class being registered.
   */
  public registerWorkflow(workflow: TWorkflow): WorkflowRuntime {
    const name = getFunctionName(workflow);
    const workflowWrapper = (ctx: OrchestrationContext, input: any): any => {
      const workflowContext = new WorkflowContext(ctx);
      return workflow(workflowContext, input);
    };
    this.worker.addNamedOrchestrator(name, workflowWrapper);
    return this;
  }

  /**
   * Registers a Workflow implementation for handling orchestrations with a given name.
   *
   * @param {string} name - The name or identifier for the registered Workflow.
   * @param {TWorkflow} workflow - The instance of the Workflow class being registered.
   */
  public registerWorkflowWithName(name: string, workflow: TWorkflow): WorkflowRuntime {
    const workflowWrapper = (ctx: OrchestrationContext, input: any): any => {
      const workflowContext = new WorkflowContext(ctx);
      return workflow(workflowContext, input);
    };
    this.worker.addNamedOrchestrator(name, workflowWrapper);
    return this;
  }

  /**
   * Registers an Activity object.
   *
   * @param {TWorkflowActivity<TInput, TOutput>} fn - The instance of the WorkflowActivity class being registered.
   * @returns {WorkflowRuntime} The current instance of WorkflowRuntime.
   */
  public registerActivity(fn: TWorkflowActivity<TInput, TOutput>): WorkflowRuntime {
    const name = getFunctionName(fn);
    const activityWrapper = (ctx: ActivityContext, intput: TInput): TOutput => {
      const wfActivityContext = new WorkflowActivityContext(ctx);
      return fn(wfActivityContext, intput);
    };
    this.worker.addNamedActivity(name, activityWrapper);
    return this;
  }

  /**
   * Registers an Activity object with a given name.
   *
   * @param {string} name - The name or identifier for the registered Activity.
   * @param {TWorkflowActivity<TInput, TOutput>} fn - The instance of the WorkflowActivity class being registered.
   * @returns {WorkflowRuntime} The current instance of WorkflowRuntime.
   */
  public registerActivityWithName(name: string, fn: TWorkflowActivity<TInput, TOutput>): WorkflowRuntime {
    const activityWrapper = (ctx: ActivityContext, intput: TInput): any => {
      const wfActivityContext = new WorkflowActivityContext(ctx);
      return fn(wfActivityContext, intput);
    };

    this.worker.addNamedActivity(name, activityWrapper);
    return this;
  }

  /**
   * Start the Workflow runtime processing items and block.
   */
  public async start() {
    await this.worker.start();
  }

  /**
   * Stop the worker and wait for any pending work items to complete
   */
  public async stop() {
    await this.worker.stop();
  }
}
