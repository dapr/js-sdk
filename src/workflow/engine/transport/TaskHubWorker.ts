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
import { Code, ConnectError } from "@connectrpc/connect";
import { Dapr } from "../../../proto/dapr/proto/runtime/v1/dapr_pb";
import { GetMetadataRequestSchema } from "../../../proto/dapr/proto/runtime/v1/metadata_pb";
import { context } from "@opentelemetry/api";
import {
  TaskHubSidecarService,
  GetWorkItemsRequestSchema,
  WorkerCapability,
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
import { newCompleteWorkflowAction, newFailureDetails, toError } from "../worker/protoHelpers";
import { Logger } from "../../../logger/Logger";
import { IDaprSerializer } from "../../../serialization/IDaprSerializer";
import { type GrpcChannelOptions, mapGrpcOptions } from "../../../types/workflow/WorkflowClientOption";
import type { BinaryStoreWorkflowPayloadResolver } from "../../payloads/BinaryStoreWorkflowPayloadResolver";
import { getOrchestrationTraceContext, runWithActivityTrace } from "../worker/WorkflowTrace";
import { TransientWorkItemError, isRetryableRpcError } from "../worker/TransientWorkItemError";

const COMPLETION_TIMEOUT_MS = 30_000;
const COMPLETION_MAX_ATTEMPTS = 3;
const COMPLETION_RETRY_BASE_MS = 500;
const DRAIN_TIMEOUT_MS = 30_000;

/** Stream rejections that no amount of reconnecting will fix. */
function isDefinitiveStreamError(error: unknown): boolean {
  return (
    error instanceof ConnectError &&
    (error.code === Code.Unimplemented || error.code === Code.Unauthenticated || error.code === Code.PermissionDenied)
  );
}

export class TaskHubWorker {
  private readonly logger = new Logger("Workflow", "TaskHubWorker");
  private readonly client: Client<typeof TaskHubSidecarService>;
  private readonly metadataClient: Client<typeof Dapr>;
  private _patchSupport?: Promise<boolean>;
  private readonly _registry: Registry;

  private _isRunning = false;
  private _isReady = false;
  private _runController?: AbortController;
  private _stopPromise?: Promise<void>;
  private _activeWorkItems = 0;
  private _idleWaiters: Array<() => void> = [];
  private _activeActivities = 0;
  // Unlimited unless configured; the Dapr runtime admits work items
  // (workflow.maxConcurrentActivityInvocations). Bounds activities only. Workflow
  // work items are always dispatched: an activity may wait on another workflow's
  // progress (scheduleNewWorkflow returns once the new workflow has started),
  // which needs a workflow work item to run on this worker.
  private readonly _maxConcurrentActivities: number;
  // ponytail: unbounded on purpose; a queued item must never be dropped, as the
  // sidecar keeps it in flight on this stream and its workflow stalls until reconnect.
  private readonly _activityQueue: WorkItem[] = [];
  private _workItemStreamController?: AbortController;
  private _resolveReady?: () => void;
  private _rejectReady?: (error: unknown) => void;

  constructor(
    hostAddress: string,
    daprApiToken?: string,
    useTLS = false,
    maxMessageSize = 128 * 1024 * 1024,
    grpcOptions?: GrpcChannelOptions,
    private readonly serializer?: IDaprSerializer,
    private readonly payloads?: BinaryStoreWorkflowPayloadResolver,
    maxConcurrentActivities?: number,
  ) {
    if (maxConcurrentActivities !== undefined && !(maxConcurrentActivities >= 1)) {
      throw new Error(`maxConcurrentActivities must be a positive number, got ${maxConcurrentActivities}`);
    }
    this._registry = new Registry();
    this._maxConcurrentActivities = maxConcurrentActivities ?? Infinity;

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
    this.metadataClient = createClient(Dapr, transport);
  }

  get registry(): Registry {
    return this._registry;
  }

  get isReady(): boolean {
    return this._isReady;
  }

  async start(): Promise<void> {
    if (this._isRunning) {
      throw new Error("The worker is already running.");
    }

    this._isRunning = true;
    this._isReady = false;
    this._patchSupport = undefined;
    const runController = new AbortController();
    this._runController = runController;

    const ready = new Promise<void>((resolve, reject) => {
      this._resolveReady = resolve;
      this._rejectReady = reject;
    });

    this.internalRunWorker(runController.signal).catch((err) => {
      if (runController.signal.aborted) return;
      this.logger.error("Worker failed:", err);
      this._isRunning = false;
      this._isReady = false;
      this._rejectReady?.(err);
      this._resolveReady = undefined;
      this._rejectReady = undefined;
    });

    await ready;
  }

  private async internalRunWorker(signal: AbortSignal): Promise<void> {
    const BASE_DELAY_MS = 1000;
    const MAX_DELAY_MS = 30000;
    let retryCount = 0;
    let isFirstAttempt = true;

    while (!signal.aborted) {
      // Readiness is only confirmed once the sidecar has sent something on the stream.
      let streamYielded = false;
      try {
        await this.client.hello(create(EmptySchema), { signal });
        if (signal.aborted) return;
        // Only an unreachable sidecar on startup is fatal. Once connected,
        // stream errors (a sidecar restart) must be retried.
        isFirstAttempt = false;

        this.logger.info("Connected to sidecar. Waiting for work items...");

        const streamController = new AbortController();
        this._workItemStreamController = streamController;
        const stream = this.client.getWorkItems(
          create(GetWorkItemsRequestSchema, { capabilities: [WorkerCapability.HEALTH_PING] }),
          { signal: streamController.signal },
        );
        this.markReady();

        try {
          for await (const workItem of stream) {
            if (signal.aborted || streamController.signal.aborted) break;
            if (!streamYielded) {
              streamYielded = true;
              // Only a stream that actually delivers messages resets the backoff; otherwise a sidecar that
              // accepts and immediately drops the stream would be hammered in a tight loop.
              retryCount = 0;
            }
            // Health pings only keep the stream alive through idle proxies; they carry no work.
            if (workItem.request.case === "healthPing") continue;

            // Workflow work items are dispatched as they arrive. Activities above the cap are
            // queued, never dropped: a work item that is not executed stays registered as in
            // flight on this stream, stalling its workflow until the stream reconnects.
            if (
              workItem.request.case === "activityRequest" &&
              this._activeActivities >= this._maxConcurrentActivities
            ) {
              this._activityQueue.push(workItem);
              this.logger.debug(`Queued activity work item (${this._activityQueue.length} queued)`);
              continue;
            }

            this.dispatchWorkItem(workItem, streamController);
          }
        } finally {
          if (this._workItemStreamController === streamController) {
            // Queued items belonged to this stream; the sidecar re-delivers them on the next one.
            this._activityQueue.length = 0;
            this._isReady = false;
            this._workItemStreamController = undefined;
          }
        }

        if (signal.aborted) {
          this.logger.info("Stream ended");
          return;
        }

        this.logger.warn("Stream abruptly closed, will retry the connection...");
      } catch (err: unknown) {
        if (signal.aborted) return;

        const errorMsg = err instanceof ConnectError ? err.message : String(err);
        this.logger.error(`Error on grpc stream: ${errorMsg}`);

        if (isFirstAttempt || (!streamYielded && isDefinitiveStreamError(err))) {
          // Retrying cannot fix a rejected stream (wrong token, missing API); surface it instead of spinning.
          throw err;
        }
        this.logger.info("Connection will be retried...");
      }

      const delay = Math.min(BASE_DELAY_MS * Math.pow(2, retryCount), MAX_DELAY_MS);
      const jitter = delay * 0.5 * Math.random();
      await sleep(delay + jitter, signal);
      retryCount++;
    }
  }

  private dispatchWorkItem(workItem: WorkItem, streamController: AbortController): void {
    const requestType = workItem.request;
    if (!requestType) {
      this.logger.warn("Received work item with no request");
      return;
    }

    if (requestType.case === "workflowRequest") {
      const req = requestType.value;
      this.logger.info(`Received "Orchestrator Request" work item with instance id '${req.instanceId}'`);
      this.trackWorkItem(this.executeOrchestrator(req, workItem.completionToken), streamController, false);
    } else if (requestType.case === "activityRequest") {
      this.logger.info(`Received "Activity Request" work item`);
      this.trackWorkItem(this.executeActivity(requestType.value, workItem.completionToken), streamController, true);
    } else {
      this.logger.warn(`Received unknown work item type`);
    }
  }

  private trackWorkItem(workPromise: Promise<void>, streamController: AbortController, activity: boolean): void {
    this._activeWorkItems++;
    if (activity) {
      this._activeActivities++;
    }
    workPromise
      .catch((err) => {
        this.logger.error("Unhandled error in work item execution:", err);
        // Release unacknowledged work for redelivery, but never abort a newer stream.
        if (this._workItemStreamController === streamController) {
          this._isReady = false;
        }
        streamController.abort();
      })
      .finally(() => {
        this._activeWorkItems--;
        if (activity) {
          this._activeActivities--;
        }
        this.drainQueue();
        if (this._activeWorkItems === 0) {
          const waiters = this._idleWaiters;
          this._idleWaiters = [];
          for (const notify of waiters) notify();
        }
      });
  }

  private drainQueue(): void {
    const streamController = this._workItemStreamController;
    // Shutdown and failed streams leave queued items to the sidecar to re-deliver.
    if (this._runController?.signal.aborted || !streamController || streamController.signal.aborted) return;
    while (this._activeActivities < this._maxConcurrentActivities) {
      const queued = this._activityQueue.shift();
      if (!queued) return;
      this.dispatchWorkItem(queued, streamController);
    }
  }

  private whenIdle(): Promise<void> {
    if (this._activeWorkItems === 0) return Promise.resolve();
    return new Promise((resolve) => this._idleWaiters.push(resolve));
  }

  /**
   * Delivers a completion to the sidecar. Transient failures are retried a few times; a failure the sidecar
   * will reproduce (e.g. an unknown instance) is logged and dropped so one bad completion cannot tear down
   * the shared work-item stream. Retryable failures that exhaust the budget propagate and abort the stream.
   */
  private async completeWithRetry(describe: string, send: (timeoutMs: number) => Promise<unknown>): Promise<void> {
    const signal = this._runController?.signal;
    for (let attempt = 1; ; attempt++) {
      try {
        await send(COMPLETION_TIMEOUT_MS);
        return;
      } catch (e: unknown) {
        const error = toError(e);
        if (!isRetryableRpcError(e)) {
          this.logger.error(`Sidecar rejected ${describe}; dropping the completion: ${error.message}`);
          return;
        }
        if (attempt >= COMPLETION_MAX_ATTEMPTS || signal?.aborted) {
          this.logger.error(`Failed to deliver ${describe} after ${attempt} attempt(s): ${error.message}`);
          throw e;
        }
        this.logger.warn(`Retrying ${describe} (attempt ${attempt} failed): ${error.message}`);
        await sleep(COMPLETION_RETRY_BASE_MS * attempt, signal);
      }
    }
  }

  private supportsWorkflowPatches(): Promise<boolean> {
    this._patchSupport ??= this.metadataClient
      .getMetadata(create(GetMetadataRequestSchema), { timeoutMs: 10000 })
      .then((metadata) => {
        // A daprd built without a release version reports "edge"; it is built from the latest source.
        const edge = metadata.runtimeVersion.trim().toLowerCase() === "edge";
        const version = /^v?(\d+)\.(\d+)(?:\.|$|-)/.exec(metadata.runtimeVersion);
        const supported =
          edge ||
          (version !== null && (Number(version[1]) > 1 || (Number(version[1]) === 1 && Number(version[2]) >= 17)));
        if (!supported) {
          this.logger.warn(
            `Dapr runtime '${metadata.runtimeVersion}' does not support durable workflow patches; retaining legacy clock and GUID behavior.`,
          );
        }
        return supported;
      })
      .catch((error: unknown) => {
        if (
          error instanceof ConnectError &&
          (error.code === Code.Unimplemented || error.code === Code.PermissionDenied)
        ) {
          this.logger.warn(
            `Cannot determine workflow patch support: ${error.message}; retaining legacy clock and GUID behavior.`,
          );
          return false;
        }
        this._patchSupport = undefined;
        throw error;
      });
    return this._patchSupport;
  }

  private async executeOrchestrator(req: WorkflowRequest, completionToken: string): Promise<void> {
    const instanceId = req.instanceId;

    if (!instanceId) {
      // Nothing can be completed or redelivered without an instance; aborting the stream would not help.
      this.logger.warn("Ignoring orchestrator work item without an instanceId");
      return;
    }

    // Only a new generation needs runtime capability discovery; committed histories select their own semantics.
    // A transient discovery failure propagates so the work item is redelivered rather than failed.
    const supportsPatches =
      req.pastEvents.length === 0 && req.newEvents.some((event) => event.eventType.case === "workflowStarted")
        ? await this.supportsWorkflowPatches()
        : true;
    let res: WorkflowResponse;

    try {
      const executor = new OrchestrationExecutor(this._registry, this.serializer, this.payloads, supportsPatches);
      // Restore context without emitting a span for every replayed workflow turn.
      const result = await context.with(getOrchestrationTraceContext([...req.pastEvents, ...req.newEvents]), () =>
        executor.execute(instanceId, req.pastEvents, req.newEvents, req.router, req.propagatedHistory),
      );

      res = create(WorkflowResponseSchema, {
        instanceId,
        actions: result.actions,
        version: result.version,
        customStatus: result.encodedCustomStatus,
        completionToken,
      });
    } catch (e: unknown) {
      if (e instanceof TransientWorkItemError) {
        // Leave the work item unacknowledged so the runtime redelivers it once the infrastructure recovers.
        throw e;
      }
      const error = toError(e);
      this.logger.error(`An error occurred while trying to execute instance '${instanceId}': ${error.message}`);

      const action = newCompleteWorkflowAction(-1, OrchestrationStatus.FAILED, undefined, newFailureDetails(error));

      res = create(WorkflowResponseSchema, {
        instanceId,
        actions: [action],
        completionToken,
      });
    }

    // CompleteWorkflowTask only exists in Dapr >= 1.18; older runtimes route unknown
    // methods to the service-invocation proxy. CompleteOrchestratorTask works on all.
    await this.completeWithRetry(`completion of instance '${instanceId}'`, (timeoutMs) =>
      this.client.completeOrchestratorTask(res, { timeoutMs }),
    );
  }

  private async executeActivity(req: ActivityRequest, completionToken: string): Promise<void> {
    const instanceId = req.workflowInstance?.instanceId;

    if (!instanceId) {
      this.logger.warn(`Ignoring activity work item '${req.name}' without an orchestration instance id`);
      return;
    }

    let res: ActivityResponse;

    try {
      const executor = new ActivityExecutor(this._registry, this.serializer, this.payloads);
      const result = await runWithActivityTrace(req.name, req.parentTraceContext, () =>
        executor.execute(instanceId, req.name, req.taskId, req.input, req.propagatedHistory, req.taskExecutionId),
      );

      res = create(ActivityResponseSchema, {
        instanceId,
        taskId: req.taskId,
        result: result ?? undefined,
        completionToken,
      });
    } catch (e: unknown) {
      const error = toError(e);
      this.logger.error(`An error occurred while trying to execute activity '${req.name}': ${error.message}`);

      res = create(ActivityResponseSchema, {
        instanceId,
        taskId: req.taskId,
        failureDetails: newFailureDetails(error),
        completionToken,
      });
    }

    await this.completeWithRetry(
      `activity response for '${req.name}#${req.taskId}' of orchestration ID '${instanceId}'`,
      (timeoutMs) => this.client.completeActivityTask(res, { timeoutMs }),
    );
  }

  async stop(): Promise<void> {
    if (!this._isRunning) {
      return;
    }

    if (!this._stopPromise) {
      this._stopPromise = this.stopInternal().finally(() => {
        this._isRunning = false;
        this._stopPromise = undefined;
      });
    }
    await this._stopPromise;
  }

  private async stopInternal(): Promise<void> {
    this._runController?.abort();
    this._isReady = false;
    this._rejectReady?.(new Error("The worker stopped before becoming ready."));
    this._resolveReady = undefined;
    this._rejectReady = undefined;
    this._workItemStreamController?.abort();

    if (this._activeWorkItems > 0) {
      this.logger.debug(`Waiting for ${this._activeWorkItems} active work item(s) to complete before shutdown...`);
      const drainTimeout = new AbortController();
      await Promise.race([this.whenIdle(), sleep(DRAIN_TIMEOUT_MS, drainTimeout.signal)]);
      drainTimeout.abort();
    }

    if (this._activeWorkItems > 0) {
      this.logger.warn(
        `Shutdown timeout reached with ${this._activeWorkItems} work item(s) still active. Proceeding with shutdown.`,
      );
    }
  }

  private markReady(): void {
    this._isReady = true;
    this._resolveReady?.();
    this._resolveReady = undefined;
    this._rejectReady = undefined;
  }
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve();
      return;
    }
    const finish = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", finish);
      resolve();
    };
    const timer = setTimeout(finish, ms);
    signal?.addEventListener("abort", finish, { once: true });
  });
}
