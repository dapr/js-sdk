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
import ActorId from "../../../src/actors/ActorId";
import ActorClientHTTP from "../../../src/actors/client/ActorClient/ActorClientHTTP";
import ActorClientGRPC from "../../../src/actors/client/ActorClient/ActorClientGRPC";
import HTTPClient from "../../../src/implementation/Client/HTTPClient/HTTPClient";
import GRPCClient from "../../../src/implementation/Client/GRPCClient/GRPCClient";
import {
  GetActorReminderRequestSchema,
  GetActorReminderResponseSchema,
} from "../../../src/proto/dapr/proto/runtime/v1/actors_pb";

describe("actor reminder retrieval", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("HTTP", () => {
    const client = new HTTPClient({ daprHost: "127.0.0.1", daprPort: "3500" });
    const actor = new ActorClientHTTP(client);

    it("gets and normalizes the reminder using URL-encoded identifiers", async () => {
      const data = { nested: [false, 0, "value"] };
      const execute = jest.spyOn(client, "execute").mockResolvedValue({
        dueTime: "1h30m",
        period: "PT2M",
        ttl: "5m",
        data,
      });
      const result = await actor.getActorReminder("type/name", new ActorId("id/name"), "name #?");
      expect(execute).toHaveBeenCalledWith("/actors/type%2Fname/id%2Fname/reminders/name%20%23%3F");
      expect(result.dueTime?.total("seconds")).toBe(5400);
      expect(result.period?.total("seconds")).toBe(120);
      expect(result.ttl?.total("seconds")).toBe(300);
      expect(result.data).toEqual(data);
      expect(result.period).toBeInstanceOf(Temporal.Duration);
    });

    it("preserves the legacy reminderGet raw response", async () => {
      const response = { period: "1m", ttl: "2030-01-01T00:00:00Z", data: "unchanged" };
      jest.spyOn(client, "execute").mockResolvedValue(response);
      expect(await actor.reminderGet("type", new ActorId("id"), "name")).toBe(response);
    });

    it.each([{}, { dueTime: "", period: null, ttl: "" }])("handles omitted timing fields: %j", async (response) => {
      jest.spyOn(client, "execute").mockResolvedValue(response);
      expect(await actor.getActorReminder("type", new ActorId("id"), "name")).toEqual({
        dueTime: undefined,
        period: undefined,
        ttl: undefined,
        data: undefined,
      });
    });

    it("propagates HTTP errors without returning an empty reminder", async () => {
      const error = new Error("404 reminder not found");
      jest.spyOn(client, "execute").mockRejectedValue(error);
      await expect(actor.getActorReminder("type", new ActorId("id"), "missing")).rejects.toBe(error);
    });
  });

  describe("gRPC", () => {
    const client = new GRPCClient({ daprHost: "127.0.0.1", daprPort: "50001" });
    const actor = new ActorClientGRPC(client);

    async function mockResponse(response = create(GetActorReminderResponseSchema)) {
      const rpc = await client.getClient(false);
      return jest.spyOn(rpc, "getActorReminder").mockResolvedValue(response);
    }

    it.each([{ nested: [0, false] }, "plain string", "YWJj", 0, false, null, ["a", 1]].map((data) => [data]))(
      "unwraps stored JSON data without guessing base64 encoding: %j",
      async (data) => {
        const rpc = await mockResponse(
          create(GetActorReminderResponseSchema, {
            dueTime: "PT1M",
            period: "1m30s",
            ttl: "PT5M",
            data: anyPack(
              BytesValueSchema,
              create(BytesValueSchema, {
                value: Buffer.from(JSON.stringify(data)),
              }),
            ),
          }),
        );
        const result = await actor.getActorReminder("type/name", new ActorId("id/name"), "name");
        expect(rpc).toHaveBeenCalledWith(
          create(GetActorReminderRequestSchema, {
            actorType: "type/name",
            actorId: "id/name",
            name: "name",
          }),
        );
        expect(result.data).toEqual(data);
        expect(result.dueTime?.total("seconds")).toBe(60);
        expect(result.period?.total("seconds")).toBe(90);
        expect(result.ttl?.total("seconds")).toBe(300);
      },
    );

    it("preserves absent optional fields", async () => {
      await mockResponse();
      expect(await actor.getActorReminder("type", new ActorId("id"), "name")).toEqual({
        dueTime: undefined,
        period: undefined,
        ttl: undefined,
        data: undefined,
      });
    });

    it("converts a runtime expiration timestamp to the remaining TTL", async () => {
      jest.spyOn(Temporal.Now, "instant").mockReturnValue(Temporal.Instant.from("2030-01-01T00:00:00Z"));
      await mockResponse(
        create(GetActorReminderResponseSchema, {
          ttl: "2030-01-01T00:05:00Z",
          period: "@every 1m30s",
        }),
      );
      const result = await actor.getActorReminder("type", new ActorId("id"), "name");
      expect(result.ttl?.total("seconds")).toBe(300);
      expect(result.period?.total("seconds")).toBe(90);
    });

    it("rejects invalid JSON in the data envelope", async () => {
      await mockResponse(
        create(GetActorReminderResponseSchema, {
          data: anyPack(BytesValueSchema, create(BytesValueSchema, { value: Buffer.from("invalid JSON") })),
        }),
      );
      await expect(actor.getActorReminder("type", new ActorId("id"), "name")).rejects.toThrow(SyntaxError);
    });

    it("rejects unsupported data envelopes explicitly", async () => {
      await mockResponse(
        create(GetActorReminderResponseSchema, {
          data: anyPack(StringValueSchema, create(StringValueSchema, { value: "data" })),
        }),
      );
      await expect(actor.getActorReminder("type", new ActorId("id"), "name")).rejects.toThrow(
        "Unsupported actor reminder data type",
      );
    });

    it("propagates RPC errors", async () => {
      const error = new Error("reminder not found");
      const rpc = await mockResponse();
      rpc.mockRejectedValue(error);
      await expect(actor.getActorReminder("type", new ActorId("id"), "missing")).rejects.toBe(error);
    });

    it("propagates client initialization errors", async () => {
      const error = new Error("sidecar unavailable");
      jest.spyOn(client, "getClient").mockRejectedValue(error);
      await expect(actor.getActorReminder("type", new ActorId("id"), "name")).rejects.toBe(error);
    });
  });
});
