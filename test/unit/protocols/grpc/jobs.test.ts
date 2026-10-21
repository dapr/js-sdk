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

import { Code, ConnectError, createClient, createRouterTransport } from "@connectrpc/connect";
import * as connectNode from "@connectrpc/connect-node";
import { CommunicationProtocolEnum, DaprClient, DaprServer, GRPCClient, withBaggage } from "../../../../src";
import { Dapr } from "../../../../src/proto/dapr/proto/runtime/v1/dapr_pb";
import { AppCallback, AppCallbackAlpha } from "../../../../src/proto/dapr/proto/runtime/v1/appcallback_pb";
import { ScheduleJobRequest } from "../../../../src/proto/dapr/proto/runtime/v1/jobs_pb";
import { encodeJob } from "../../../../src/jobs/Jobs.util";
import GRPCServer from "../../../../src/implementation/Server/GRPCServer/GRPCServer";

describe("gRPC Jobs", () => {
  let client: DaprClient;
  let runtimeVersion: string;
  let metadataCalls: number;
  let calls: string[];
  let request: ScheduleJobRequest | undefined;
  let error: ConnectError | undefined;
  let headers: Headers | undefined;

  beforeEach(() => {
    runtimeVersion = "1.18.0";
    metadataCalls = 0;
    calls = [];
    request = undefined;
    error = undefined;
    jest.spyOn(connectNode, "createGrpcTransport").mockImplementation((options) =>
      createRouterTransport(
        (router) =>
          router.service(Dapr, {
            getMetadata: () => {
              metadataCalls++;
              return { runtimeVersion };
            },
            scheduleJob: (req, ctx) => {
              calls.push("schedule");
              request = req;
              headers = ctx.requestHeader;
              if (error) {
                throw error;
              }
              return {};
            },
            scheduleJobAlpha1: (req) => {
              calls.push("scheduleAlpha1");
              request = req;
              if (error) {
                throw error;
              }
              return {};
            },
            getJob: () => {
              calls.push("get");
              if (error) {
                throw error;
              }
              return { job: request?.job };
            },
            getJobAlpha1: () => {
              calls.push("getAlpha1");
              if (error) {
                throw error;
              }
              return { job: request?.job };
            },
            deleteJob: () => {
              calls.push("delete");
              if (error) {
                throw error;
              }
              return {};
            },
            deleteJobAlpha1: () => {
              calls.push("deleteAlpha1");
              if (error) {
                throw error;
              }
              return {};
            },
          }),
        { transport: { interceptors: options.interceptors } },
      ),
    );
    client = new DaprClient({ communicationProtocol: CommunicationProtocolEnum.GRPC, daprApiToken: "jobs-token" });
    (client.daprClient as GRPCClient).setIsInitialized(true);
  });

  afterEach(async () => {
    await client.stop();
    jest.restoreAllMocks();
  });

  it.each([
    ["1.16.0", "Alpha1"],
    ["1.17.0", "Alpha1"],
    ["1.18.0", ""],
  ])("uses metadata to route all RPCs on %s", async (version, suffix) => {
    runtimeVersion = version;
    await client.jobs.schedule("test", {
      dueTime: "1h",
      repeats: 0,
      data: false,
      overwrite: true,
      failurePolicy: { type: "constant", interval: "0.125s", maxRetries: 0 },
    });
    expect(request?.overwrite).toBe(true);
    expect(request?.job?.failurePolicy?.policy).toMatchObject({
      case: "constant",
      value: { maxRetries: 0, interval: { nanos: 125000000 } },
    });
    await expect(client.jobs.get("test")).resolves.toMatchObject({ name: "test", repeats: 0, data: false });
    await client.jobs.delete("test");
    expect(calls).toEqual([`schedule${suffix}`, `get${suffix}`, `delete${suffix}`]);
    expect(metadataCalls).toBe(1);
    await expect(client.metadata.get()).resolves.toMatchObject({ runtimeVersion: version });
    expect(metadataCalls).toBe(2);
  });

  it.each(["1.16.0", "1.18.0"])("round-trips immediate-retry policies on %s", async (version) => {
    runtimeVersion = version;
    for (const interval of [undefined, "0s"]) {
      for (const maxRetries of [undefined, 0, 4]) {
        await client.jobs.schedule("test", {
          dueTime: "1h",
          failurePolicy: { type: "constant", interval, maxRetries },
        });
        expect((await client.jobs.get("test")).failurePolicy).toStrictEqual({
          type: "constant",
          interval,
          maxRetries,
        });
      }
    }
  });

  it.each([
    Code.Unimplemented,
    Code.NotFound,
    Code.AlreadyExists,
    Code.Unauthenticated,
    Code.Unavailable,
    Code.Internal,
  ])("propagates code %s without retrying any mutation", async (code) => {
    error = new ConnectError("failed", code);
    await expect(client.jobs.schedule("test", { dueTime: "1h" })).rejects.toMatchObject({ code });
    await expect(client.jobs.get("test")).rejects.toMatchObject({ code });
    await expect(client.jobs.delete("test")).rejects.toMatchObject({ code });
    expect(calls).toEqual(["schedule", "get", "delete"]);
  });

  it("round-trips opaque .NET-compatible bytes and retains interceptors", async () => {
    for (const data of [Buffer.alloc(0), Buffer.from([0, 255, 128, 0])]) {
      await withBaggage({ tenant: "test" }, () => client.jobs.schedule("test", { dueTime: "1h", data }));
      expect(request?.job?.data?.typeUrl).toBe("dapr.io/schedule/jobpayload");
      expect(request?.overwrite).toBe(false);
      expect((await client.jobs.get("test")).data).toEqual(data);
      expect(headers?.get("dapr-api-token")).toBe("jobs-token");
      expect(headers?.get("baggage")).toBe("tenant=test");
    }
  });

  it("rejects absent job responses and invalid inputs", async () => {
    await expect(client.jobs.get("test")).rejects.toThrow("missing job");
    await expect(client.jobs.schedule("test", {})).rejects.toThrow();
    await expect(client.jobs.delete("")).rejects.toThrow();
    expect(calls).toEqual(["get"]);
  });

  it("validates names before metadata lookup or any Jobs RPC", async () => {
    await expect(client.jobs.schedule("a/b", { dueTime: "1h" })).rejects.toThrow(TypeError);
    await expect(client.jobs.get("")).rejects.toThrow(TypeError);
    await expect(client.jobs.delete("a?b")).rejects.toThrow(TypeError);
    expect(metadataCalls).toBe(0);
    expect(calls).toEqual([]);
  });

  it("blocks unsupported runtimes and recovers without falling back to a mutating RPC", async () => {
    runtimeVersion = "1.15.9";
    await expect(client.jobs.schedule("test", { dueTime: "1h" })).rejects.toThrow("requires Dapr runtime 1.16");
    await expect(client.jobs.get("test")).rejects.toThrow("requires Dapr runtime 1.16");
    await expect(client.jobs.delete("test")).rejects.toThrow("requires Dapr runtime 1.16");
    expect(calls).toEqual([]);
    runtimeVersion = "1.18.0";
    await expect(client.jobs.schedule("test", { dueTime: "1h" })).resolves.toBeUndefined();
    expect(calls).toEqual(["schedule"]);
    expect(metadataCalls).toBe(4);
  });
});

