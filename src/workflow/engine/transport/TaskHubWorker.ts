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

import { createClient, type Client, type Interceptor } from "@connectrpc/connect";
import { createGrpcTransport } from "@connectrpc/connect-node";
import { create } from "@bufbuild/protobuf";
import { EmptySchema } from "@bufbuild/protobuf/wkt";
import { ConnectError } from "@connectrpc/connect";
import {
  TaskHubSidecarService,
  GetWorkItemsRequestSchema,
  type WorkItem,
  type WorkflowRequest,
  type ActivityRequest,
  type WorkflowResponse,
  type ActivityResponse,
  WorkflowResponseSchema,
  ActivityResponseSchema,
} from "../../../proto/dapr/proto/durabletask/v1/orchestrator_service_pb";
import { OrchestrationStatus } from "../../../proto/dapr/proto/durabletask/v1/orchestration_pb";
import { Registry } from "../worker/Registry";
import { OrchestrationExecutor } from "../worker/OrchestrationExecutor";
import { ActivityExecutor } from "../worker/ActivityExecutor";
import { newCompleteWorkflowAction, newFailureDetails } from "../worker/protoHelpers";
import { Logger } from "../../../logger/Logger";
import { type GrpcChannelOptions, mapGrpcOptions } from "../../../types/workflow/WorkflowClientOption";

export class TaskHubWorker {
  private readonly logger = new Logger("Workflow", "TaskHubWorker");
  private readonly client: Client<typeof TaskHubSidecarService>;
  private readonly _registry: Registry;

  private _isRunning = false;
  private _stopWorker = false;
  private _activeWorkItems = 0;
  private _workItemStreamController?: AbortController;

  constructor(
    hostAddress: string,
    daprApiToken?: string,
    useTLS = false,
    maxMessageSize = 128 * 1024 * 1024,
    grpcOptions?: GrpcChannelOptions,
  ) {
    this._registry = new Registry();

    const interceptors: Interceptor[] = [...(grpcOptions?.interceptors ?? [])];
    if (daprApiToken) {
      interceptors.push((next) => async (req) => {
        if (!req.header.has("dapr-api-token")) {
          req.header.set("dapr-api-token", daprApiToken);
        }
        return await next(req);
      });
    }

    const baseUrl = `${useTLS ? "https" : "http"}://${hostAddress}`;
    const mapped = mapGrpcOptions(grpcOptions);
    const transport = createGrpcTransport({
      baseUrl,
      interceptors,
      readMaxBytes: mapped.readMaxBytes ?? maxMessageSize,
      writeMaxBytes: mapped.writeMaxBytes ?? maxMessageSize,
    });

    this.client = createClient(TaskHubSidecarService, transport);
  }

  get registry(): Registry {
    return this._registry;
  }

  async start(): Promise<void> {
    if (this._isRunning) {
      throw new Error("The worker is already running.");
    }

    this._isRunning = true;
    this._stopWorker = false;

    this.internalRunWorker().catch((err) => {
      this.logger.error("Worker failed:", err);
      this._isRunning = false;
    });
  }

  private async internalRunWorker(): Promise<void> {
    const BASE_DELAY_MS = 1000;
    const MAX_DELAY_MS = 30000;
    let retryCount = 0;
    let isFirstAttempt = true;

    while (!this._stopWorker) {
      try {
        await this.client.hello(create(EmptySchema));

        this.logger.info("Connected to sidecar. Waiting for work items...");

        const streamController = new AbortController();
        this._workItemStreamController = streamController;
        const stream = this.client.getWorkItems(create(GetWorkItemsRequestSchema), {
          signal: streamController.signal,
        });
        retryCount = 0;

        try {
          for await (const workItem of stream) {
            if (this._stopWorker) break;
            // Concurrency is admitted by the Dapr runtime (workflow.maxConcurrent*Invocations), so every
            // work item is dispatched as it arrives. A work item that is not executed stays registered
            // as in flight on this stream, stalling its workflow until the stream reconnects.
            this.dispatchWorkItem(workItem);
          }
        } finally {
          if (this._workItemStreamController === streamController) {
            this._workItemStreamController = undefined;
          }
        }

        if (this._stopWorker) {
          this.logger.info("Stream ended");
          return;
        }

        this.logger.warn("Stream abruptly closed, will retry the connection...");
      } catch (err: unknown) {
        if (this._stopWorker) return;

        const errorMsg = err instanceof ConnectError ? err.message : String(err);
        this.logger.error(`Error on grpc stream: ${errorMsg}`);

        if (isFirstAttempt) {
          throw err;
        }
        this.logger.info("Connection will be retried...");
      }

      isFirstAttempt = false;

      const delay = Math.min(BASE_DELAY_MS * Math.pow(2, retryCount), MAX_DELAY_MS);
      const jitter = delay * 0.5 * Math.random();
      await sleep(delay + jitter);
      retryCount++;
    }
  }

