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

import * as grpc from "@grpc/grpc-js";
import { ChannelCredentials } from "@grpc/grpc-js";
import { DaprClient } from "../../../proto/dapr/proto/runtime/v1/dapr_grpc_pb"
import IClient from "../../../interfaces/Client/IClient";
import CommunicationProtocolEnum from "../../../enum/CommunicationProtocol.enum";
import { DaprClientOptions } from "../../../types/DaprClientOptions";
import { Settings } from '../../../utils/Settings.util';
import * as NodeJSUtils from "../../../utils/NodeJS.util";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { GetMetadataResponse } from "../../../proto/dapr/proto/runtime/v1/dapr_pb";

export default class GRPCClient implements IClient {
  private isInitialized: boolean;

  private readonly client: DaprClient;
  private readonly clientCredentials: grpc.ChannelCredentials;
  private readonly clientHost: string;
  private readonly clientPort: string;
  private readonly options: DaprClientOptions;

  constructor(
    host = Settings.getDefaultHost()
    , port = Settings.getDefaultGrpcPort()
    , options: DaprClientOptions = {
      isKeepAlive: true
    }
  ) {
    this.clientHost = host;
    this.clientPort = port;
    this.clientCredentials = ChannelCredentials.createInsecure();
    this.options = options;
    this.isInitialized = false;

    console.log(`[Dapr-JS][gRPC] Opening connection to ${this.clientHost}:${this.clientPort}`);
    this.client = new DaprClient(`${this.clientHost}:${this.clientPort}`, this.clientCredentials);
  }

  getClientHost(): string {
    return this.clientHost;
  }

  getClientPort(): string {
    return this.clientPort;
  }

  getClient(): DaprClient {
    return this.client;
  }

  getClientCommunicationProtocol(): CommunicationProtocolEnum {
    return CommunicationProtocolEnum.GRPC;
  }

  getOptions(): DaprClientOptions {
    return this.options;
  }

  async isSidecarStarted(): Promise<boolean> {
    return new Promise((resolve, _reject) => {
      try {
        this.client.getMetadata(new Empty(), (err, _res: GetMetadataResponse) => {
          if (err) {
            return resolve(false);
          }

          return resolve(true);
        });
      } catch (e) {
        return resolve(false);
      }
    });
  }

  async stop(): Promise<void> {
    this.client.close();
  }

  async start(): Promise<void> {
    // Dapr will probe every 50ms to see if we are listening on our port: https://github.com/dapr/dapr/blob/a43712c97ead550ca2f733e9f7e7769ecb195d8b/pkg/runtime/runtime.go#L1694
    // if we are using actors we will change this to 4s to let the placement tables update
    let isHealthy = false;
    let isHealthyRetryCount = 0;
    const isHealthyMaxRetryCount = 60; // 1s startup delay and we try max for 60s

    console.log(`[Dapr-JS][Client] Awaiting Sidecar to be Started`);
    while (!isHealthy) {
      console.log(`[Dapr-JS][Client] Waiting till Dapr Sidecar Started (#${isHealthyRetryCount})`);
      await NodeJSUtils.sleep(Settings.getDaprSidecarPollingDelayMs());

      // Implement API call manually as we need to enable calling without initialization
      // everything routes through the `execute` method
      // to check health, we just ping the /metadata endpoint and see if we get a response
      isHealthy = await this.isSidecarStarted();

      // Finally, Handle the retry logic
      isHealthyRetryCount++;

      if (isHealthyRetryCount > isHealthyMaxRetryCount) {
        throw new Error("DAPR_SIDECAR_COULD_NOT_BE_STARTED");
      }
    }

    // We are initialized
    this.isInitialized = true;
    console.log(`[Dapr-JS][Client] Sidecar Started`);
  }
}