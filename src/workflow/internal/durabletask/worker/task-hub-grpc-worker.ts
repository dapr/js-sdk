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

import * as pb from "../proto/orchestrator_service_pb";
import * as stubs from "../proto/orchestrator_service_grpc_pb";
import * as grpc from "@grpc/grpc-js";
import { Registry } from "./registry";
import { TActivity } from "../types/activity.type";
import { TInput } from "../types/input.type";
import { TOrchestrator } from "../types/orchestrator.type";
import { TOutput } from "../types/output.type";
import { GrpcClient } from "../client/client-grpc";
import { promisify } from "util";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import * as pbh from "../utils/pb-helper.util";
import { OrchestrationExecutor } from "./orchestration-executor";
import { ActivityExecutor } from "./activity-executor";
import { StringValue } from "google-protobuf/google/protobuf/wrappers_pb";
import { Logger } from "../../../../logger/Logger";

export class TaskHubGrpcWorker {
  private _responseStream: grpc.ClientReadableStream<pb.WorkItem> | null;
  private _registry: Registry;
  private _hostAddress?: string;
  private _tls?: boolean;
  private _grpcChannelOptions?: grpc.ChannelOptions;
  private _isRunning: boolean;
  private _stopWorker: boolean;
  private _stub: stubs.TaskHubSidecarServiceClient | null;
  private _activeWorkItems: number;
  private _maxConcurrentWorkItems: number;
  private _workItemQueue: Array<{ workItem: pb.WorkItem; stub: stubs.TaskHubSidecarServiceClient }>;
  private readonly _maxQueueSize: number;
  private readonly logger: Logger;

  constructor(hostAddress?: string, options?: grpc.ChannelOptions, useTLS?: boolean) {
    this._registry = new Registry();
    this._hostAddress = hostAddress;
    this._tls = useTLS;
    this._grpcChannelOptions = options;
    this._responseStream = null;
    this._isRunning = false;
    this._stopWorker = false;
    this._stub = null;
    this._activeWorkItems = 0;
    this._maxConcurrentWorkItems = 10;
    this._workItemQueue = [];
    this._maxQueueSize = 100;
    this.logger = new Logger("DurableTask", "Worker");
  }

  /**
   * Registers an orchestrator function with the worker.
   *
   * @param fn
   * @returns
   */
  addOrchestrator(fn: TOrchestrator): string {
    if (this._isRunning) {
      throw new Error("Cannot add orchestrator while worker is running.");
    }

    return this._registry.addOrchestrator(fn);
  }

  /**
   * Registers an named orchestrator function with the worker.
   *
   * @param fn
   * @returns
   */
  addNamedOrchestrator(name: string, fn: TOrchestrator): string {
    if (this._isRunning) {
      throw new Error("Cannot add orchestrator while worker is running.");
    }

    this._registry.addNamedOrchestrator(name, fn);
    return name;
  }

  /**
   * Registers an activity function with the worker.
   *
   * @param fn
   * @returns
   */
  addActivity(fn: TActivity<TInput, TOutput>): string {
    if (this._isRunning) {
      throw new Error("Cannot add activity while worker is running.");
    }

    return this._registry.addActivity(fn);
  }

  /**
   * Registers an named activity function with the worker.
   *
   * @param fn
   * @returns
   */
  addNamedActivity(name: string, fn: TActivity<TInput, TOutput>): string {
    if (this._isRunning) {
      throw new Error("Cannot add activity while worker is running.");
    }

    this._registry.addNamedActivity(name, fn);
    return name;
  }

  /**
   * In node.js we don't require a new thread as we have a main event loop
   * Therefore, we open the stream and simply listen through the eventemitter behind the scenes
   */
  async start(): Promise<void> {
    if (this._isRunning) {
      throw new Error("The worker is already running.");
    }

    const client = new GrpcClient(this._hostAddress, this._grpcChannelOptions, this._tls);
    this._stub = client.stub;

    // do not await so it runs in the background
    this.internalRunWorker(client).catch((err) => {
      this.logger.error("Worker failed:", err);
      this._isRunning = false;
    });

    this._isRunning = true;
  }