  private dispatchWorkItem(workItem: WorkItem): void {
    const requestType = workItem.request;
    if (!requestType) {
      this.logger.warn("Received work item with no request");
      return;
    }

    if (requestType.case === "workflowRequest") {
      const req = requestType.value;
      this.logger.info(`Received "Orchestrator Request" work item with instance id '${req.instanceId}'`);
      this.trackWorkItem(this.executeOrchestrator(req, workItem.completionToken));
    } else if (requestType.case === "activityRequest") {
      this.logger.info(`Received "Activity Request" work item`);
      this.trackWorkItem(this.executeActivity(requestType.value, workItem.completionToken));
    } else {
      this.logger.warn(`Received unknown work item type`);
    }
  }

  private trackWorkItem(workPromise: Promise<void>): void {
    this._activeWorkItems++;
    workPromise
      .catch((err) => {
        this.logger.error("Unhandled error in work item execution:", err);
      })
      .finally(() => {
        this._activeWorkItems--;
      });
  }

  private async executeOrchestrator(req: WorkflowRequest, completionToken: string): Promise<void> {
    const instanceId = req.instanceId;

    if (!instanceId) {
      throw new Error(`Could not execute the orchestrator as the instanceId was not provided`);
    }

    let res: WorkflowResponse;

    try {
      const executor = new OrchestrationExecutor(this._registry);
      const result = await executor.execute(instanceId, req.pastEvents, req.newEvents);

      res = create(WorkflowResponseSchema, {
        instanceId,
        actions: result.actions,
        customStatus: result.customStatus != null ? JSON.stringify(result.customStatus) : undefined,
        completionToken,
      });
    } catch (e: unknown) {
      this.logger.error(`An error occurred while trying to execute instance '${instanceId}': ${(e as Error).message}`);

      const action = newCompleteWorkflowAction(
        -1,
        OrchestrationStatus.FAILED,
        undefined,
        newFailureDetails(e as Error),
      );

      res = create(WorkflowResponseSchema, {
        instanceId,
        actions: [action],
        completionToken,
      });
    }

    try {
      // CompleteWorkflowTask only exists in Dapr >= 1.18; older runtimes route unknown
      // methods to the service-invocation proxy. CompleteOrchestratorTask works on all.
      await this.client.completeOrchestratorTask(res);
    } catch (e: unknown) {
      this.logger.error(
        `An error occurred while trying to complete instance '${instanceId}': ${(e as Error)?.message}`,
      );
    }
  }

  private async executeActivity(req: ActivityRequest, completionToken: string): Promise<void> {
    const instanceId = req.workflowInstance?.instanceId;

    if (!instanceId) {
      throw new Error("Activity request does not contain an orchestration instance id");
    }

    let res: ActivityResponse;

    try {
      const executor = new ActivityExecutor(this._registry);
      const result = await executor.execute(instanceId, req.name, req.taskId, req.input);

      res = create(ActivityResponseSchema, {
        instanceId,
        taskId: req.taskId,
        result: result ?? undefined,
        completionToken,
      });
    } catch (e: unknown) {
      this.logger.error(`An error occurred while trying to execute activity '${req.name}': ${(e as Error).message}`);

      res = create(ActivityResponseSchema, {
        instanceId,
        taskId: req.taskId,
        failureDetails: newFailureDetails(e as Error),
        completionToken,
      });
    }

    try {
      await this.client.completeActivityTask(res);
    } catch (e: unknown) {
      this.logger.error(
        `Failed to deliver activity response for '${req.name}#${req.taskId}' of orchestration ID '${instanceId}': ${(e as Error)?.message}`,
      );
    }
  }

  async stop(): Promise<void> {
    if (!this._isRunning) {
      throw new Error("The worker is not running.");
    }

    this._stopWorker = true;
    this._workItemStreamController?.abort();

    const drainTimeoutMs = 30000;
    const drainPollIntervalMs = 100;
    const drainStart = Date.now();
    while (this._activeWorkItems > 0 && Date.now() - drainStart < drainTimeoutMs) {
      this.logger.debug(`Waiting for ${this._activeWorkItems} active work item(s) to complete before shutdown...`);
      await sleep(drainPollIntervalMs);
    }

    if (this._activeWorkItems > 0) {
      this.logger.warn(
        `Shutdown timeout reached with ${this._activeWorkItems} work item(s) still active. Proceeding with shutdown.`,
      );
    }

    this._isRunning = false;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
