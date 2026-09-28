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

import { TaskHubWorker } from "../engine/transport/TaskHubWorker";
import type { TWorkflow } from "../../types/workflow/Workflow.type";
import type { TWorkflowActivity } from "../../types/workflow/Activity.type";
import WorkflowActivityContext from "./WorkflowActivityContext";
import WorkflowContext from "./WorkflowContext";
import { generateEndpoint, getDaprApiToken, getFunctionName } from "../internal";
import type { WorkflowClientOptions } from "../../types/workflow/WorkflowClientOption";

export default class WorkflowRuntime {
  private readonly worker: TaskHubWorker;

  constructor(options: Partial<WorkflowClientOptions> = {}) {
    const grpcEndpoint = generateEndpoint(options);
    const daprApiToken = getDaprApiToken(options);
    this.worker = new TaskHubWorker(
      grpcEndpoint.endpoint,
      daprApiToken,
      grpcEndpoint.tls,
      128 * 1024 * 1024,
      options.grpcOptions,
    );
  }

  public registerWorkflow(workflow: TWorkflow): WorkflowRuntime {
    const name = getFunctionName(workflow);
    const workflowWrapper = (ctx: unknown, input: unknown) => {
      const workflowContext = new WorkflowContext(ctx as never);
      return workflow(workflowContext, input);
    };
    this.worker.registry.addNamedOrchestrator(name, workflowWrapper as never);
    return this;
  }

  public registerWorkflowByName(name: string, workflow: TWorkflow): WorkflowRuntime {
    const workflowWrapper = (ctx: unknown, input: unknown) => {
      const workflowContext = new WorkflowContext(ctx as never);
      return workflow(workflowContext, input);
    };
    this.worker.registry.addNamedOrchestrator(name, workflowWrapper as never);
    return this;
  }

  /**
   * Registers a Workflow implementation for handling orchestrations with a given name.
   * @deprecated Use {@link registerWorkflowByName} instead.
   * @param {string} name - The name or identifier for the registered Workflow.
   * @param {TWorkflow} workflow - The instance of the Workflow class being registered.
   */
  public registerWorkflowWithName(name: string, workflow: TWorkflow): WorkflowRuntime {
    return this.registerWorkflowByName(name, workflow);
  }

  public registerActivity<TInput, TOutput>(fn: TWorkflowActivity<TInput, TOutput>): WorkflowRuntime {
    const name = getFunctionName(fn as never);
    const activityWrapper = (ctx: unknown, input: unknown) => {
      const wfActivityContext = new WorkflowActivityContext(ctx as never);
      return fn(wfActivityContext, input as TInput);
    };
    this.worker.registry.addNamedActivity(name, activityWrapper as never);
    return this;
  }

  public registerActivityWithName<TInput, TOutput>(
    name: string,
    fn: TWorkflowActivity<TInput, TOutput>,
  ): WorkflowRuntime {
    const activityWrapper = (ctx: unknown, input: unknown) => {
      const wfActivityContext = new WorkflowActivityContext(ctx as never);
      return fn(wfActivityContext, input as TInput);
    };
    this.worker.registry.addNamedActivity(name, activityWrapper as never);
    return this;
  }

  public async start(): Promise<void> {
    await this.worker.start();
  }

  public async stop(): Promise<void> {
    await this.worker.stop();
  }
}
