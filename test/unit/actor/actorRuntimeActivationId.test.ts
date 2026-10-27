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

import { DaprClient } from "../../../src";
import ActorRuntime, { supportsActivationId } from "../../../src/actors/runtime/ActorRuntime";
import DemoActorSayImpl from "../../actor/DemoActorSayImpl";

const ACTOR_TYPE = DemoActorSayImpl.name;

describe("ActorRuntime activation id gate", () => {
  let client: DaprClient;
  let runtime: ActorRuntime;
  let getMetadata: jest.SpyInstance;
  let invoke: jest.SpyInstance;
  let fireReminder: jest.SpyInstance;
  let fireTimer: jest.SpyInstance;

  beforeEach(() => {
    ActorRuntime.resetForTesting();
    client = new DaprClient({ daprHost: "127.0.0.1", daprPort: "1000" });
    runtime = ActorRuntime.getInstanceByDaprClient(client);
    runtime.registerActor(DemoActorSayImpl);
    const manager = runtime.getActorManager(ACTOR_TYPE);
    invoke = jest.spyOn(manager, "invoke").mockResolvedValue(Buffer.from(""));
    fireReminder = jest.spyOn(manager, "fireReminder").mockResolvedValue(undefined);
    fireTimer = jest.spyOn(manager, "fireTimer").mockResolvedValue(undefined);
    getMetadata = jest.spyOn(client.metadata, "get");
  });

  afterEach(() => {
    jest.restoreAllMocks();
    ActorRuntime.resetForTesting();
  });

  const version = (runtimeVersion?: string) => getMetadata.mockResolvedValue({ runtimeVersion } as any);
  const invokedWith = (call = 0) => invoke.mock.calls[call][3];

  it.each(["1.19.1", "1.19.1-rc.1", "1.19.2", "1.20.0", "2.0.0"])("honours the id on %s", async (v) => {
    version(v);
    await runtime.invoke(ACTOR_TYPE, "a", "say", undefined, "id1");
    expect(invokedWith()).toEqual("id1");
  });

  it.each(["1.19.0", "1.19.0-rc.2", "1.18.5", "0.20.0", "edge", "dev", "", undefined])(
    "ignores the id on %s",
    async (v) => {
      version(v);
      await runtime.invoke(ACTOR_TYPE, "a", "say", undefined, "id1");
      expect(invokedWith()).toBeUndefined();
    },
  );

  it("gates reminders and timers", async () => {
    version("1.19.0");
    await runtime.fireReminder(ACTOR_TYPE, "a", "r", undefined, "id1");
    await runtime.fireTimer(ACTOR_TYPE, "a", "t", undefined, "id1");
    expect(fireReminder.mock.calls[0][3]).toBeUndefined();
    expect(fireTimer.mock.calls[0][3]).toBeUndefined();
  });

  it("skips the lookup when there is no id", async () => {
    await runtime.invoke(ACTOR_TYPE, "a", "say");
    await runtime.invoke(ACTOR_TYPE, "a", "say", undefined, "");
    expect(getMetadata).not.toHaveBeenCalled();
    expect(invokedWith(1)).toEqual("");
  });

  it("caches the result", async () => {
    version("1.18.0");
    await runtime.invoke(ACTOR_TYPE, "a", "say", undefined, "id1");
    await runtime.invoke(ACTOR_TYPE, "a", "say", undefined, "id2");
    expect(getMetadata).toHaveBeenCalledTimes(1);
    expect(invokedWith(1)).toBeUndefined();
  });

  it("ignores the id when the lookup fails, then retries", async () => {
    getMetadata.mockRejectedValueOnce(new Error("sidecar down")).mockResolvedValue({ runtimeVersion: "1.19.1" } as any);
    await runtime.invoke(ACTOR_TYPE, "a", "say", undefined, "id1");
    expect(invokedWith(0)).toBeUndefined();
    await runtime.invoke(ACTOR_TYPE, "a", "say", undefined, "id2");
    expect(invokedWith(1)).toEqual("id2");
    expect(getMetadata).toHaveBeenCalledTimes(2);
  });

  it("shares one lookup between concurrent callers", async () => {
    let resolve!: (v: any) => void;
    getMetadata.mockReturnValue(new Promise((r) => (resolve = r)));
    const calls = [1, 2, 3].map((i) => runtime.invoke(ACTOR_TYPE, `a${i}`, "say", undefined, `id${i}`));
    resolve({ runtimeVersion: "1.19.1" });
    await Promise.all(calls);
    expect(getMetadata).toHaveBeenCalledTimes(1);
    expect(invoke.mock.calls.map((c) => c[3]).sort()).toEqual(["id1", "id2", "id3"]);
  });

  it("parses versions", () => {
    expect(supportsActivationId("1.19.1+build.5")).toBe(true);
    expect(supportsActivationId("v1.19.1")).toBe(false);
    expect(supportsActivationId("1.19")).toBe(false);
  });
});