describe("gRPC Jobs callbacks", () => {
  const servers: DaprServer[] = [];
  afterEach(async () => {
    await Promise.all(servers.splice(0).map((server) => server.client.stop()));
  });

  const setup = () => {
    const server = new DaprServer({ communicationProtocol: CommunicationProtocolEnum.GRPC });
    servers.push(server);
    const impl = (server.daprServer as GRPCServer).getServerImpl();
    const transport = createRouterTransport((router) => {
      router.service(AppCallback, { onJobEvent: (req, ctx) => impl.onJobEventAlpha1(req, ctx) });
      router.service(AppCallbackAlpha, { onJobEventAlpha1: (req, ctx) => impl.onJobEventAlpha1(req, ctx) });
    });
    return { server, stable: createClient(AppCallback, transport), alpha: createClient(AppCallbackAlpha, transport) };
  };

  it("handles stable and Alpha1 callbacks and only acknowledges after completion", async () => {
    const { server, stable, alpha } = setup();
    const callback = jest.fn(async () => {});
    await server.jobs.listen("test", callback);
    for (const data of [null, false, 0, "", { value: 1 }, Buffer.from([0, 255])]) {
      const request = { name: "test", data: encodeJob("test", { dueTime: "1h", data }).data };
      await stable.onJobEvent(request);
      await alpha.onJobEventAlpha1(request);
      expect(callback).toHaveBeenLastCalledWith(data);
    }
    let finish!: () => void;
    await server.jobs.listen(
      "wait",
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    let acknowledged = false;
    const pending = stable.onJobEvent({ name: "wait" }).then(() => {
      acknowledged = true;
    });
    while (!finish) {
      await new Promise((resolve) => setImmediate(resolve));
    }
    expect(acknowledged).toBe(false);
    finish();
    await pending;
    expect(acknowledged).toBe(true);
  });

  it("rejects duplicate registration and returns failures for missing, failing, or malformed callbacks", async () => {
    const { server, stable, alpha } = setup();
    await server.jobs.listen("test", async () => {
      throw new Error("handler failed");
    });
    await expect(server.jobs.listen("test", async () => {})).rejects.toThrow("already registered");
    await expect(stable.onJobEvent({ name: "test" })).rejects.toMatchObject({ code: Code.Internal });
    await expect(alpha.onJobEventAlpha1({ name: "test" })).rejects.toMatchObject({ code: Code.Internal });
    await expect(stable.onJobEvent({ name: "unknown" })).rejects.toMatchObject({ code: Code.NotFound });
    const callback = jest.fn(async () => {});
    await server.jobs.listen("__proto__", callback);
    await stable.onJobEvent({ name: "__proto__" });
    expect(callback).toHaveBeenCalledWith(undefined);
    await expect(
      stable.onJobEvent({
        name: "__proto__",
        data: {
          typeUrl: "type.googleapis.com/google.protobuf.Value",
          value: Uint8Array.of(255),
        },
      }),
    ).rejects.toMatchObject({ code: Code.Internal });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid registrations without reserving the name and recovers after handler failure", async () => {
    const { server, stable, alpha } = setup();
    // @ts-expect-error Exercise JavaScript callers that omit the required callback.
    await expect(server.jobs.listen("test", undefined)).rejects.toThrow("A job callback is required");
    await expect(server.jobs.listen("a/b", async () => {})).rejects.toThrow(TypeError);
    const callback = jest
      .fn<Promise<void>, [unknown]>()
      .mockRejectedValueOnce(new Error("temporary failure"))
      .mockResolvedValue();
    await server.jobs.listen("test", callback);
    const replacement = jest.fn(async () => {});
    await expect(server.jobs.listen("test", replacement)).rejects.toThrow("already registered");
    await expect(stable.onJobEvent({ name: "test" })).rejects.toMatchObject({ code: Code.Internal });
    await expect(alpha.onJobEventAlpha1({ name: "test" })).resolves.toMatchObject({});
    expect(callback).toHaveBeenCalledTimes(2);
    expect(replacement).not.toHaveBeenCalled();
  });
});
