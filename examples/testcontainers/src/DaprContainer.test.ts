/*
Copyright 2025 The Dapr Authors
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

// import { setTimeout } from "node:timers/promises";
// import { GenericContainer, Network, Wait } from "testcontainers";
import { Network } from "testcontainers";
import { DaprContainer } from "./DaprContainer";

// jest.setTimeout(120_000);

describe("DaprContainer", () => {
  it("should start and stop", async () => {
    const network = await new Network().start();
    const container = new DaprContainer("daprio/dapr:latest").withNetwork(network);
    const startedContainer = await container.start();
    expect(startedContainer.getHost()).toBeDefined();
    expect(startedContainer.getHttpPort()).toBeDefined();
    expect(startedContainer.getGrpcPort()).toBeDefined();
    expect(startedContainer.getHttpEndpoint()).toBeDefined();
    expect(startedContainer.getGrpcEndpoint()).toBeDefined();
    await startedContainer.stop();
    await network.stop();
  }, 120_000);
});
