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

import { CommunicationProtocolEnum, DaprClient } from "../../../src";

const daprHost = "127.0.0.1";
const daprPort = "50000"; // Dapr Sidecar Port of this Example Server

describe("http/client", () => {
  let client: DaprClient;

  // We need to start listening on some endpoints already
  // this because Dapr is not dynamic and registers endpoints on boot
  // we put a timeout of 10s since it takes around 4s for Dapr to boot up
  beforeAll(async () => {
    client = new DaprClient({
      daprHost,
      daprPort,
      communicationProtocol: CommunicationProtocolEnum.HTTP,
      isKeepAlive: false,
    });
  }, 10 * 1000);

  afterAll(async () => {
    await client.stop();
  });

  describe("sidecar", () => {
    it("should return true if the sidecar has been started", async () => {
      // Note: difficult to test as we start up dapr with dapr run, which starts the sidecar for us automatically
      // there is however a delay between the sidecar being ready and the app starting as they are started asynchronously
      // if Dapr has to connect to a component, it might introduce a delay
      // the test will thus randomly have isStarted = true or isStarted = false depending on the startup delay of the sidecar
      await client.health.isHealthy();
      // expect(isStarted).toBe(false);
    });
  });

  describe("metadata", () => {
    it("should be able to get the metadata of the Dapr sidecar", async () => {
      const res = await client.metadata.get();

      expect(res.id.length).toBeGreaterThan(0);
      expect(res.components.length).toBeGreaterThan(0);
    });

    it("should be able to get the capabilities of components via metadata call", async () => {
      const res = await client.metadata.get();
      const redisStateComponent = res.components.filter((component) => component.name == "state-redis");
      const expectedRedisStateCapabilities = ["ETAG", "TRANSACTIONAL", "ACTOR"];
      expect(res.id.length).toBeGreaterThan(0);
      expect(res.components.length).toBeGreaterThan(0);
      expect(redisStateComponent.length).toEqual(1);
      expect(redisStateComponent[0].capabilities).toEqual(expect.arrayContaining(expectedRedisStateCapabilities));
    });

    it("should be able to set a custom metadata value of the Dapr sidecar", async () => {
      await client.metadata.set("testKey", "Hello World");

      const res = await client.metadata.get();

      expect(res.id.length).toBeGreaterThan(0);
      expect(res.components.length).toBeGreaterThan(0);
      expect(res.extended["testKey"]).toEqual("Hello World");
    });
  });

  describe("health", () => {
    it("should return true if Dapr is ready", async () => {
      const res = await client.health.isHealthy();
      expect(res).toEqual(true);
    });
  });

  describe("secrets", () => {
    it("should be able to correctly fetch the secrets by a single key", async () => {
      const res = await client.secret.get("secret-envvars", "TEST_SECRET_1");
      expect(JSON.stringify(res)).toEqual(`{"TEST_SECRET_1":"secret_val_1"}`);
    });

    it("should be able to correctly fetch the secrets in bulk", async () => {
      const res = await client.secret.getBulk("secret-envvars");
      expect(Object.keys(res).length).toBeGreaterThan(1);
    });
  });
});
