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
import { EmptySchema } from "@bufbuild/protobuf/wkt";
import ActorId from "../../../src/actors/ActorId";
import ActorClientGRPC from "../../../src/actors/client/ActorClient/ActorClientGRPC";
import GRPCClient from "../../../src/implementation/Client/GRPCClient/GRPCClient";

describe("actor state transaction over gRPC", () => {
  afterEach(() => jest.restoreAllMocks());

  const client = new GRPCClient({ daprHost: "127.0.0.1", daprPort: "50001" });
  client.setIsInitialized(true);
  const actor = new ActorClientGRPC(client);

  it("forwards per-operation metadata and defaults it to empty", async () => {
    const rpc = await client.getClient(false);
    const execute = jest.spyOn(rpc, "executeActorStateTransaction").mockResolvedValue(create(EmptySchema));

    await actor.stateTransaction("type", new ActorId("id"), [
      { operation: "upsert", request: { key: "ttl", value: "a", metadata: { ttlInSeconds: "60" } } },
      { operation: "upsert", request: { key: "plain", value: "b" } },
      { operation: "delete", request: { key: "gone" } },
    ]);

    expect(execute).toHaveBeenCalledTimes(1);
    const request = execute.mock.calls[0][0] as any;
    expect(request.actorType).toBe("type");
    expect(request.actorId).toBe("id");
    expect(request.operations.map((o: any) => [o.operationType, o.key, o.metadata])).toEqual([
      ["upsert", "ttl", { ttlInSeconds: "60" }],
      ["upsert", "plain", {}],
      ["delete", "gone", {}],
    ]);
    expect(Buffer.from(request.operations[0].value.value).toString()).toBe("a");
  });
});
