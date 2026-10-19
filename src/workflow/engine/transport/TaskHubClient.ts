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

import { Code, ConnectError, createClient, type CallOptions, type Client, type Interceptor } from "@connectrpc/connect";
import { createGrpcTransport } from "@connectrpc/connect-node";
import { create } from "@bufbuild/protobuf";
import { timestampFromDate } from "@bufbuild/protobuf/wkt";
import { randomUUID } from "crypto";
import {
  TaskHubSidecarService,
  CreateInstanceRequestSchema,
  GetInstanceRequestSchema,
  type GetInstanceResponse,
  PurgeInstancesRequestSchema,
  ListInstanceIDsRequestSchema,
  GetInstanceHistoryRequestSchema,
  type GetInstanceHistoryResponse,
  RerunWorkflowFromEventRequestSchema,
  RaiseEventRequestSchema,
  TerminateRequestSchema,
  SuspendRequestSchema,
  ResumeRequestSchema,
} from "../../../proto/dapr/proto/durabletask/v1/orchestrator_service_pb";
import type {
  OrchestrationStatus,
  TaskFailureDetails,
} from "../../../proto/dapr/proto/durabletask/v1/orchestration_pb";
import type { HistoryEvent } from "../../../proto/dapr/proto/durabletask/v1/history_events_pb";
import { OrchestrationStatus as OrchestrationStatusEnum } from "../../../proto/dapr/proto/durabletask/v1/orchestration_pb";
import { timestampToDate } from "../worker/protoHelpers";
import { Logger } from "../../../logger/Logger";
import { IDaprSerializer } from "../../../serialization/IDaprSerializer";
import { serializeWorkflowValue } from "../../../serialization/Serialization.util";
import { type GrpcChannelOptions, mapGrpcOptions } from "../../../types/workflow/WorkflowClientOption";
import type {
  RerunWorkflowFromEventOptions,
  WorkflowInstanceIdPage,
} from "../../../types/workflow/WorkflowManagement.types";

export class OrchestrationState {
  constructor(
    public instanceId: string,
    public name: string,
    public runtimeStatus: OrchestrationStatus,
    public createdAt: Date,
    public lastUpdatedAt: Date,
    public serializedInput?: string,
    public serializedOutput?: string,
    public serializedCustomStatus?: string,
    public failureDetails?: TaskFailureDetails,
  ) {}

  static fromGetInstanceResponse(instanceId: string, res: GetInstanceResponse): OrchestrationState | undefined {
    if (!res.exists) return undefined;

    const state = res.workflowState;
    if (!state) return undefined;

    let failureDetails: TaskFailureDetails | undefined;
    if (state.failureDetails) {
      failureDetails = state.failureDetails;
    }

    return new OrchestrationState(
      instanceId,
      state.name,
      state.workflowStatus,
      state.createdTimestamp ? timestampToDate(state.createdTimestamp) : new Date(),
      state.lastUpdatedTimestamp ? timestampToDate(state.lastUpdatedTimestamp) : new Date(),
      state.input,
      state.output,
      state.customStatus,
      failureDetails,
    );
  }
}

export class PurgeResult {
  constructor(public deletedInstanceCount: number) {}
}

export class TaskHubClient {
  private readonly logger = new Logger("Workflow", "TaskHubClient");
  private readonly client: Client<typeof TaskHubSidecarService>;

