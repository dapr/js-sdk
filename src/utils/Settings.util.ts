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

export class Settings {
  private static readonly defaultAppId: string = "my-dapr-app";
  private static readonly defaultApiToken = undefined;
  private static readonly defaultHost: string = "127.0.0.1";
  private static readonly defaultHttpAppPort: string = "3000";
  private static readonly defaultHttpPort: string = "3500";
  private static readonly defaultGrpcAppPort: string = "50000";
  private static readonly defaultGrpcPort: string = "50001";
  private static readonly defaultHttpEndpoint: string = "";
  private static readonly defaultGrpcEndpoint: string = "";
  private static readonly defaultCommunicationProtocol: CommunicationProtocolEnum = CommunicationProtocolEnum.HTTP;
  private static readonly defaultKeepAlive: boolean = true;
  private static readonly defaultStateGetBulkParallelism: number = 10;
  private static readonly defaultPubSubRouteName = "default";
  private static readonly defaultPubSubDeadLetterRouteName = "deadletter";

  private static readonly daprSidecarPollingDelayMs: number = 500;
  private static readonly daprSidecarStartupTimeoutMs: number = 10 * 1000;

  static getDaprSidecarPollingDelayMs(): number {
    return Settings.daprSidecarPollingDelayMs;
  }

  static getDaprSidecarStartupTimeoutMs(): number {
    return Settings.daprSidecarStartupTimeoutMs;
  }

  static getDefaultCommunicationProtocol(): CommunicationProtocolEnum {
    return Settings.defaultCommunicationProtocol;
  }

  static getDefaultKeepAlive(): boolean {
    return Settings.defaultKeepAlive;
  }

  static getAppId(): string {
    return process.env.APP_ID ?? Settings.defaultAppId;
  }

  static getDefaultApiToken() {
    return process.env.DAPR_API_TOKEN || Settings.defaultApiToken;
  }

  static getDefaultHost(): string {
    return Settings.defaultHost;
  }

  static getDefaultHttpPort(): string {
    return process.env.DAPR_HTTP_PORT ?? Settings.defaultHttpPort;
  }

  static getDefaultGrpcPort(): string {
    return process.env.DAPR_GRPC_PORT ?? Settings.defaultGrpcPort;
  }

  static getDefaultStateGetBulkParallelism(): number {
    return Settings.defaultStateGetBulkParallelism;
  }

  /**
   * Gets the default port that the Dapr sidecar is listening to.
   * @param communicationProtocolEnum communication protocol
   * @returns port number
   */
  static getDefaultPort(communicationProtocolEnum: CommunicationProtocolEnum): string {
    switch (communicationProtocolEnum) {
      case CommunicationProtocolEnum.GRPC:
        return this.getDefaultGrpcPort();
      default:
        return this.getDefaultHttpPort();
    }
  }

  static getDefaultHttpAppPort(): string {
    return process.env.APP_PORT ?? Settings.defaultHttpAppPort;
  }

  static getDefaultGrpcAppPort(): string {
    return process.env.APP_PORT ?? Settings.defaultGrpcAppPort;
  }

  static getDefaultHttpEndpoint(): string {
    return process.env.DAPR_HTTP_ENDPOINT || Settings.defaultHttpEndpoint;
  }

  static getDefaultGrpcEndpoint(): string {
    return process.env.DAPR_GRPC_ENDPOINT || Settings.defaultGrpcEndpoint;
  }

  /**
   * Gets the default port that the application is listening on.
   * @param communicationProtocolEnum communication protocol
   * @returns port number
   */
  static getDefaultAppPort(communicationProtocolEnum: CommunicationProtocolEnum): string {
    switch (communicationProtocolEnum) {
      case CommunicationProtocolEnum.GRPC:
        return this.getDefaultGrpcAppPort();
      default:
        return this.getDefaultHttpAppPort();
    }
  }

  static getDefaultPubSubRouteName(): string {
    return Settings.defaultPubSubRouteName;
  }

  static getDefaultPubSubDeadLetterRouteName(): string {
    return Settings.defaultPubSubDeadLetterRouteName;
  }
}
