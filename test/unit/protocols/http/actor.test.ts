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

import * as http from "http";
import { AddressInfo } from "net";
import { randomUUID } from "crypto";
import { DaprClient } from "../../../../src";
import CommunicationProtocolEnum from "../../../../src/enum/CommunicationProtocol.enum";
import ActorRuntime from "../../../../src/actors/runtime/ActorRuntime";
import HTTPServer from "../../../../src/implementation/Server/HTTPServer/HTTPServer";
import HTTPServerActor, { ACTOR_ACTIVATION_ID_HEADER } from "../../../../src/implementation/Server/HTTPServer/actor";
import DemoActorActivationIdImpl, {
  counterKey,
  gates,
  mockStateProvider,
  resetActivationIdFixtures,
  store,
} from "../../../actor/DemoActorActivationIdImpl";

const ACTOR_TYPE = DemoActorActivationIdImpl.name;

describe("HTTPServerActor activation id", () => {
  let client: DaprClient;
  let listener: http.Server;
  let baseUrl: string;
  let actorId: string;

  beforeAll(async () => {
    ActorRuntime.resetForTesting();
    client = new DaprClient({ daprHost: "127.0.0.1", daprPort: "1000" });
    const server = new HTTPServer(client, {
      serverHost: "127.0.0.1",
      serverPort: "0",
      communicationProtocol: CommunicationProtocolEnum.HTTP,
    });
    await new HTTPServerActor(server, client).init();
    listener = server.getServer().listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => listener.once("listening", () => resolve()));
    baseUrl = `http://127.0.0.1:${(listener.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => listener.close(() => resolve()));
    ActorRuntime.resetForTesting();
  });

  beforeEach(() => {
    resetActivationIdFixtures();
    mockStateProvider();
    const runtime = ActorRuntime.getInstance(client.daprClient);
    runtime.clearActorManagers();
    runtime.registerActor(DemoActorActivationIdImpl);
    actorId = randomUUID();
  });

  afterEach(() => {
    gates.release.resolve();
    jest.restoreAllMocks();
  });

  const manager = () => ActorRuntime.getInstance(client.daprClient).getActorManager(ACTOR_TYPE);
  const created = () => DemoActorActivationIdImpl.created;
  const otherHostWrites = (value: number) => store.set(counterKey(actorId), value);
  const stored = () => store.get(counterKey(actorId));

  const put = async (path: string, activationId?: string, headerName = ACTOR_ACTIVATION_ID_HEADER, body?: object) => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (activationId !== undefined) {
      headers[headerName] = activationId;
    }
    const res = await fetch(`${baseUrl}/actors/${ACTOR_TYPE}/${actorId}/${path}`, {
      method: "PUT",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, text: await res.text() };
  };
  const method = (name: string, activationId?: string, headerName?: string) =>
    put(`method/${name}`, activationId, headerName);
  const timer = (callback: string, activationId?: string) =>
    put("method/timer/t", activationId, undefined, { callback, data: "" });
  const reminder = (data: string, activationId?: string) => put("method/remind/r", activationId, undefined, { data });

  it.each(["dapr-actor-activation-id", "DAPR-ACTOR-ACTIVATION-ID", ACTOR_ACTIVATION_ID_HEADER])(
    "reads the header as %s",
    async (headerName) => {
      expect(await method("incr", "a1", headerName)).toEqual({ status: 200, text: "1" });
      expect(manager().activationIds.get(actorId)).toEqual("a1");
    },
  );

  it("reuses the object for the same id", async () => {
    await method("incr", "a1");
    otherHostWrites(5);
    expect(await method("incr", "a1")).toEqual({ status: 200, text: "2" });
    expect(created()).toHaveLength(1);
  });

  it("resets a method call with a new id", async () => {
    await method("incr", "a1");
    otherHostWrites(5);
    expect(await method("incr", "a2")).toEqual({ status: 200, text: "6" });
    expect(created()).toHaveLength(2);
    expect(created()[0].deactivations).toEqual(1);
    expect(manager().activationIds.get(actorId)).toEqual("a2");
  });

  it("does not reset without the header", async () => {
    await method("incr", "a1");
    otherHostWrites(5);
    expect(await method("incr")).toEqual({ status: 200, text: "2" });
    expect(created()).toHaveLength(1);
    expect(manager().activationIds.get(actorId)).toEqual("a1");
  });

  it("stores an empty id when the header is missing and resets on a later id", async () => {
    await method("incr");
    expect(manager().activationIds.get(actorId)).toEqual("");
    otherHostWrites(5);
    expect(await method("incr", "a1")).toEqual({ status: 200, text: "6" });
    expect(created()).toHaveLength(2);
  });

  it("resets a timer with a new id", async () => {
    await method("incr", "a1");
    otherHostWrites(5);
    expect((await timer("incr", "a2")).status).toEqual(200);
    expect(created()).toHaveLength(2);
    expect(stored()).toEqual(6);
  });

  it("resets a reminder with a new id", async () => {
    await method("incr", "a1");
    otherHostWrites(5);
    expect((await reminder("", "a2")).status).toEqual(200);
    expect(created()).toHaveLength(2);
    expect(stored()).toEqual(6);
  });

  it("clears tracking on DELETE", async () => {
    await method("incr", "a1");
    const res = await fetch(`${baseUrl}/actors/${ACTOR_TYPE}/${actorId}`, { method: "DELETE" });
    expect(res.status).toEqual(200);
    expect(created()[0].deactivations).toEqual(1);
    expect(manager().actors.has(actorId)).toBe(false);
    expect(manager().activationIds.has(actorId)).toBe(false);
  });

  it("returns 404 on DELETE of an actor that is not active", async () => {
    const res = await fetch(`${baseUrl}/actors/${ACTOR_TYPE}/${actorId}`, {
      method: "DELETE",
      signal: AbortSignal.timeout(2000),
    });
    expect(res.status).toEqual(404);
    expect(await res.text()).toContain("ACTOR_NOT_ACTIVATED");
  });

  it.each([
    ["method", () => method("incrAfterGate", "a1")],
    ["timer", () => timer("incrAfterGate", "a1")],
    ["reminder", () => reminder("gate", "a1")],
  ])("returns 500 and skips the save for a %s still running on a replaced object", async (_kind, startOld) => {
    otherHostWrites(1);
    const old = startOld();
    await gates.entered.promise;
    otherHostWrites(5);
    expect(await method("incr", "a2")).toEqual({ status: 200, text: "6" });
    gates.release.resolve();
    const res = await old;
    expect(stored()).toEqual(6);
    expect(res.status).toEqual(500);
    expect(res.text).toContain("ACTOR_DEACTIVATED_DURING_CALL");
  });
});