  constructor(
    hostAddress: string,
    daprApiToken?: string,
    useTLS = false,
    maxMessageSize = 128 * 1024 * 1024,
    grpcOptions?: GrpcChannelOptions,
    public readonly serializer?: IDaprSerializer,
  ) {
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

  async scheduleNewOrchestration(
    name: string,
    input?: unknown,
    instanceId?: string,
    startAt?: Date,
    signal?: AbortSignal,
  ): Promise<string> {
    const req = create(CreateInstanceRequestSchema, {
      name,
      instanceId: instanceId ?? randomUUID(),
    });

    if (input !== undefined) {
      req.input = serializeWorkflowValue(input, this.serializer);
    }

    if (startAt) {
      req.scheduledStartTimestamp = timestampFromDate(startAt);
    }

    this.logger.info(`Starting new ${name} instance with ID = ${req.instanceId}`);
    const res = await this.client.startInstance(req, this.callOptions(signal));
    return res.instanceId;
  }

  async getOrchestrationState(
    instanceId: string,
    fetchPayloads = true,
    signal?: AbortSignal,
  ): Promise<OrchestrationState | undefined> {
    const req = create(GetInstanceRequestSchema, {
      instanceId,
      getInputsAndOutputs: fetchPayloads,
    });

    const res = await this.client.getInstance(req, this.callOptions(signal));
    return OrchestrationState.fromGetInstanceResponse(instanceId, res);
  }

  async listWorkflowInstanceIds(continuationToken?: string, pageSize?: number): Promise<WorkflowInstanceIdPage> {
    const req = create(ListInstanceIDsRequestSchema, {
      continuationToken,
      pageSize,
    });
    const res = await this.client.listInstanceIDs(req);
    return {
      instanceIds: res.instanceIds,
      continuationToken: res.continuationToken,
    };
  }

  async getWorkflowHistory(instanceId: string): Promise<HistoryEvent[]> {
    const req = create(GetInstanceHistoryRequestSchema, { instanceId });
    const res: GetInstanceHistoryResponse = await this.client.getInstanceHistory(req);
    return res.events;
  }

  async rerunWorkflowFromEvent(
    sourceInstanceId: string,
    eventId: number,
    options: RerunWorkflowFromEventOptions = {},
  ): Promise<string> {
    const req = create(RerunWorkflowFromEventRequestSchema, {
      sourceInstanceID: sourceInstanceId,
      eventID: eventId,
      overwriteInput: options.overwriteInput ?? options.input !== undefined,
    });

    if (options.newInstanceId !== undefined) {
      req.newInstanceID = options.newInstanceId;
    }
    if (options.input !== undefined) {
      req.input = serializeWorkflowValue(options.input, this.serializer);
    }

    const res = await this.client.rerunWorkflowFromEvent(req);
    return res.newInstanceID;
  }

  async waitForOrchestrationStart(
    instanceId: string,
    fetchPayloads = false,
    timeoutSeconds = 60,
    signal?: AbortSignal,
  ): Promise<OrchestrationState | undefined> {
    const req = create(GetInstanceRequestSchema, {
      instanceId,
      getInputsAndOutputs: fetchPayloads,
    });

    try {
      const res = await this.client.waitForInstanceStart(req, this.callOptions(signal, timeoutSeconds));
      return OrchestrationState.fromGetInstanceResponse(instanceId, res);
    } catch (e) {
      this.logger.error(`Error waiting for instance ${instanceId} to start: ${(e as Error).message}`);
      throw e;
    }
  }

  async waitForOrchestrationCompletion(
    instanceId: string,
    fetchPayloads = true,
    timeoutSeconds = 60,
    signal?: AbortSignal,
  ): Promise<OrchestrationState | undefined> {
    const req = create(GetInstanceRequestSchema, {
      instanceId,
      getInputsAndOutputs: fetchPayloads,
    });

    this.logger.info(`Waiting ${timeoutSeconds} seconds for instance ${instanceId} to complete...`);

    try {
      const res = await this.client.waitForInstanceCompletion(req, this.callOptions(signal, timeoutSeconds));

      const state = OrchestrationState.fromGetInstanceResponse(instanceId, res);
      if (!state) return undefined;

      if (state.runtimeStatus === OrchestrationStatusEnum.FAILED && state.failureDetails) {
        this.logger.info(
          `Instance ${instanceId} failed: [${state.failureDetails.errorType}] ${state.failureDetails.errorMessage}`,
        );
      } else if (state.runtimeStatus === OrchestrationStatusEnum.TERMINATED) {
        this.logger.info(`Instance ${instanceId} was terminated`);
      } else if (state.runtimeStatus === OrchestrationStatusEnum.COMPLETED) {
        this.logger.info(`Instance ${instanceId} completed`);
      }

      return state;
    } catch (e) {
      this.logger.error(`Error waiting for instance ${instanceId} to complete: ${(e as Error).message}`);
      throw e;
    }
  }

  async raiseOrchestrationEvent(
    instanceId: string,
    eventName: string,
    data: unknown = null,
    signal?: AbortSignal,
  ): Promise<void> {
    const req = create(RaiseEventRequestSchema, {
      instanceId,
      name: eventName,
    });

    if (data !== undefined) {
      req.input = serializeWorkflowValue(data, this.serializer);
    }

    this.logger.info(`Raising event '${eventName}' for instance '${instanceId}'`);
    await this.client.raiseEvent(req, this.callOptions(signal));
  }

  async terminateOrchestration(instanceId: string, output: unknown = null, signal?: AbortSignal): Promise<void> {
    const req = create(TerminateRequestSchema, {
      instanceId,
      recursive: true,
    });

    if (output !== undefined) {
      req.output = serializeWorkflowValue(output, this.serializer);
    }

    this.logger.info(`Terminating '${instanceId}'`);
    await this.client.terminateInstance(req, this.callOptions(signal));
  }

  async suspendOrchestration(instanceId: string, reason?: string, signal?: AbortSignal): Promise<void> {
    const req = create(SuspendRequestSchema, {
      instanceId,
    });

    if (reason) {
      req.reason = reason;
    }

    this.logger.info(`Suspending '${instanceId}'`);
    await this.client.suspendInstance(req, this.callOptions(signal));
  }

  async resumeOrchestration(instanceId: string, reason?: string, signal?: AbortSignal): Promise<void> {
    const req = create(ResumeRequestSchema, {
      instanceId,
    });

    if (reason) {
      req.reason = reason;
    }

    this.logger.info(`Resuming '${instanceId}'`);
    await this.client.resumeInstance(req, this.callOptions(signal));
  }

  async purgeOrchestration(instanceId: string, signal?: AbortSignal): Promise<PurgeResult | undefined> {
    const req = create(PurgeInstancesRequestSchema, {
      request: {
        case: "instanceId",
        value: instanceId,
      },
      recursive: true,
    });

    this.logger.info(`Purging Instance '${instanceId}'`);
    const res = await this.client.purgeInstances(req, this.callOptions(signal));
    return new PurgeResult(res.deletedInstanceCount);
  }

  async stop(): Promise<void> {
    // ConnectRPC transport doesn't require explicit close
  }

  private callOptions(signal?: AbortSignal, timeoutSeconds?: number): CallOptions {
    if (signal?.aborted) {
      throw new ConnectError("Operation was canceled", Code.Canceled, undefined, undefined, signal.reason);
    }
    if (
      timeoutSeconds !== undefined &&
      (!Number.isFinite(timeoutSeconds) || timeoutSeconds <= 0 || timeoutSeconds * 1000 > 2_147_483_647)
    ) {
      throw new RangeError("timeoutSeconds must be greater than 0 and at most 2147483.647 seconds");
    }
    return { signal, timeoutMs: timeoutSeconds === undefined ? undefined : timeoutSeconds * 1000 };
  }
}
