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

import { randomUUID } from "crypto";
import { DaprClient } from "../../../src";
import ActorId from "../../../src/actors/ActorId";
import ActorManager from "../../../src/actors/runtime/ActorManager";
import DemoActorActivationIdImpl, {
  counterKey,
  deferred,
  Deferred,
  gates,
  loadHold,
  mockStateProvider,
  ReadOnActivateActor,
  resetActivationIdFixtures,
  store,
} from "../../actor/DemoActorActivationIdImpl";

const timerBody = (callback: string) => Buffer.from(JSON.stringify({ callback, data: "" }));
const reminderBody = (data: string) => Buffer.from(JSON.stringify({ data }));
const active = (m: ActorManager<any>) => m["activeActors"];

class WriteOnActivateActor extends DemoActorActivationIdImpl {
  async onActivate(): Promise<void> {
    await this.getStateManager<number>().setState("counter", (await this.read()) + 100);
  }
}

class WriteOnDeactivateActor extends ReadOnActivateActor {
  async onDeactivate(): Promise<void> {
    await super.onDeactivate();
    await this.getStateManager<number>().setState("counter", -1);
  }
}

class HeldDeactivateActor extends DemoActorActivationIdImpl {
  static hold?: { entered: Deferred; release: Deferred };

  async onDeactivate(): Promise<void> {
    await super.onDeactivate();
    const hold = HeldDeactivateActor.hold;
    if (hold) {
      HeldDeactivateActor.hold = undefined;
      hold.entered.resolve();
      await hold.release.promise;
    }
  }
}

class ThrowingDeactivateActor extends DemoActorActivationIdImpl {
  async onDeactivate(): Promise<void> {
    await super.onDeactivate();
    throw new Error("boom");
  }
}

class SavingActor extends DemoActorActivationIdImpl {
  async onDeactivate(): Promise<void> {
    await super.onDeactivate();
    await this.getStateManager<number>().setState("counter", -1);
    await this.getStateManager().saveState();
  }

  async incrAndSaveAfterGate(): Promise<number> {
    const value = await this.incrAfterGate();
    await this.getStateManager().saveState();
    return value;
  }
}

class PostOverrideActor extends DemoActorActivationIdImpl {
  static postCalls = 0;

  async onActorMethodPostInternal(beforeSave?: () => void): Promise<void> {
    PostOverrideActor.postCalls++;
    await super.onActorMethodPostInternal(beforeSave);
  }
}

