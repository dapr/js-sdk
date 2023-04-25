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
};
