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
import { promisify } from "node:util";
import bodyParser from "body-parser";
import express from "express";
import { Network, TestContainers } from "testcontainers";
import { DaprClient, LogLevel } from "@dapr/dapr";
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
    const app = express();
    app.use(bodyParser.json({ type: "application/*+json" }));

    // Promise to resolve when the data is received
    let receiver: (data?: unknown) => void;
    const promise = new Promise((res) => {
      receiver = res;
    });

    app.post("/events", (req, res) => {
      const data = req.body.data;
      console.log("Received data:", data);
      res.sendStatus(200);
      receiver(data);
    });

    const appPort = 8081;
    const server = app.listen(appPort, () => {
      console.log(`Server is listening on port ${appPort}`);
    });
    await TestContainers.exposeHostPorts(appPort);

    const network = await new Network().start();
    const dapr = new DaprContainer(DAPR_RUNTIME_IMAGE)
      .withNetwork(network)
      .withAppPort(appPort)
      .withDaprLogLevel("info")
      .withDaprApiLoggingEnabled(false)
      .withAppChannelAddress("host.testcontainers.internal")
    const startedContainer = await dapr.start();

    const client = new DaprClient({
      daprHost: startedContainer.getHost(),
      daprPort: startedContainer.getHttpPort().toString(),
      logger: { level: LogLevel.Debug },
    });

    console.log("Publishing message...");
    await client.pubsub.publish("pubsub", "topic", { key: "key", value: "value" });

    console.log("Waiting for data...");
    const data = await promise;
    expect(data).toEqual({ key: "key", value: "value" });

    await client.stop();
    await startedContainer.stop();
    await network.stop();
    await promisify(server.close.bind(server))();
  }, 60_000);

  it("should route messages programmatically", async () => {
    const app = express();
    app.use(bodyParser.json({ type: "application/*+json" }));

    // Promise to resolve when the data is received
    let receiver: (data?: unknown) => void;
    const promise = new Promise((res) => {
      receiver = res;
    });

    app.get("/dapr/subscribe", (req, res) => {
      res.json([
        {
          pubsubname: "pubsub",
          topic: "orders",
          routes: {
            default: "/orders",
          },
        }
      ]);
    });

    app.post("/orders", (req, res) => {
      const data = req.body.data;
      console.log("Received data:", data);
      res.sendStatus(200);
      receiver(data);
    });

    const appPort = 8082;
    const server = app.listen(appPort, () => {
      console.log(`Server is listening on port ${appPort}`);
    });
    await TestContainers.exposeHostPorts(appPort);

    const network = await new Network().start();
    const dapr = new DaprContainer(DAPR_RUNTIME_IMAGE)
      .withNetwork(network)
      .withAppPort(appPort)
      .withDaprLogLevel("info")
      .withDaprApiLoggingEnabled(false)
      .withAppChannelAddress("host.testcontainers.internal")
    const startedContainer = await dapr.start();

    const client = new DaprClient({
      daprHost: startedContainer.getHost(),
      daprPort: startedContainer.getHttpPort().toString(),
      logger: { level: LogLevel.Debug },
    });

    console.log("Publishing message...");
    await client.pubsub.publish("pubsub", "orders", { key: "key", value: "value" });

    console.log("Waiting for data...");
    const data = await promise;
    expect(data).toEqual({ key: "key", value: "value" });

    await client.stop();
    await startedContainer.stop();
    await network.stop();
    await promisify(server.close.bind(server))();
  }, 60_000);
});
