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

import { create } from "@bufbuild/protobuf";
import { Code, ConnectError, createClient, createRouterTransport } from "@connectrpc/connect";
import { CommunicationProtocolEnum, GRPCClient } from "../../../../src";
import GRPCClientMetadata from "../../../../src/implementation/Client/GRPCClient/metadata";
import { Dapr } from "../../../../src/proto/dapr/proto/runtime/v1/dapr_pb";
import {
  GetMetadataRequest,
  GetMetadataResponseSchema,
  SetMetadataRequest,
} from "../../../../src/proto/dapr/proto/runtime/v1/metadata_pb";

describe("grpc/metadata", () => {
  const setup = () => {
    const response = create(GetMetadataResponseSchema, {
      id: "test-app",
      runtimeVersion: "1.18.0",
      activeActorsCount: [
        { type: "Counter", count: 2 },
        { type: "Empty", count: 0 },
      ],
      registeredComponents: [
        { name: "state", type: "state.redis", version: "v1", capabilities: ["ETAG", "TRANSACTIONAL"] },
        { name: "pubsub", type: "pubsub.redis", version: "v1", capabilities: [] },
      ],
      extendedMetadata: { deployment: "test", empty: "" },
    });
    const get = jest.fn(async (_request: GetMetadataRequest) => response);
    const set = jest.fn(async (_request: SetMetadataRequest) => ({}));
    const rpc = createClient(
      Dapr,
      createRouterTransport((router) =>
        router.service(Dapr, {
          getMetadata: get,
          setMetadata: set,
        }),
      ),
    );
    const client = new GRPCClient({ communicationProtocol: CommunicationProtocolEnum.GRPC });
    const getClient = jest.spyOn(client, "getClient").mockResolvedValue(rpc);
    return { metadata: new GRPCClientMetadata(client), response, get, set, getClient };
  };

  afterEach(() => jest.restoreAllMocks());

  it("maps protobuf metadata into the public response and keeps get fresh", async () => {
    const { metadata, response, get } = setup();
    await expect(metadata.get()).resolves.toEqual({
      id: "test-app",
      runtimeVersion: "1.18.0",
      actors: [
        { type: "Counter", count: 2 },
        { type: "Empty", count: 0 },
      ],
      components: [
        { name: "state", type: "state.redis", version: "v1", capabilities: ["ETAG", "TRANSACTIONAL"] },
        { name: "pubsub", type: "pubsub.redis", version: "v1", capabilities: [] },
      ],
      extended: { deployment: "test", empty: "" },
    });
    response.extendedMetadata.deployment = "updated";
    await expect(metadata.get()).resolves.toMatchObject({ extended: { deployment: "updated" } });
    expect(get).toHaveBeenCalledTimes(2);
    expect(get.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        $typeName: "dapr.proto.runtime.v1.GetMetadataRequest",
      }),
    );
  });

  it("returns empty collections for protobuf defaults", async () => {
    const { metadata, get } = setup();
    get.mockResolvedValue(create(GetMetadataResponseSchema));
    await expect(metadata.get()).resolves.toEqual({
      id: "",
      runtimeVersion: "",
      actors: [],
      components: [],
      extended: {},
    });
  });

  it.each(["value", ""])("writes the exact key/value and reports success for %j", async (value) => {
    const { metadata, set } = setup();
    await expect(metadata.set("deployment", value)).resolves.toBe(true);
    expect(set).toHaveBeenCalledTimes(1);
    expect(set.mock.calls[0][0]).toEqual(expect.objectContaining({ key: "deployment", value }));
  });

  it("preserves the gRPC set failure contract while propagating get failures", async () => {
    const { metadata, get, set } = setup();
    const error = new ConnectError("unavailable", Code.Unavailable);
    get.mockRejectedValue(error);
    set.mockRejectedValue(error);
    await expect(metadata.get()).rejects.toMatchObject({ code: Code.Unavailable });
    await expect(metadata.set("deployment", "test")).resolves.toBe(false);
    expect(get).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledTimes(1);
  });

  it("propagates client initialization errors for both operations", async () => {
    const { metadata, getClient, get, set } = setup();
    const error = new Error("initialization failed");
    getClient.mockRejectedValue(error);
    await expect(metadata.get()).rejects.toBe(error);
    await expect(metadata.set("deployment", "test")).rejects.toBe(error);
    expect(get).not.toHaveBeenCalled();
    expect(set).not.toHaveBeenCalled();
  });

  it("retries failed version lookups, shares pending requests, and does not cache public metadata", async () => {
    const { metadata, get, response } = setup();
    get.mockRejectedValueOnce(new ConnectError("unavailable", Code.Unavailable));
    const failed = metadata.getJobsApiVersion();
    expect(metadata.getJobsApiVersion()).toBe(failed);
    await expect(failed).rejects.toMatchObject({ code: Code.Unavailable });
    response.runtimeVersion = "1.18.0-rc.1";
    const pending = metadata.getJobsApiVersion();
    expect(metadata.getJobsApiVersion()).toBe(pending);
    await expect(pending).resolves.toBe("v1.0-alpha1");
    response.runtimeVersion = "1.18.0";
    await expect(metadata.get()).resolves.toMatchObject({ runtimeVersion: "1.18.0" });
    expect(metadata.getJobsApiVersion()).toBe(pending);
    expect(get).toHaveBeenCalledTimes(3);
  });
});
