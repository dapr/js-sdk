// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

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

import * as stubs from "../proto/orchestrator_service_grpc_pb";
import * as grpc from "@grpc/grpc-js";

export class GrpcClient {
  private readonly _hostAddress: string;
  private readonly _tls: boolean;
  private readonly _options: grpc.ChannelOptions;
  private _stub: stubs.TaskHubSidecarServiceClient;

  constructor(hostAddress = "localhost:4001", options: grpc.ChannelOptions = {}, useTLS = false) {
    this._hostAddress = hostAddress;
    this._tls = useTLS;
    this._options = this._generateChannelOptions(options);
    this._stub = this._generateClient();
  }

  get stub(): stubs.TaskHubSidecarServiceClient {
    return this._stub;
  }

  _generateClient(): stubs.TaskHubSidecarServiceClient {
    const channelCreds = this._generateCredentials();
    return new stubs.TaskHubSidecarServiceClient(this._hostAddress, channelCreds, this._options);
  }

  _generateCredentials(): grpc.ChannelCredentials {
    if (this._tls) {
      return grpc.ChannelCredentials.createSsl();
    }
    return grpc.ChannelCredentials.createInsecure();
  }

  _generateChannelOptions(options: grpc.ChannelOptions = {}): grpc.ChannelOptions {
    const defaultOptions: Partial<grpc.ClientOptions> = {
      "grpc.max_receive_message_length": 128 * 1024 * 1024, // 128 MB
      "grpc.max_send_message_length": 128 * 1024 * 1024, // 128 MB
      "grpc.primary_user_agent": "dapr-js-sdk/workflow",
    };
    return {
      ...defaultOptions,
      ...options,
    };
  }
}