describe("ActorManager activation id", () => {
  let client: DaprClient;
  let manager: ActorManager<DemoActorActivationIdImpl>;
  let actorId: ActorId;
  let created: () => DemoActorActivationIdImpl[];

  beforeAll(() => {
    client = new DaprClient({ daprHost: "127.0.0.1", daprPort: "1000" });
  });

  beforeEach(() => {
    resetActivationIdFixtures();
    mockStateProvider();
    manager = new ActorManager(DemoActorActivationIdImpl, client);
    actorId = new ActorId(randomUUID());
    created = () => DemoActorActivationIdImpl.created;
  });

  afterEach(() => {
    gates.release.resolve();
    jest.restoreAllMocks();
  });

  const otherHostWrites = (value: number) => store.set(counterKey(actorId.getId()), value);

  it("reuses the object for the same id", async () => {
    await manager.invoke(actorId, "incr", undefined, "a1");
    otherHostWrites(5);
    expect(await manager.invoke(actorId, "incr", undefined, "a1")).toEqual(2);
    expect(created()).toHaveLength(1);
    expect(created()[0].deactivations).toEqual(0);
  });

  it("builds a fresh object with fresh state for a new id", async () => {
    await manager.invoke(actorId, "incr", undefined, "a1");
    otherHostWrites(5);
    expect(await manager.invoke(actorId, "incr", undefined, "a2")).toEqual(6);
    expect(created()).toHaveLength(2);
    expect(created()[0].deactivations).toEqual(1);
    expect(active(manager).get(actorId.getId())?.actor).toBe(created()[1]);
    expect(active(manager).get(actorId.getId())?.activationId).toEqual("a2");
    expect(store.get(counterKey(actorId.getId()))).toEqual(6);
  });

  it("never resets for a missing or empty id", async () => {
    await manager.invoke(actorId, "incr", undefined, "a1");
    otherHostWrites(5);
    expect(await manager.invoke(actorId, "incr")).toEqual(2);
    expect(await manager.invoke(actorId, "incr", undefined, "")).toEqual(3);
    expect(created()).toHaveLength(1);
    expect(active(manager).get(actorId.getId())?.activationId).toEqual("a1");
  });

  it("resets when an object created without an id gets a non-empty id", async () => {
    await manager.invoke(actorId, "incr");
    expect(active(manager).get(actorId.getId())?.activationId).toEqual("");
    otherHostWrites(5);
    expect(await manager.invoke(actorId, "incr", undefined, "a1")).toEqual(6);
    expect(created()).toHaveLength(2);
    expect(created()[0].deactivations).toEqual(1);
  });

  it("resets on a reminder with a new id", async () => {
    await manager.invoke(actorId, "incr", undefined, "a1");
    otherHostWrites(5);
    await manager.fireReminder(actorId, "r", reminderBody(""), "a2");
    expect(created()).toHaveLength(2);
    expect(created()[0].deactivations).toEqual(1);
    expect(store.get(counterKey(actorId.getId()))).toEqual(6);
  });

  it("resets on a timer with a new id", async () => {
    await manager.invoke(actorId, "incr", undefined, "a1");
    otherHostWrites(5);
    await manager.fireTimer(actorId, "t", timerBody("incr"), "a2");
    expect(created()).toHaveLength(2);
    expect(created()[0].deactivations).toEqual(1);
    expect(store.get(counterKey(actorId.getId()))).toEqual(6);
  });

  it("reuses the object on reminder and timer with the same id", async () => {
    await manager.invoke(actorId, "incr", undefined, "a1");
    await manager.fireReminder(actorId, "r", reminderBody(""), "a1");
    await manager.fireTimer(actorId, "t", timerBody("incr"), "a1");
    expect(created()).toHaveLength(1);
    expect(store.get(counterKey(actorId.getId()))).toEqual(3);
  });

  it("clears tracking on DELETE", async () => {
    await manager.invoke(actorId, "incr", undefined, "a1");
    await manager.deactivateActor(actorId);
    expect(created()[0].deactivations).toEqual(1);
    expect(active(manager).has(actorId.getId())).toBe(false);

    await manager.invoke(actorId, "incr", undefined, "a1");
    expect(created()).toHaveLength(2);
    expect(created()[0].deactivations).toEqual(1);
  });

  it("still fails DELETE for an unknown actor", async () => {
    await expect(manager.deactivateActor(actorId)).rejects.toThrow("ACTOR_NOT_ACTIVATED");
  });

  it("skips the save when a timer callback throws", async () => {
    await expect(manager.fireTimer(actorId, "t", timerBody("incrThenFail"), "a1")).rejects.toThrow("callback failed");
    expect(store.has(counterKey(actorId.getId()))).toBe(false);
  });

  describe("concurrent calls with the same id", () => {
    const calls = 50;

    it("share one live object", async () => {
      await manager.invoke(actorId, "count", undefined, "a1");
      await Promise.all(Array.from({ length: calls }, () => manager.invoke(actorId, "count", undefined, "a1")));
      expect(created()).toHaveLength(1);
      expect(created()[0].calls).toEqual(calls + 1);
      expect(created()[0].deactivations).toEqual(0);
    });

    it("share one registered object when they all activate it", async () => {
      const m = new ActorManager(ReadOnActivateActor, client);
      await Promise.all(Array.from({ length: calls }, () => m.invoke(actorId, "count", undefined, "a1")));
      const registered = active(m).get(actorId.getId())?.actor;
      expect(created().length).toBeGreaterThan(1);
      expect(registered?.calls).toEqual(calls);
      expect(created().filter((a) => a !== registered && a.deactivations !== 1)).toHaveLength(0);
    });
  });

  describe("activation racing another activation", () => {
    it("fails a late activation of an older id instead of replacing the newer one", async () => {
      const m = new ActorManager(ReadOnActivateActor, client);
      otherHostWrites(10);
      loadHold.release = deferred();
      const release = loadHold.release;
      const old = m.invoke(actorId, "incr", undefined, "a1");
      await loadHold.entered.promise;

      otherHostWrites(20);
      expect(await m.invoke(actorId, "incr", undefined, "a2")).toEqual(21);

      release.resolve();
      await expect(old).rejects.toThrow("ACTOR_ACTIVATION_SUPERSEDED");
      expect(store.get(counterKey(actorId.getId()))).toEqual(21);
      expect(active(m).get(actorId.getId())?.actor).toBe(created()[1]);
      expect(active(m).get(actorId.getId())?.activationId).toEqual("a2");
      expect(created()[0].deactivations).toEqual(1);
    });

    it("does not save state written by the onActivate of a losing activation", async () => {
      const m = new ActorManager(WriteOnActivateActor, client);
      otherHostWrites(10);
      loadHold.release = deferred();
      const release = loadHold.release;
      const old = m.invoke(actorId, "incr", undefined, "a1");
      await loadHold.entered.promise;

      expect(await m.invoke(actorId, "incr", undefined, "a2")).toEqual(111);

      release.resolve();
      await expect(old).rejects.toThrow("ACTOR_ACTIVATION_SUPERSEDED");
      expect(store.get(counterKey(actorId.getId()))).toEqual(111);
    });

    it("does not save state written by the onDeactivate of a losing activation", async () => {
      const m = new ActorManager(WriteOnDeactivateActor, client);
      otherHostWrites(10);
      loadHold.release = deferred();
      const release = loadHold.release;
      const old = m.invoke(actorId, "incr", undefined, "a1");
      await loadHold.entered.promise;

      expect(await m.invoke(actorId, "incr", undefined, "a2")).toEqual(11);

      release.resolve();
      await expect(old).rejects.toThrow("ACTOR_ACTIVATION_SUPERSEDED");
      expect(created()[0].deactivations).toEqual(1);
      expect(store.get(counterKey(actorId.getId()))).toEqual(11);
    });

    it("does not save state written by the onDeactivate of a replaced object", async () => {
      const m = new ActorManager(WriteOnDeactivateActor, client);
      otherHostWrites(10);
      expect(await m.invoke(actorId, "incr", undefined, "a1")).toEqual(11);
      otherHostWrites(20);

      expect(await m.invoke(actorId, "incr", undefined, "a2")).toEqual(21);
      expect(created()[0].deactivations).toEqual(1);
      expect(store.get(counterKey(actorId.getId()))).toEqual(21);
    });

    it("shares one object between concurrent first activations with the same id", async () => {
      const m = new ActorManager(ReadOnActivateActor, client);
      loadHold.release = deferred();
      const release = loadHold.release;
      const first = m.invoke(actorId, "incr", undefined, "a1");
      await loadHold.entered.promise;
      expect(await m.invoke(actorId, "incr", undefined, "a1")).toEqual(1);

      release.resolve();
      expect(await first).toEqual(2);
      expect(created()).toHaveLength(2);
      expect(created()[0].deactivations).toEqual(1);
      expect(active(m).get(actorId.getId())?.actor).toBe(created()[1]);
    });

    it("does not hand an object of another activation to a call that reset the stale one", async () => {
      const m = new ActorManager(HeldDeactivateActor, client);
      await m.invoke(actorId, "incr", undefined, "a1");

      HeldDeactivateActor.hold = { entered: deferred(), release: deferred() };
      const hold = HeldDeactivateActor.hold;
      const resetting = m.invoke(actorId, "incr", undefined, "a2");
      await hold.entered.promise;

      const other = m.invoke(actorId, "incrAfterGate", undefined, "a1");
      await gates.entered.promise;

      hold.release.resolve();
      await expect(resetting).rejects.toThrow("ACTOR_ACTIVATION_SUPERSEDED");

      gates.release.resolve();
      expect(await other).toEqual(2);
      expect(store.get(counterKey(actorId.getId()))).toEqual(2);
      expect(active(m).get(actorId.getId())?.actor).toBe(created()[1]);
      expect(created()).toHaveLength(3);
      expect(created()[2].deactivations).toEqual(1);
    });
  });

  describe("onDeactivate throwing", () => {
    it("does not fail the first call with a new id", async () => {
      const m = new ActorManager(ThrowingDeactivateActor, client);
      await m.invoke(actorId, "incr", undefined, "a1");
      otherHostWrites(5);
      expect(await m.invoke(actorId, "incr", undefined, "a2")).toEqual(6);
      expect(created()[0].deactivations).toEqual(1);
      expect(active(m).get(actorId.getId())?.activationId).toEqual("a2");
    });

    it("still fails DELETE", async () => {
      const m = new ActorManager(ThrowingDeactivateActor, client);
      await m.invoke(actorId, "incr", undefined, "a1");
      await expect(m.deactivateActor(actorId)).rejects.toThrow("boom");
      expect(active(m).has(actorId.getId())).toBe(false);
    });
  });

  it("calls an overridden onActorMethodPostInternal", async () => {
    PostOverrideActor.postCalls = 0;
    const m = new ActorManager(PostOverrideActor, client);
    expect(await m.invoke(actorId, "incr", undefined, "a1")).toEqual(1);
    expect(PostOverrideActor.postCalls).toEqual(1);
    expect(store.get(counterKey(actorId.getId()))).toEqual(1);
  });

  describe("replaced object saving on its own", () => {
    it("refuses the save from onDeactivate, DELETE still saves", async () => {
      const m = new ActorManager(SavingActor, client);
      await m.invoke(actorId, "incr", undefined, "a1");
      otherHostWrites(5);
      expect(await m.invoke(actorId, "incr", undefined, "a2")).toEqual(6);
      expect(created()[0].deactivations).toEqual(1);
      expect(store.get(counterKey(actorId.getId()))).toEqual(6);

      await m.deactivateActor(actorId);
      expect(store.get(counterKey(actorId.getId()))).toEqual(-1);
    });

    it("refuses an explicit save from a call still running", async () => {
      const m = new ActorManager(SavingActor, client);
      otherHostWrites(1);
      const old = m.invoke(actorId, "incrAndSaveAfterGate", undefined, "a1");
      await gates.entered.promise;
      otherHostWrites(5);
      expect(await m.invoke(actorId, "incr", undefined, "a2")).toEqual(6);
      gates.release.resolve();
      await expect(old).rejects.toThrow("ACTOR_REPLACED");
      expect(store.get(counterKey(actorId.getId()))).toEqual(6);
    });
  });

  describe("call still running on a replaced object", () => {
    const runReplaced = async (startOld: () => Promise<unknown>) => {
      otherHostWrites(1);
      const old = startOld();
      await gates.entered.promise;
      otherHostWrites(5);
      expect(await manager.invoke(actorId, "incr", undefined, "a2")).toEqual(6);
      gates.release.resolve();
      const err = await old.then(
        () => undefined,
        (e: Error) => e,
      );
      expect(store.get(counterKey(actorId.getId()))).toEqual(6);
      expect(err?.message).toContain("ACTOR_DEACTIVATED_DURING_CALL");
      expect(created()).toHaveLength(2);
    };

    it("skips the save for a method", async () => {
      await runReplaced(() => manager.invoke(actorId, "incrAfterGate", undefined, "a1"));
    });

    it("skips the save for a timer", async () => {
      await runReplaced(() => manager.fireTimer(actorId, "t", timerBody("incrAfterGate"), "a1"));
    });

    it("skips the save for a reminder", async () => {
      await runReplaced(() => manager.fireReminder(actorId, "r", reminderBody("gate"), "a1"));
    });

    it("skips the save after a DELETE", async () => {
      otherHostWrites(1);
      const old = manager.invoke(actorId, "incrAfterGate", undefined, "a1");
      await gates.entered.promise;
      await manager.deactivateActor(actorId);
      gates.release.resolve();
      const err = await old.then(
        () => undefined,
        (e: Error) => e,
      );
      expect(store.get(counterKey(actorId.getId()))).toEqual(1);
      expect(err?.message).toContain("ACTOR_DEACTIVATED_DURING_CALL");
    });

    it("still saves when the other call has no id", async () => {
      otherHostWrites(1);
      const old = manager.invoke(actorId, "incrAfterGate", undefined, "a1");
      await gates.entered.promise;
      await manager.invoke(actorId, "read");
      gates.release.resolve();
      expect(await old).toEqual(2);
      expect(store.get(counterKey(actorId.getId()))).toEqual(2);
      expect(created()).toHaveLength(1);
    });
  });
});
