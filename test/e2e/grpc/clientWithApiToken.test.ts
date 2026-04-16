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

import { Network, StartedNetwork } from "testcontainers";
import { DaprContainer, StartedDaprContainer } from "@dapr/testcontainer-node";
import { CommunicationProtocolEnum, DaprClient, LogLevel } from "../../../src";
import {
  buildInMemoryPubSubComponent,
  DAPR_TEST_RUNTIME_IMAGE,
  DAPR_TEST_PLACEMENT_IMAGE,
  DAPR_TEST_SCHEDULER_IMAGE,
  runWithCleanupErrorSuppression,
} from "../helpers/containers";

describe("grpc/client with api token", () => {
  let network: StartedNetwork;
  let daprContainer: StartedDaprContainer;

  beforeAll(async () => {
    network = await new Network().start();

    // Configure the Dapr sidecar to require an API token.
    daprContainer = await new DaprContainer(DAPR_TEST_RUNTIME_IMAGE)
      .withPlacementImage(DAPR_TEST_PLACEMENT_IMAGE)
      .withSchedulerImage(DAPR_TEST_SCHEDULER_IMAGE)
      .withNetwork(network)
      .withAppChannelAddress("host.testcontainers.internal")
      .withComponent(buildInMemoryPubSubComponent())
      .withEnvironment({ DAPR_API_TOKEN: "test" })
      .start();
  }, 180 * 1000);

  afterAll(async () => {
    await runWithCleanupErrorSuppression(async () => {
      await daprContainer.stop();
      await network.stop();
    });
  });

  it("should send api token as a header when present", async () => {
    // With ConnectRPC the daprApiToken option installs a ConnectRPC interceptor
    // that adds a "dapr-api-token" HTTP header to every outgoing request.
    // The sidecar is configured with DAPR_API_TOKEN="test", so any API call
    // will succeed only if the client correctly sends the header.
    const clientWithToken = new DaprClient({
      daprHost: daprContainer.getHost(),
      daprPort: daprContainer.getGrpcPort().toString(),
      communicationProtocol: CommunicationProtocolEnum.GRPC,
      daprApiToken: "test",
      logger: { level: LogLevel.Error },
    });

    // A successful metadata call proves the token was included in the request.
    await expect(clientWithToken.metadata.get()).resolves.toBeDefined();
  });

  it("should be rejected by the sidecar when no api token is present", async () => {
    // A client without the token should receive PermissionDenied from the sidecar.
    const clientWithoutToken = new DaprClient({
      daprHost: daprContainer.getHost(),
      daprPort: daprContainer.getGrpcPort().toString(),
      communicationProtocol: CommunicationProtocolEnum.GRPC,
      logger: { level: LogLevel.Error },
    });

    await expect(clientWithoutToken.metadata.get()).rejects.toThrow();
  });
});
