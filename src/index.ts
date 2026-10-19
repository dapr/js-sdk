/*
Copyright 2022 The Dapr Authors
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

import { Temporal } from "@js-temporal/polyfill";

import DaprServer from "./implementation/Server/DaprServer";
import DaprClient from "./implementation/Client/DaprClient";
import GRPCClient from "./implementation/Client/GRPCClient/GRPCClient";
import HTTPClient from "./implementation/Client/HTTPClient/HTTPClient";

import ActorId from "./actors/ActorId";
import ActorProxyBuilder from "./actors/client/ActorProxyBuilder";
import AbstractActor from "./actors/runtime/AbstractActor";

import { ConsoleLoggerService } from "./logger/ConsoleLoggerService";

import { DaprClientOptions } from "./types/DaprClientOptions";
import { InvokerOptions } from "./types/InvokerOptions.type";
import { DaprInvokerCallbackContent, DaprInvokerCallbackFunction } from "./types/DaprInvokerCallback.type";
import { LoggerOptions } from "./types/logger/LoggerOptions";
import { LoggerService } from "./types/logger/LoggerService";
import { LogLevel } from "./types/logger/LogLevel";
import { PubSubBulkPublishResponse } from "./types/pubsub/PubSubBulkPublishResponse.type";
import { PubSubBulkPublishMessage } from "./types/pubsub/PubSubBulkPublishMessage.type";

import HttpMethod from "./enum/HttpMethod.enum";
import CommunicationProtocolEnum from "./enum/CommunicationProtocol.enum";
import DaprPubSubStatusEnum from "./enum/DaprPubSubStatus.enum";
import StateConcurrencyEnum from "./enum/StateConcurrency.enum";
import StateConsistencyEnum from "./enum/StateConsistency.enum";
import { StateGetBulkOptions } from "./types/state/StateGetBulkOptions.type";

import DaprWorkflowClient from "./workflow/client/DaprWorkflowClient";
import WorkflowActivityContext from "./workflow/runtime/WorkflowActivityContext";
import WorkflowContext from "./workflow/runtime/WorkflowContext";
import WorkflowRuntime from "./workflow/runtime/WorkflowRuntime";
import { TWorkflow } from "./types/workflow/Workflow.type";
import { RetryPolicy } from "./types/workflow/RetryPolicy.type";
import { ActivityOptions } from "./types/workflow/ActivityOptions.type";
import { ChildWorkflowOptions } from "./types/workflow/ChildWorkflowOptions.type";
import { DetachedWorkflowOptions } from "./types/workflow/DetachedWorkflowOptions.type";
import { HistoryPropagationScope } from "./proto/dapr/proto/durabletask/v1/orchestration_pb";
import { Task, TaskCanceledError, TaskTimeoutError } from "./workflow/engine/task";
import { ExternalEventOptions } from "./types/workflow/ExternalEventOptions.type";
import { WorkflowFailureDetails } from "./workflow/client/WorkflowFailureDetails";
import { WorkflowState } from "./workflow/client/WorkflowState";
import { RerunWorkflowFromEventOptions, WorkflowInstanceIdPage } from "./types/workflow/WorkflowManagement.types";
import type { HistoryEvent } from "./proto/dapr/proto/durabletask/v1/history_events_pb";
import {
  WorkflowRuntimeStatus,
  fromOrchestrationStatus,
  toOrchestrationStatus,
} from "./workflow/runtime/WorkflowRuntimeStatus";

export {
  DaprClient,
  DaprServer,
  GRPCClient,
  HTTPClient,
  HttpMethod,
  AbstractActor,
  ActorId,
  ActorProxyBuilder,
  Temporal,
  DaprClientOptions,
  LogLevel,
  LoggerOptions,
  LoggerService,
  ConsoleLoggerService,
  InvokerOptions,
  DaprInvokerCallbackFunction as TypeDaprInvokerCallback,
  DaprInvokerCallbackContent,
  CommunicationProtocolEnum,
  DaprPubSubStatusEnum,
  PubSubBulkPublishMessage,
  StateConcurrencyEnum,
  StateConsistencyEnum,
  PubSubBulkPublishResponse,
  StateGetBulkOptions,
  DaprWorkflowClient,
  WorkflowActivityContext,
  WorkflowContext,
  WorkflowRuntime,
  TWorkflow,
  RetryPolicy,
  ActivityOptions,
  ChildWorkflowOptions,
  DetachedWorkflowOptions,
  HistoryPropagationScope,
  Task,
  TaskCanceledError,
  TaskTimeoutError,
  ExternalEventOptions,
  WorkflowFailureDetails,
  WorkflowState,
  RerunWorkflowFromEventOptions,
  WorkflowInstanceIdPage,
  HistoryEvent,
  WorkflowRuntimeStatus,
  fromOrchestrationStatus,
  toOrchestrationStatus,
};

export type {
  PropagatedHistory,
  PropagatedHistoryEntry,
  PropagatedHistoryView,
} from "./workflow/runtime/PropagatedHistory";
export type { CancellableTask } from "./types/workflow/CancellableTask.type";
