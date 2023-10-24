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

import CommunicationProtocolEnum from "../enum/CommunicationProtocol.enum";
import { ActorRuntimeOptions } from "./actors/ActorRuntimeOptions";
import { LoggerOptions } from "./logger/LoggerOptions";
import { Endpoint } from "../utils/Client.util";

export type DaprClientOptions = {
  /**
   * Host location of the Dapr sidecar.
   * Default is 127.0.0.1.
   */
  daprHost: string;

  /**
   * Port of the Dapr sidecar.
   * Default is 3500.
   */
  daprPort: string;

  /**
   * gRPC endpoint of the Dapr sidecar.
   */
  daprEndpoint: Endpoint;

  /**
   * Protocol to use to communicate with the Dapr sidecar.
   * Default is HTTP.
   */
  communicationProtocol: CommunicationProtocolEnum;

  /**
   * If set to false, the HTTP client will not reuse the same connection for multiple requests.
   * Default is true.
   */
  isKeepAlive?: boolean;

  /**
   * Options related to logging.
   */
  logger?: LoggerOptions;

  /**
   * Options related to actors.
   */
  actor?: ActorRuntimeOptions;

  /**
   * API token to authenticate with Dapr.
   * See https://docs.dapr.io/operations/security/api-token/.
   */
  daprApiToken?: string;

  /**
   * The maximum size of the request body in megabytes.
   * Default is 4MB.
   */
  maxBodySizeMb?: number;
};
