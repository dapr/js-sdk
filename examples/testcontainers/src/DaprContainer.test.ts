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

import path from "node:path";
import { Network, TestContainers } from "testcontainers";
import { DaprClient, DaprServer, LogLevel } from "@dapr/dapr";
import { DAPR_RUNTIME_IMAGE, DaprContainer } from "./DaprContainer";

describe("DaprContainer", () => {
  it("should load component from path", async () => {
    const componentPath = path.join(__dirname, "__fixtures__", "dapr-resources", "statestore.yaml");
    const dapr = new DaprContainer(DAPR_RUNTIME_IMAGE)
        .withAppName("dapr-app")
        .withAppPort(8081)
        .withComponentFromPath(componentPath)
        .withAppChannelAddress("host.testcontainers.internal");
    const components = dapr.getComponents();
    expect(components.length).toBe(1);
    const kvstore = components[0];
    expect(kvstore.getMetadata().length).toBeTruthy();
    const componentYaml = kvstore.toYaml();
    const expectedComponentYaml =
      "apiVersion: dapr.io/v1alpha1\n" +
      "kind: Component\n" +
      "metadata:\n" +
      "  name: statestore\n" +
      "spec:\n" +
      "  type: state.redis\n" +
      "  version: v1\n" +
      "  metadata:\n" +
      "  - name: keyPrefix\n" +
      "    value: name\n" +
      "  - name: redisHost\n" +
      "    value: redis:6379\n" +
      "  - name: redisPassword\n" +
      '    value: ""\n';
    expect(componentYaml).toBe(expectedComponentYaml);
  });

  it("should start and stop", async () => {
    const network = await new Network().start();
    const dapr = new DaprContainer(DAPR_RUNTIME_IMAGE)
      .withNetwork(network)
      .withDaprLogLevel("debug")
      .withAppChannelAddress("host.testcontainers.internal");
    const startedContainer = await dapr.start();
    expect(startedContainer.getHost()).toBeDefined();
    expect(startedContainer.getHttpPort()).toBeDefined();
    expect(startedContainer.getGrpcPort()).toBeDefined();
    expect(startedContainer.getHttpEndpoint()).toBeDefined();
    expect(startedContainer.getGrpcEndpoint()).toBeDefined();
    await startedContainer.stop();
    await network.stop();
  }, 60_000);

  it("should initialize DaprClient", async () => {
    const network = await new Network().start();
    const dapr = new DaprContainer(DAPR_RUNTIME_IMAGE)
      .withNetwork(network)
      .withDaprLogLevel("debug")
      .withAppChannelAddress("host.testcontainers.internal");
    const startedContainer = await dapr.start();

    const client = new DaprClient({
      daprHost: startedContainer.getHost(),
      daprPort: startedContainer.getHttpPort().toString(),
    });
    await client.start();
    expect(client.getIsInitialized()).toBe(true);
    await client.stop();

    await startedContainer.stop();
    await network.stop();
  }, 60_000);

  it("should provide kvstore in memory by default", async () => {
    const network = await new Network().start();
    const dapr = new DaprContainer(DAPR_RUNTIME_IMAGE)
      .withNetwork(network)
      .withDaprLogLevel("debug")
      .withAppChannelAddress("host.testcontainers.internal")
    const startedContainer = await dapr.start();

    const client = new DaprClient({
      daprHost: startedContainer.getHost(),
      daprPort: startedContainer.getHttpPort().toString(),
    });
    await client.start();
    expect(client.getIsInitialized()).toBe(true);
    await client.state.save("kvstore", [{ key: "key", value: "value" }]);
    const result = await client.state.get("kvstore", "key");
    expect(result).toEqual("value");
    await client.state.delete("kvstore", "key");
    const resultAfterDelete = await client.state.get("kvstore", "key");
    expect(resultAfterDelete).toBe("");
    await client.stop();

    await startedContainer.stop();
    await network.stop();
  }, 60_000);

  it("should provide pubsub in memory by default", async () => {    
    TestContainers.exposeHostPorts(8081);

    const network = await new Network().start();
    const dapr = new DaprContainer(DAPR_RUNTIME_IMAGE)
      .withNetwork(network)
      .withAppPort(8081)
      .withDaprLogLevel("debug")
      .withAppChannelAddress("host.testcontainers.internal")
    const startedContainer = await dapr.start();

    const server = new DaprServer({
      serverHost: "127.0.0.1",
      serverPort: "8081",
      clientOptions: {
        daprHost: startedContainer.getHost(),
        daprPort: startedContainer.getHttpPort().toString()
      },
      logger: { level: LogLevel.Debug },
    });

    const client = new DaprClient({
      daprHost: startedContainer.getHost(),
      daprPort: startedContainer.getHttpPort().toString(),
      logger: { level: LogLevel.Debug },
    });

    // Promise to resolve when the message is received
    let processMessage: (data?: unknown) => void;
    const promise = new Promise((res) => {
      processMessage = res;
    });

    await server.pubsub.subscribe("pubsub", "topic", async (message) => {
      console.log("Message received:", message);
      processMessage(message);
    });

    await server.start();
    // Wait for the server to start
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("Publishing message...");
    const response = await client.pubsub.publish("pubsub", "topic", { key: "key", value: "value" });
    console.log("Publish response:", response);

    // Wait for the message to be processed
    // await new Promise((resolve) => setTimeout(resolve, 5000));
    const result = await promise; // FIXME
    expect(result).toEqual({ key: "key", value: "value" });

    await server.stop();
    await startedContainer.stop();
    await network.stop();
  }, 120_000);
});
