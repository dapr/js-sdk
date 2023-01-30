/*
Copyright 2023 The Dapr Authors
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

import { CommunicationProtocolEnum, DaprClient, LogLevel } from "../../../src";
import { expect, describe, it } from "@jest/globals";

const daprHost = "127.0.0.1";
const daprGrpcPort = "50000";
const daprHttpPort = "3500";
const loggerSettings = {
  level: LogLevel.Debug,
};

describe("common/client", () => {
  let httpClient: DaprClient;
  let grpcClient: DaprClient;

  beforeAll(async () => {
    httpClient = new DaprClient(daprHost, daprHttpPort, CommunicationProtocolEnum.HTTP, {
      logger: loggerSettings,
    });
    await httpClient.getDaprClient().getClient();

    grpcClient = new DaprClient(daprHost, daprGrpcPort, CommunicationProtocolEnum.GRPC, {
      logger: loggerSettings,
    });
    await grpcClient.getDaprClient().getClient();
  }, 10 * 1000);

  afterAll(async () => {
    await httpClient.stop();
    await grpcClient.stop();
  });

  // Helper function to run the test for both HTTP and gRPC.
  const runIt = (name: string, fn: (client: DaprClient) => void) => {
    it("http/" + name, () => fn(httpClient));
    it("grpc/" + name, () => fn(grpcClient));
  };

  describe("client", () => {
    runIt("should return isInitialized is true if the sidecar has been started", async (client: DaprClient) => {
      expect(client.getIsInitialized()).toBe(true);
    });
  });

  describe("pubsub", () => {
    const pubSubName = "pubsub-redis";
    const topic = "test-topic";

    const ce = {
      specversion: "1.0",
      type: "com.github.pull.create",
      source: "https://github.com/cloudevents/spec/pull",
      id: "A234-1234-1234",
    };

    runIt("should be able to publish a plain text", async (client: DaprClient) => {
      const res = await client.pubsub.publish(pubSubName, topic, "Hello World");
      expect(res.error).toEqual(undefined);
    });

    runIt("should be able to publish a JSON", async (client: DaprClient) => {
      const res = await client.pubsub.publish(pubSubName, topic, { hello: "world" });
      expect(res.error).toEqual(undefined);
    });

    runIt("should be able to publish a cloud event", async (client: DaprClient) => {
      const res = await client.pubsub.publish(pubSubName, topic, ce);
      expect(res.error).toEqual(undefined);
    });
  });
});
