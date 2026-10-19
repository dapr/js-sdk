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
import { anyPack, BytesValueSchema, StringValueSchema } from "@bufbuild/protobuf/wkt";
import { Temporal } from "@js-temporal/polyfill";
import type { NamedActorReminderType } from "../../../src";
import ActorId from "../../../src/actors/ActorId";
import ActorClientHTTP from "../../../src/actors/client/ActorClient/ActorClientHTTP";
import ActorClientGRPC from "../../../src/actors/client/ActorClient/ActorClientGRPC";
import HTTPClient from "../../../src/implementation/Client/HTTPClient/HTTPClient";
import GRPCClient from "../../../src/implementation/Client/GRPCClient/GRPCClient";
import {
  ListActorRemindersRequestSchema,
  ListActorRemindersResponseSchema,
} from "../../../src/proto/dapr/proto/runtime/v1/actors_pb";

describe("actor reminder listing", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("HTTP", () => {
    const client = new HTTPClient({ daprHost: "127.0.0.1", daprPort: "3500" });
    const actor = new ActorClientHTTP(client);
    const actorId = new ActorId("id /?#");
    const identity = { name: "reminder", actorType: "type/name", actorID: actorId.getId() };

    it("uses the actor-scoped route with encoded identifiers and normalizes every entry", async () => {
      const data = { nested: [false, 0, "value"] };
      jest.spyOn(Temporal.Now, "instant").mockReturnValue(Temporal.Instant.from("2030-01-01T00:00:00Z"));
      const execute = jest.spyOn(client, "execute").mockResolvedValue({
        reminders: [
          { ...identity, dueTime: "1h30m", period: "@every 2m", ttl: "2030-01-01T00:05:00Z", data },
          { ...identity, name: "once" },
        ],
      });
      const result: NamedActorReminderType[] = await actor.listActorReminders("type/name", actorId);
      expect(execute).toHaveBeenCalledWith("/actors/type%2Fname/id%20%2F%3F%23/reminders");
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: identity.name,
        actorType: identity.actorType,
        actorId: identity.actorID,
        dueTime: Temporal.Duration.from({ minutes: 90 }),
        period: Temporal.Duration.from({ minutes: 2 }),
        ttl: Temporal.Duration.from({ minutes: 5 }),
        data,
      });
      expect(result[0].dueTime?.total("seconds")).toBe(5400);
      expect(result[0].period?.total("seconds")).toBe(120);
      expect(result[0].ttl?.total("seconds")).toBe(300);
      expect(result[1]).toEqual({
        name: "once",
        actorType: identity.actorType,
        actorId: identity.actorID,
        dueTime: undefined,
        period: undefined,
        ttl: undefined,
        data: undefined,
      });
    });

    it.each([false, 0, "", null, "YWJj", ["a", 1]].map((data) => [data]))(
      "preserves JSON data without guessing encodings: %j",
      async (data) => {
        jest.spyOn(client, "execute").mockResolvedValue({ reminders: [{ ...identity, data }] });
        expect((await actor.listActorReminders("type/name", actorId))[0].data).toEqual(data);
      },
    );

    it("returns an empty array when no reminders match", async () => {
      jest.spyOn(client, "execute").mockResolvedValue({ reminders: [] });
      expect(await actor.listActorReminders("type/name", actorId)).toEqual([]);
    });

    it("rejects type-wide listing before issuing an HTTP request", async () => {
      const execute = jest.spyOn(client, "execute");
      await expect(actor.listActorReminders("type/name")).rejects.toThrow("requires actorId over HTTP");
      expect(execute).not.toHaveBeenCalled();
    });

    it.each([{}, [], "not JSON", { reminders: null }, { reminders: {} }])(
      "rejects malformed list responses: %j",
      async (response) => {
        jest.spyOn(client, "execute").mockResolvedValue(response);
        await expect(actor.listActorReminders("type/name", actorId)).rejects.toThrow("expected a reminders array");
      },
    );

    it.each([null, [], {}, { ...identity, actorID: undefined }, { ...identity, name: 1 }])(
      "rejects a malformed entry instead of returning a partial list: %j",
      async (entry) => {
        jest.spyOn(client, "execute").mockResolvedValue({ reminders: [identity, entry] });
        await expect(actor.listActorReminders("type/name", actorId)).rejects.toThrow(
          "Invalid actor reminder list entry",
        );
      },
    );

    it.each(["invalid", "R3/PT1M", "0 * * * *"])("rejects unrepresentable periods: %s", async (period) => {
      jest.spyOn(client, "execute").mockResolvedValue({ reminders: [{ ...identity, period }] });
      await expect(actor.listActorReminders("type/name", actorId)).rejects.toThrow(RangeError);
    });

    it("propagates sidecar errors rather than returning an empty array", async () => {
      const error = new Error("404 unsupported endpoint");
      jest.spyOn(client, "execute").mockRejectedValue(error);
      await expect(actor.listActorReminders("type/name", actorId)).rejects.toBe(error);
    });
  });

  describe("gRPC", () => {
    const client = new GRPCClient({ daprHost: "127.0.0.1", daprPort: "50001" });
    client.setIsInitialized(true);
    const actor = new ActorClientGRPC(client);

    async function mockResponse(response = create(ListActorRemindersResponseSchema)) {
      const rpc = await client.getClient(false);
      return jest.spyOn(rpc, "listActorReminders").mockResolvedValue(response);
    }

    it.each([undefined, new ActorId("id /?#")])("preserves the optional exact actor ID filter: %s", async (actorId) => {
      const rpc = await mockResponse();
      expect(await actor.listActorReminders("type/name", actorId)).toEqual([]);
      expect(rpc).toHaveBeenCalledWith(
        create(ListActorRemindersRequestSchema, { actorType: "type/name", actorId: actorId?.getId() }),
      );
      expect(rpc.mock.calls[0][0].actorId).toBe(actorId?.getId());
    });

    it("flattens multiple actors' reminders and normalizes timings without exposing protobuf fields", async () => {
      jest.spyOn(Temporal.Now, "instant").mockReturnValue(Temporal.Instant.from("2030-01-01T00:00:00Z"));
      await mockResponse(
        create(ListActorRemindersResponseSchema, {
          reminders: [
            {
              name: "shared-name",
              reminder: {
                actorType: "type",
                actorId: "first",
                dueTime: "PT1M",
                period: "1m30s",
                ttl: "2030-01-01T00:05:00Z",
              },
            },
            { name: "shared-name", reminder: { actorType: "type", actorId: "second" } },
          ],
        }),
      );
      const result = await actor.listActorReminders("type");
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: "shared-name",
        actorType: "type",
        actorId: "first",
        dueTime: Temporal.Duration.from({ minutes: 1 }),
        period: Temporal.Duration.from({ seconds: 90 }),
        ttl: Temporal.Duration.from({ minutes: 5 }),
        data: undefined,
      });
      expect(result[0].dueTime?.total("seconds")).toBe(60);
      expect(result[0].period?.total("seconds")).toBe(90);
      expect(result[0].ttl?.total("seconds")).toBe(300);
      expect(result[1]).toEqual({
        name: "shared-name",
        actorType: "type",
        actorId: "second",
        dueTime: undefined,
        period: undefined,
        ttl: undefined,
        data: undefined,
      });
    });

    it.each([{ nested: [false, 0] }, false, 0, "", null, "YWJj", ["a", 1]].map((data) => [data]))(
      "unwraps JSON data without guessing base64 encoding: %j",
      async (data) => {
        await mockResponse(
          create(ListActorRemindersResponseSchema, {
            reminders: [
              {
                name: "reminder",
                reminder: {
                  actorType: "type",
                  actorId: "id",
                  data: anyPack(
                    BytesValueSchema,
                    create(BytesValueSchema, { value: Buffer.from(JSON.stringify(data)) }),
                  ),
                },
              },
            ],
          }),
        );
        expect((await actor.listActorReminders("type"))[0].data).toEqual(data);
      },
    );

    it("rejects an entry without its reminder", async () => {
      await mockResponse(create(ListActorRemindersResponseSchema, { reminders: [{ name: "missing" }] }));
      await expect(actor.listActorReminders("type")).rejects.toThrow("missing reminder");
    });

    it.each([
      anyPack(BytesValueSchema, create(BytesValueSchema, { value: Buffer.from("not JSON") })),
      anyPack(StringValueSchema, create(StringValueSchema, { value: "unsupported" })),
    ])("rejects malformed or unsupported data envelopes", async (data) => {
      await mockResponse(
        create(ListActorRemindersResponseSchema, {
          reminders: [{ name: "bad", reminder: { data } }],
        }),
      );
      await expect(actor.listActorReminders("type")).rejects.toThrow();
    });

    it("rejects an unrepresentable schedule", async () => {
      await mockResponse(
        create(ListActorRemindersResponseSchema, {
          reminders: [{ name: "bad", reminder: { period: "R3/PT1M" } }],
        }),
      );
      await expect(actor.listActorReminders("type")).rejects.toThrow(RangeError);
    });

    it("propagates RPC errors", async () => {
      const error = new Error("UNIMPLEMENTED");
      (await mockResponse()).mockRejectedValue(error);
      await expect(actor.listActorReminders("type")).rejects.toBe(error);
    });

    it("propagates initialization errors", async () => {
      const error = new Error("sidecar unavailable");
      jest.spyOn(client, "getClient").mockRejectedValue(error);
      await expect(actor.listActorReminders("type")).rejects.toBe(error);
    });
  });
});
