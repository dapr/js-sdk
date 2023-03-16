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

import express from "express";
import fetch from "node-fetch";
import { CommunicationProtocolEnum, DaprServer, HttpMethod } from "../../../src";
import { DaprInvokerCallbackContent } from "../../../src/types/DaprInvokerCallback.type";
import { KeyValueType } from "../../../src/types/KeyValue.type";

const serverHost = "127.0.0.1";
const serverPort = "50001";
const daprHost = "127.0.0.1";
const daprPort = "50000"; // Dapr Sidecar Port of this Example Server
const daprAppId = "test-suite";

describe("http/server", () => {
  let server: DaprServer;
  const mockBindingReceive = jest.fn(async (_data: object) => null);
  const mockInvoke = jest.fn(async (_data: object) => null);

  // We need to start listening on some endpoints already
  // this because Dapr is not dynamic and registers endpoints on boot
  // we put a timeout of 10s since it takes around 4s for Dapr to boot up
  beforeAll(async () => {
    server = new DaprServer({
      serverHost,
      serverPort,
      communicationProtocol: CommunicationProtocolEnum.HTTP,
      clientOptions: {
        daprHost,
        daprPort,
        maxBodySizeMb: 20, // we set sending larger than receiving to test the error handling
      },
      maxBodySizeMb: 10,
    });

    await server.binding.receive("binding-mqtt", mockBindingReceive);

    // Start server
    await server.start();
  }, 10 * 1000);

  beforeEach(() => {
    mockBindingReceive.mockClear();
    mockInvoke.mockClear();
  });

  afterAll(async () => {
    await server.stop();
  });

  describe("server", () => {
    it("should allow us to pass a custom HTTP Server", async () => {
      const myApp = express();

      myApp.get("/my-custom-endpoint", (req, res) => {
        res.send({ msg: "My own express app!" });
      });

      const myAppDaprServer = new DaprServer({
        serverHost,
        serverPort: "50002",
        communicationProtocol: CommunicationProtocolEnum.HTTP,
        serverHttp: myApp,
        clientOptions: {
          daprHost,
          daprPort,
        },
      });

      // initialize subscribtions, ... before server start
      // the dapr sidecar relies on these
      // this will also initialize the app server itself (removing the need for app.listen to be called)
      await myAppDaprServer.start();

      // Try to call the custom endpoint
      const res = await fetch(`http://${serverHost}:50002/my-custom-endpoint`);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toBeDefined();
      expect(json.msg).toBe("My own express app!");

      // Should still be able to call Dapr endpoints
      // Note: we call manually instead of using the server.client as the server is not running on the default port
      await myAppDaprServer.invoker.listen("dapr-endpoint", mockInvoke, { method: HttpMethod.POST });

      await fetch(`http://${serverHost}:50002/dapr-endpoint`, {
        method: "POST",
        body: JSON.stringify({}),
      });

      expect(mockInvoke).toHaveBeenCalledTimes(1);

      // Cleanup the resources
      await myAppDaprServer.stop();
    });

    it("should be able to receive payloads larger than 4 MB", async () => {
      await new Promise((resolve, _reject) => setTimeout(resolve, 1000));

      // Create a 5Mb payload
      const payload = new Uint8Array(5 * 1024 * 1024);

      await server.invoker.listen("invoke-large-payload-1", mockInvoke, { method: HttpMethod.POST });
      await server.client.invoker.invoke(daprAppId, "invoke-large-payload-1", HttpMethod.POST, payload);

      expect(mockInvoke).toHaveBeenCalledTimes(1);
    });

    it("should throw an error if the receive payload is larger than 4 MB and we did not configure a larger size", async () => {
      const payload = new Uint8Array(11 * 1024 * 1024);
      await server.invoker.listen("invoke-large-payload-2", mockInvoke, { method: HttpMethod.POST });

      try {
        await server.client.invoker.invoke(daprAppId, "invoke-large-payload-2", HttpMethod.POST, payload);
      } catch (e: any) {
        // https://nodejs.org/dist/latest/docs/api/errors.html
        // we will receive EPIPE if server closes
        // on upload this is if the body is too large
        expect(e.message).toBeDefined();
      }

      expect(mockInvoke).not.toHaveBeenCalledTimes(1);
    });
  });

  describe("binding", () => {
    it("should be able to receive events", async () => {
      await server.client.binding.send("binding-mqtt", "create", { hello: "world" });

      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 2000));

      expect(mockBindingReceive.mock.calls.length).toBe(1);

      // Also test for receiving data
      // @ts-ignore
      expect(mockBindingReceive.mock.calls[0][0]["hello"]).toEqual("world");
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

    it("should be able to listen and invoke a service with headers", async () => {
      const mock = jest.fn(async (data: DaprInvokerCallbackContent) => data.headers);

      await server.invoker.listen("hello-world-headers", mock, { method: HttpMethod.GET });
      const res = await server.client.invoker.invoke(daprAppId, "hello-world-headers", HttpMethod.GET, undefined, {
        headers: { "x-foo": "bar-baz" },
      });

      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 250));

      expect(mock.mock.calls.length).toBe(1);
      const headers = res as KeyValueType;
      expect(headers["x-foo"]).toEqual("bar-baz");
    });
  });
});
