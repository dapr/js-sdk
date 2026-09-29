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
import { timestampFromDate } from "@bufbuild/protobuf/wkt";
import { randomUUID } from "crypto";
import {
  TaskHubSidecarService,
  CreateInstanceRequestSchema,
  type CreateInstanceResponse,
  GetInstanceRequestSchema,
  type GetInstanceResponse,
  PurgeInstancesRequestSchema,
  type PurgeInstancesResponse,
  RaiseEventRequestSchema,
  TerminateRequestSchema,
  SuspendRequestSchema,
  ResumeRequestSchema,
} from "../../../proto/dapr/proto/durabletask/v1/orchestrator_service_pb";
import type {
  OrchestrationStatus,
  TaskFailureDetails,
} from "../../../proto/dapr/proto/durabletask/v1/orchestration_pb";
import { OrchestrationStatus as OrchestrationStatusEnum } from "../../../proto/dapr/proto/durabletask/v1/orchestration_pb";
import { timestampToDate } from "../worker/protoHelpers";
import { Logger } from "../../../logger/Logger";
import { type GrpcChannelOptions, mapGrpcOptions } from "../../../types/workflow/WorkflowClientOption";

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

  async scheduleNewOrchestration(name: string, input?: unknown, instanceId?: string, startAt?: Date): Promise<string> {
    const req = create(CreateInstanceRequestSchema, {
      name,
      instanceId: instanceId ?? randomUUID(),
    });

    if (input !== undefined) {
      req.input = JSON.stringify(input);
    }

    if (startAt) {
      req.scheduledStartTimestamp = timestampFromDate(startAt);
    }

    this.logger.info(`Starting new ${name} instance with ID = ${req.instanceId}`);
    const res = await this.client.startInstance(req);
    return res.instanceId;
  }

  async getOrchestrationState(instanceId: string, fetchPayloads = true): Promise<OrchestrationState | undefined> {
    const req = create(GetInstanceRequestSchema, {
      instanceId,
      getInputsAndOutputs: fetchPayloads,
    });

    const res = await this.client.getInstance(req);
    return OrchestrationState.fromGetInstanceResponse(instanceId, res);
  }

  async waitForOrchestrationStart(
    instanceId: string,
    fetchPayloads = false,
    timeoutSeconds = 60,
  ): Promise<OrchestrationState | undefined> {
    const req = create(GetInstanceRequestSchema, {
      instanceId,
      getInputsAndOutputs: fetchPayloads,
    });

    try {
      const res = await Promise.race([
        this.client.waitForInstanceStart(req),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), timeoutSeconds * 1000)),
      ]);
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
  ): Promise<OrchestrationState | undefined> {
    const req = create(GetInstanceRequestSchema, {
      instanceId,
      getInputsAndOutputs: fetchPayloads,
    });

    this.logger.info(`Waiting ${timeoutSeconds} seconds for instance ${instanceId} to complete...`);

    try {
      const res = await Promise.race([
        this.client.waitForInstanceCompletion(req),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), timeoutSeconds * 1000)),
      ]);

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

  async raiseOrchestrationEvent(instanceId: string, eventName: string, data: unknown = null): Promise<void> {
    const req = create(RaiseEventRequestSchema, {
      instanceId,
      name: eventName,
    });

    if (data !== undefined) {
      req.input = JSON.stringify(data);
    }

    this.logger.info(`Raising event '${eventName}' for instance '${instanceId}'`);
    await this.client.raiseEvent(req);
  }

  async terminateOrchestration(instanceId: string, output: unknown = null): Promise<void> {
    const req = create(TerminateRequestSchema, {
      instanceId,
      recursive: true,
    });

    if (output !== undefined) {
      req.output = JSON.stringify(output);
    }

    this.logger.info(`Terminating '${instanceId}'`);
    await this.client.terminateInstance(req);
  }

  async suspendOrchestration(instanceId: string, reason?: string): Promise<void> {
    const req = create(SuspendRequestSchema, {
      instanceId,
    });

    if (reason) {
      req.reason = reason;
    }

    this.logger.info(`Suspending '${instanceId}'`);
    await this.client.suspendInstance(req);
  }

  async resumeOrchestration(instanceId: string, reason?: string): Promise<void> {
    const req = create(ResumeRequestSchema, {
      instanceId,
    });

    if (reason) {
      req.reason = reason;
    }

    this.logger.info(`Resuming '${instanceId}'`);
    await this.client.resumeInstance(req);
  }

  async purgeOrchestration(instanceId: string): Promise<PurgeResult | undefined> {
    const req = create(PurgeInstancesRequestSchema, {
      request: {
        case: "instanceId",
        value: instanceId,
      },
      recursive: true,
    });

    this.logger.info(`Purging Instance '${instanceId}'`);
    const res = await this.client.purgeInstances(req);
    return new PurgeResult(res.deletedInstanceCount);
  }

  async stop(): Promise<void> {
    // ConnectRPC transport doesn't require explicit close
  }
}