  async internalRunWorker(client: GrpcClient): Promise<void> {
    const BASE_DELAY_MS = 1000;
    const MAX_DELAY_MS = 30000;
    let retryCount = 0;
    let isFirstAttempt = true;

    while (!this._stopWorker) {
      try {
        // send a "Hello" message to the sidecar to ensure that it's listening
        const prom = promisify(client.stub.hello.bind(client.stub));
        await prom(new Empty());

        // Stream work items from the sidecar
        const stream = client.stub.getWorkItems(new pb.GetWorkItemsRequest());
        this._responseStream = stream;
        retryCount = 0; // Reset on successful connection

        this.logger.info(`Successfully connected to ${this._hostAddress}. Waiting for work items...`);

        // Wait for the stream to end using a promise
        await new Promise<void>((resolve, reject) => {
          stream.on("data", (workItem: pb.WorkItem) => {
            if (this._activeWorkItems >= this._maxConcurrentWorkItems) {
              if (this._workItemQueue.length < this._maxQueueSize) {
                this._workItemQueue.push({ workItem, stub: client.stub });
                this.logger.debug(
                  `Queued work item (${this._workItemQueue.length} queued)`,
                );
              } else {
                this.logger.warn(
                  `Work item queue full (${this._maxQueueSize}), dropping work item`,
                );
              }
              return;
            }

            this._dispatchWorkItem(workItem, client.stub);
          });

          stream.on("end", () => {
            stream.removeAllListeners();
            stream.cancel();
            stream.destroy();
            resolve();
          });

          stream.on("error", (err: Error) => {
            stream.removeAllListeners();
            stream.cancel();
            stream.destroy();
            reject(err);
          });
        });

        if (this._stopWorker) {
          this.logger.info("Stream ended");
          return;
        }

        this.logger.warn("Stream abruptly closed, will retry the connection...");
      } catch (err) {
        if (this._stopWorker) {
          return;
        }
        this.logger.error(`Error on grpc stream: ${err}`);
        if (isFirstAttempt) {
          throw err;
        }
        this.logger.info("Connection will be retried...");
      }

      isFirstAttempt = false;

      // Exponential backoff with jitter
      const delay = Math.min(BASE_DELAY_MS * Math.pow(2, retryCount), MAX_DELAY_MS);
      const jitter = delay * 0.5 * Math.random();
      await sleep(delay + jitter);
      retryCount++;
    }
  }

  private _dispatchWorkItem(workItem: pb.WorkItem, stub: stubs.TaskHubSidecarServiceClient): void {
    if (workItem.hasOrchestratorrequest()) {
      this.logger.info(
        `Received "Orchestrator Request" work item with instance id '${workItem
          ?.getOrchestratorrequest()
          ?.getInstanceid()}'`,
      );
      this._trackWorkItem(
        this._executeOrchestrator(workItem.getOrchestratorrequest() as any, stub),
        stub,
      );
    } else if (workItem.hasActivityrequest()) {
      this.logger.info(`Received "Activity Request" work item`);
      this._trackWorkItem(
        this._executeActivity(workItem.getActivityrequest() as any, stub),
        stub,
      );
    } else {
      this.logger.warn(`Received unknown work item`);
    }
  }

  private _trackWorkItem(workPromise: Promise<void>, stub: stubs.TaskHubSidecarServiceClient): void {
    this._activeWorkItems++;
    workPromise
      .catch((err) => {
        this.logger.error("Unhandled error in work item execution:", err);
      })
      .finally(() => {
        this._activeWorkItems--;
        this._drainQueue(stub);
      });
  }

  private _drainQueue(stub: stubs.TaskHubSidecarServiceClient): void {
    while (this._workItemQueue.length > 0 && this._activeWorkItems < this._maxConcurrentWorkItems) {
      const queued = this._workItemQueue.shift()!;
      this._dispatchWorkItem(queued.workItem, queued.stub);
    }
  }

