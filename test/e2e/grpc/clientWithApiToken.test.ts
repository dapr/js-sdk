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
import { Network, StartedNetwork } from "testcontainers";
import { DaprContainer, StartedDaprContainer, DAPR_RUNTIME_IMAGE } from "@dapr/testcontainer-node";
import { CommunicationProtocolEnum, DaprClient, LogLevel } from "../../../src";
import { DaprClient as DaprClientGrpc } from "../../../src/proto/dapr/proto/runtime/v1/dapr_grpc_pb";
import { NextCall } from "@grpc/grpc-js/build/src/client-interceptors";
import { GetMetadataRequest } from "../../../src/proto/dapr/proto/runtime/v1/metadata_pb";
import { buildInMemoryPubSubComponent } from "../helpers/containers";

describe("grpc/client with api token", () => {
  let network: StartedNetwork;
  let daprContainer: StartedDaprContainer;

  beforeAll(async () => {
    network = await new Network().start();

    // Configure the Dapr sidecar to require an API token.
    daprContainer = await new DaprContainer(DAPR_RUNTIME_IMAGE)
      .withNetwork(network)
      .withAppChannelAddress("host.testcontainers.internal")
      .withComponent(buildInMemoryPubSubComponent())
      .withEnvironment({ DAPR_API_TOKEN: "test" })
      .start();
  }, 180 * 1000);

  afterAll(async () => {
    await daprContainer.stop();
    await network.stop();
  });

  it("should send api token as metadata when present", async () => {
    const clientWithToken = new DaprClient({
      daprHost: daprContainer.getHost(),
      daprPort: daprContainer.getGrpcPort().toString(),
      communicationProtocol: CommunicationProtocolEnum.GRPC,
      daprApiToken: "test",
      logger: {
        level: LogLevel.Debug,
      },
    });

    let mockMetadataRes: grpc.Metadata = new grpc.Metadata();
    const mockInterceptor = jest.fn((options: grpc.InterceptorOptions, nextCall: NextCall): grpc.InterceptingCall => {
      return new grpc.InterceptingCall(nextCall(options), {
        start: function (
          metadata: grpc.Metadata,
          listener: grpc.InterceptingListener,
          next: (metadata: grpc.Metadata, listener: grpc.InterceptingListener | grpc.Listener) => void,
        ) {
          mockMetadataRes = metadata;
          next(metadata, listener);
        },
      });
    });

    const clientProxy = await clientWithToken.proxy.create<DaprClientGrpc>(DaprClientGrpc, {
      interceptors: [mockInterceptor],
    });

    await new Promise((resolve) => clientProxy.getMetadata(new GetMetadataRequest(), resolve));
    expect(mockMetadataRes.get("dapr-api-token")[0]).toBe("test");
  });
});
