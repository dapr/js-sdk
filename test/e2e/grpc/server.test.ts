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

import { CommunicationProtocolEnum, DaprServer, HttpMethod } from "../../../src";

const serverHost = "localhost";
const serverPort = "50001";
const daprHost = "localhost";
const daprPort = "50000"; // Dapr Sidecar Port of this Example Server
const daprAppId = "test-suite";

describe("grpc/server", () => {
  let server: DaprServer;
  const mockInvoker = jest.fn(async (_data: object) => _data);
  const mockBindingReceive = jest.fn(async (_data: object) => null);

  // We need to start listening on some endpoints already
  // this because Dapr is not dynamic and registers endpoints on boot
  beforeAll(async () => {
    server = new DaprServer({
      serverHost,
      serverPort,
      communicationProtocol: CommunicationProtocolEnum.GRPC,
      clientOptions: {
        daprHost,
        daprPort,
        maxBodySizeMb: 20, // we set sending larger than receiving to test the error handling
      },
      maxBodySizeMb: 10,
    });

    await server.binding.receive("binding-mqtt", mockBindingReceive);
    await server.invoker.listen("test-invoker", mockInvoker, { method: HttpMethod.POST });

    // Start server
    await server.start();

    await new Promise((resolve, _reject) => setTimeout(resolve, 2500));
  }, 10 * 1000);

  beforeEach(() => {
    mockBindingReceive.mockClear();
  });

  afterAll(async () => {
    await server.stop();
  });

  describe("server", () => {
    it("should throw an error if the receive payload is larger than 10 MB and we did not configure a larger size", async () => {
      const payload = new Uint8Array(11 * 1024 * 1024);

      try {
        await server.client.invoker.invoke(daprAppId, "test-invoker", HttpMethod.POST, payload);
      } catch (e: any) {
        expect(e?.details).toEqual(`grpc: received message larger than max (11534407 vs. ${10 * 1024 * 1024})`);
      }
    });

    it("should be able to receive payloads larger than 4 MB", async () => {
      await new Promise((resolve, _reject) => setTimeout(resolve, 1000));
      const payload = new Uint8Array(5 * 1024 * 1024);

      try {
        const res = await server.client.invoker.invoke(daprAppId, "test-invoker", HttpMethod.POST, payload);
        console.log(res);
      } catch (e) {
        console.log(e);
      }

      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 250));
    });
  });

  describe("binding", () => {
    it("should be able to receive events", async () => {
      await server.client.binding.send("binding-mqtt", "create", { hello: "world" });

      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 5000));
      expect(mockBindingReceive.mock.calls.length).toBe(1);

      // Also test for receiving data
      // @ts-ignore
      expect(mockBindingReceive.mock.calls[0][0]["hello"]).toEqual("world");
    });

    it("should be able to send metadata to output binding successfully", async () => {
      await server.client.binding.send("binding-redis", "create", "helloMessage", { key: "helloKey" });

      const res = await server.client.configuration.get("config-redis", ["helloKey"]);
      expect(res.items["helloKey"].value).toContain("helloMessage");
    });
  });

  describe("invoker", () => {
    it("should be able to listen and invoke a service with GET", async () => {
      const mock = jest.fn(async (_data: object) => ({ hello: "world" }));

      await server.invoker.listen("hello-world", mock, { method: HttpMethod.GET });
      const res = await server.client.invoker.invoke(daprAppId, "hello-world", HttpMethod.GET);

      // Delay a bit for event to arrive
      // await new Promise((resolve, reject) => setTimeout(resolve, 250));

      expect(mock.mock.calls.length).toBe(1);
      expect(JSON.stringify(res)).toEqual(`{"hello":"world"}`);
    });

    it("should be able to listen and invoke a service with POST data", async () => {
      const mock = jest.fn(async (_data: object) => ({ hello: "world" }));

      await server.invoker.listen("hello-world", mock, { method: HttpMethod.POST });
      const res = await server.client.invoker.invoke(daprAppId, "hello-world", HttpMethod.POST, {
        hello: "world",
      });

      // Delay a bit for event to arrive
      // await new Promise((resolve, reject) => setTimeout(resolve, 250));

      expect(mock.mock.calls.length).toBe(1);
      expect(JSON.stringify(res)).toEqual(`{"hello":"world"}`);
    });
  });
});