  /**
   * Stop the worker and wait for any pending work items to complete
   */
  async stop(): Promise<void> {
    if (!this._isRunning) {
      throw new Error("The worker is not running.");
    }

    this._stopWorker = true;

    this._responseStream?.cancel();
    this._responseStream?.destroy();

    // Wait for in-flight work items to drain before closing the stub
    const drainTimeoutMs = 30000;
    const drainPollIntervalMs = 100;
    const drainStart = Date.now();
    while (this._activeWorkItems > 0 && Date.now() - drainStart < drainTimeoutMs) {
      this.logger.info(
        `Waiting for ${this._activeWorkItems} active work item(s) to complete before shutdown...`,
      );
      await sleep(drainPollIntervalMs);
    }

    if (this._activeWorkItems > 0) {
      this.logger.warn(
        `Shutdown timeout reached with ${this._activeWorkItems} work item(s) still active. Proceeding with shutdown.`,
      );
    }

    this._stub?.close();

    this._isRunning = false;

    // Wait a bit to let the async operations finish
    // https://github.com/grpc/grpc-node/issues/1563#issuecomment-829483711
    await sleep(1000);
  }

  /**
   *
   */
  private async _executeOrchestrator(
    req: pb.OrchestratorRequest,
    stub: stubs.TaskHubSidecarServiceClient,
  ): Promise<void> {
    const instanceId = req.getInstanceid();

    if (!instanceId) {
      throw new Error(`Could not execute the orchestrator as the instanceId was not provided (${instanceId})`);
    }

    let res;

    try {
      const executor = new OrchestrationExecutor(this._registry);
      const result = await executor.execute(req.getInstanceid(), req.getPasteventsList(), req.getNeweventsList());

      res = new pb.OrchestratorResponse();
      res.setInstanceid(req.getInstanceid());
      res.setActionsList(result.actions);
      const cs = new StringValue();
      cs.setValue(result.customStatus);
      res.setCustomstatus(cs);
    } catch (e: any) {
      this.logger.error(`An error occurred while trying to execute instance '${req.getInstanceid()}': ${e.message}`, e);

      const failureDetails = pbh.newFailureDetails(e);

      const actions = [
        pbh.newCompleteOrchestrationAction(
          -1,
          pb.OrchestrationStatus.ORCHESTRATION_STATUS_FAILED,
          undefined,
          failureDetails,
        ),
      ];

      res = new pb.OrchestratorResponse();
      res.setInstanceid(req.getInstanceid());
      res.setActionsList(actions);
    }

    try {
      const stubCompleteOrchestratorTask = promisify(stub.completeOrchestratorTask.bind(stub));
      await stubCompleteOrchestratorTask(res);
    } catch (e: any) {
      this.logger.error(`An error occurred while trying to complete instance '${req.getInstanceid()}': ${e?.message}`);
    }
  }

  /**
   *
   */
  private async _executeActivity(req: pb.ActivityRequest, stub: stubs.TaskHubSidecarServiceClient): Promise<void> {
    const instanceId = req.getOrchestrationinstance()?.getInstanceid();

    if (!instanceId) {
      throw new Error("Activity request does not contain an orchestration instance id");
    }

    let res;

    try {
      const executor = new ActivityExecutor(this._registry);
      const result = await executor.execute(
        instanceId,
        req.getName(),
        req.getTaskid(),
        req.getInput()?.toString() ?? "",
      );

      const s = new StringValue();
      s.setValue(result?.toString() ?? "");

      res = new pb.ActivityResponse();
      res.setInstanceid(instanceId);
      res.setTaskid(req.getTaskid());
      res.setResult(s);
    } catch (e: any) {
      this.logger.error(`An error occurred while trying to execute activity '${req.getName()}': ${e.message}`, e);

      const failureDetails = pbh.newFailureDetails(e);

      res = new pb.ActivityResponse();
      res.setInstanceid(instanceId);
      res.setTaskid(req.getTaskid());
      res.setFailuredetails(failureDetails);
    }

    try {
      const stubCompleteActivityTask = promisify(stub.completeActivityTask.bind(stub));
      await stubCompleteActivityTask(res);
    } catch (e: any) {
      this.logger.error(
        `Failed to deliver activity response for '${req.getName()}#${req.getTaskid()}' of orchestration ID '${instanceId}' to sidecar: ${
          e?.message
        }`,
      );
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
