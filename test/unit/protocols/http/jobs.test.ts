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

import fetch from "node-fetch";
import { AddressInfo } from "node:net";
import { Server } from "node:http";
import { DaprClient, DaprServer, HTTPClient } from "../../../../src";
import HTTPServer from "../../../../src/implementation/Server/HTTPServer/HTTPServer";

describe("HTTP Jobs client", () => {
  afterEach(() => jest.restoreAllMocks());

  const setup = (runtimeVersion = "1.18.0") => {
    const client = new DaprClient();
    const transport = client.daprClient as HTTPClient;
    const metadata = jest.spyOn(client.metadata, "get").mockResolvedValue({
      id: "test",
      actors: [],
      components: [],
      extended: {},
      runtimeVersion,
    });
    const execute = jest.spyOn(transport, "executeWithApiVersion").mockResolvedValue({
      name: "test job",
      dueTime: "1h",
      data: { "@type": "type.googleapis.com/google.protobuf.Value", value: false },
    });
    return { client, execute, metadata };
  };

  it.each([
    ["1.16.0", "v1.0-alpha1"],
    ["1.17.0", "v1.0-alpha1"],
    ["1.18.0", "v1.0"],
  ])("routes every operation for %s to %s", async (runtimeVersion, version) => {
    const { client, execute, metadata } = setup(runtimeVersion);
    await client.jobs.schedule("test job", {
      dueTime: "1h",
      data: false,
      repeats: 0,
      overwrite: true,
      failurePolicy: { type: "constant", interval: "0.1s", maxRetries: 0 },
    });
    expect(execute).toHaveBeenNthCalledWith(1, version, "/jobs/test%20job", {
      method: "POST",
      body: {
        dueTime: "1h",
        schedule: undefined,
        ttl: undefined,
        data: false,
        repeats: 0,
        overwrite: true,
        failurePolicy: { constant: { interval: "0.100s", maxRetries: 0 } },
      },
    });
    expect(execute.mock.calls[0][2].body).not.toHaveProperty("name");
    await expect(client.jobs.get("test job")).resolves.toMatchObject({ name: "test job", data: false });
    await client.jobs.delete("test job");
    expect(execute).toHaveBeenNthCalledWith(2, version, "/jobs/test%20job", { method: "GET" });
    expect(execute).toHaveBeenNthCalledWith(3, version, "/jobs/test%20job", { method: "DELETE" });
    expect(metadata).toHaveBeenCalledTimes(1);
  });

  it("does not call metadata or the sidecar for invalid input or opaque bytes", async () => {
    const { client, execute, metadata } = setup();
    await expect(client.jobs.schedule("test", {})).rejects.toThrow();
    await expect(client.jobs.schedule("test", { dueTime: "1s", data: Buffer.alloc(0) })).rejects.toThrow("gRPC");
    await expect(client.jobs.get("../bad")).rejects.toThrow();
    await expect(client.jobs.delete("")).rejects.toThrow();
    expect(metadata).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it("sends explicit null for omitted data so older runtimes can deliver the callback", async () => {
    const { client, execute } = setup("1.16.0");
    await client.jobs.schedule("test", { dueTime: "1s" });
    expect(execute.mock.calls[0][2].body.data).toBeNull();
  });

  it("never retries mutations or hides not-found, authorization, or server errors", async () => {
    for (const status of [400, 401, 403, 404, 409, 500, 503]) {
      const { client, execute } = setup();
      const error = new Error(JSON.stringify({ status }));
      execute.mockRejectedValue(error);
      await expect(client.jobs.schedule("test", { dueTime: "1h" })).rejects.toBe(error);
      await expect(client.jobs.get("test")).rejects.toBe(error);
      await expect(client.jobs.delete("test")).rejects.toBe(error);
      expect(execute).toHaveBeenCalledTimes(3);
    }
  });

  it.each(["", {}, { name: "test", data: { "@type": "unknown/type", value: "bad" } }])(
    "rejects malformed get response %j",
    async (response) => {
      const { client, execute } = setup();
      execute.mockResolvedValue(response);
      await expect(client.jobs.get("test")).rejects.toThrow();
    },
  );

  it("blocks all Jobs requests on unsupported runtimes and recovers after metadata becomes valid", async () => {
    const { client, metadata, execute } = setup("1.15.9");
    await expect(client.jobs.schedule("test", { dueTime: "1h" })).rejects.toThrow("requires Dapr runtime 1.16");
    await expect(client.jobs.get("test")).rejects.toThrow("requires Dapr runtime 1.16");
    await expect(client.jobs.delete("test")).rejects.toThrow("requires Dapr runtime 1.16");
    expect(execute).not.toHaveBeenCalled();
    metadata.mockResolvedValue({ id: "test", runtimeVersion: "1.18.0", actors: [], components: [], extended: {} });
    await expect(client.jobs.schedule("test", { dueTime: "1h" })).resolves.toBeUndefined();
    expect(execute).toHaveBeenCalledTimes(1);
    expect(metadata).toHaveBeenCalledTimes(4);
  });

  it("preserves Struct responses and optional fields from older clients", async () => {
    const { client, execute } = setup();
    execute.mockResolvedValue({
      name: "test",
      schedule: "0 * * * * *",
      data: { "@type": "type.googleapis.com/google.protobuf.Struct", value: { nested: [false, 0] } },
      failurePolicy: { drop: {} },
    });
    await expect(client.jobs.get("test")).resolves.toEqual({
      name: "test",
      schedule: "0 * * * * *",
      dueTime: undefined,
      ttl: undefined,
      repeats: undefined,
      data: { nested: [false, 0] },
      failurePolicy: { type: "drop" },
    });
  });
});

describe("HTTP Jobs callbacks", () => {
  let server: DaprServer;
  let listener: Server;
  let url: string;

  beforeEach(async () => {
    server = new DaprServer();
    const app = (server.daprServer as HTTPServer).getServer();
    listener = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => listener.once("listening", resolve));
    url = `http://127.0.0.1:${(listener.address() as AddressInfo).port}/job`;
  });
  afterEach(async () => {
    await new Promise<void>((resolve, reject) => listener.close((error) => (error ? reject(error) : resolve())));
    await server.client.stop();
  });

  it.each([null, false, 0, "", [], { value: 1 }])("delivers %j unchanged", async (data) => {
    const callback = jest.fn(async () => {});
    await server.jobs.listen("test", callback);
    const response = await fetch(`${url}/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    expect(response.status).toBe(200);
    expect(callback).toHaveBeenCalledWith(data);
  });

  it("waits for completion and reports failure without acknowledging the job", async () => {
    let complete!: () => void;
    const waiting = new Promise<void>((resolve) => {
      complete = resolve;
    });
    const callback = jest.fn(async () => {
      await waiting;
      throw new Error("failure");
    });
    await server.jobs.listen("test", callback);
    const request = fetch(`${url}/test`, { method: "POST" });
    while (callback.mock.calls.length === 0) {
      await new Promise((resolve) => setImmediate(resolve));
    }
    complete();
    expect((await request).status).toBe(500);
    expect((await fetch(`${url}/unknown`, { method: "POST" })).status).toBe(404);
  });

  it("rejects duplicates and preserves case-sensitive/prototype-key names", async () => {
    const callback = jest.fn(async () => {});
    for (const name of ["Name", "name", "__proto__", "constructor"]) {
      await server.jobs.listen(name, callback);
      expect((await fetch(`${url}/${name}`, { method: "POST" })).status).toBe(200);
    }
    await expect(server.jobs.listen("Name", callback)).rejects.toThrow("already registered");
    await expect(server.jobs.listen("", callback)).rejects.toThrow();
    expect(callback).toHaveBeenCalledTimes(4);
  });

  it("rejects malformed JSON without invoking or acknowledging the callback", async () => {
    const callback = jest.fn(async () => {});
    await server.jobs.listen("test", callback);
    const response = await fetch(`${url}/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"incomplete":',
    });
    expect(response.status).toBe(400);
    expect(callback).not.toHaveBeenCalled();
  });

  it("rejects non-function callbacks without reserving the name or registering the route", async () => {
    const app = (server.daprServer as HTTPServer).getServer();
    const post = jest.spyOn(app, "post");
    try {
      // @ts-expect-error Exercise JavaScript callers that omit the required callback.
      await expect(server.jobs.listen("test", undefined)).rejects.toThrow("A job callback is required");
      expect(post).not.toHaveBeenCalled();
      const callback = jest.fn(async () => {});
      await server.jobs.listen("test", callback);
      await server.jobs.listen("second", callback);
      expect(post).toHaveBeenCalledTimes(1);
      expect((await fetch(`${url}/test`, { method: "POST" })).status).toBe(200);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(undefined);
    } finally {
      post.mockRestore();
    }
  });

  it("recovers after a failed callback without replacing the registered handler", async () => {
    const callback = jest
      .fn<Promise<void>, [unknown]>()
      .mockRejectedValueOnce(new Error("temporary failure"))
      .mockResolvedValue();
    const replacement = jest.fn(async () => {});
    await server.jobs.listen("test", callback);
    await expect(server.jobs.listen("test", replacement)).rejects.toThrow("already registered");
    const failed = await fetch(`${url}/test`, { method: "POST" });
    expect(failed.status).toBe(500);
    expect(await failed.json()).toEqual({ error: "COULD_NOT_PROCESS_CALLBACK" });
    expect((await fetch(`${url}/test`, { method: "POST" })).status).toBe(200);
    expect(callback).toHaveBeenCalledTimes(2);
    expect(replacement).not.toHaveBeenCalled();
  });
});
