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

import express from "express";
import CommunicationProtocolEnum from "../enum/CommunicationProtocol.enum";
import { DaprClientOptions } from "./DaprClientOptions";
import { LoggerOptions } from "./logger/LoggerOptions";

export type DaprServerOptions = {

  /**
   * Host of the server.
   */
  serverHost: string;

  /**
   * Port of the server.
    */
  serverPort: string;

  /**
   * The protocol to be used for communication with dapr sidecar.
   * Default is HTTP.
   */
  communicationProtocol: CommunicationProtocolEnum;

  /**
   * The maximum size of the request body in megabytes.
   * Default is 4MB.
   */
  maxBodySizeMb?: number;

  /**
   * Express server instance
   */
  serverHttp?: express.Express;
  
  /**
   * The options of the Dapr client.
   */
  clientOptions?: Partial<DaprClientOptions>;

  /**
   * Options related to logging.
   */
  logger?: LoggerOptions;  
};
