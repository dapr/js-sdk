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

function flush(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

function watch<T>(promise: Promise<T>): { promise: Promise<T>; settled: () => boolean } {
  let done = false;
  const observed = promise.then(
    (value) => {
      done = true;
      return value;
    },
    (error) => {
      done = true;
      throw error;
    },
  );
  return { promise: observed, settled: () => done };
}

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

class SaveOnActivateActor extends DemoActorActivationIdImpl {
  async onActivate(): Promise<void> {
    await this.getStateManager<number>().setState("counter", (await this.read()) + 100);
    await this.getStateManager().saveState();
  }
}

class ExplicitSaveActor extends DemoActorActivationIdImpl {
  async incrAndSaveAfterGate(): Promise<number> {
    const value = await this.incrAfterGate();
    await this.getStateManager().saveState();
    return value;
  }
}

class HeldReadOnActivateActor extends HeldDeactivateActor {
  async onActivate(): Promise<void> {
    await this.read();
  }
}

class HeldSaveOnDeactivateActor extends DemoActorActivationIdImpl {
  static hold?: { entered: Deferred; release: Deferred };

  async onDeactivate(): Promise<void> {
    await super.onDeactivate();
    const hold = HeldSaveOnDeactivateActor.hold;
    if (hold) {
      HeldSaveOnDeactivateActor.hold = undefined;
      hold.entered.resolve();
      await hold.release.promise;
    }
    await this.getStateManager<number>().setState("counter", -1);
    await this.getStateManager().saveState();
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

    it("activate one object when concurrent first calls share an id", async () => {
      const m = new ActorManager(ReadOnActivateActor, client);
      await Promise.all(Array.from({ length: calls }, () => m.invoke(actorId, "count", undefined, "a1")));
      const registered = active(m).get(actorId.getId())?.actor;
      expect(created()).toHaveLength(1);
      expect(registered?.calls).toEqual(calls);
      expect(created()[0]).toBe(registered);
    });
  });

  describe("activation racing another activation", () => {
    it("fails a late activation of an older id instead of replacing the newer one", async () => {
      const m = new ActorManager(ReadOnActivateActor, client);
      otherHostWrites(10);
      loadHold.release = deferred();
      const release = loadHold.release;
      const old = watch(m.invoke(actorId, "incr", undefined, "a1"));
      await loadHold.entered.promise;

      otherHostWrites(20);
      const replacing = watch(m.invoke(actorId, "incr", undefined, "a2"));
      await flush();
      // a2 has detached a1 and is waiting on the turn. onDeactivate has not started.
      expect(replacing.settled()).toBe(false);
      expect(created()).toHaveLength(1);
      expect(created()[0].deactivations).toEqual(0);
      expect(active(m).has(actorId.getId())).toBe(false);
      expect(m.turnLockSize()).toBeGreaterThan(0);

      release.resolve();
      await expect(old.promise).rejects.toThrow("ACTOR_ACTIVATION_SUPERSEDED");
      expect(await replacing.promise).toEqual(21);
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
      const old = watch(m.invoke(actorId, "incr", undefined, "a1"));
      await loadHold.entered.promise;

      const replacing = watch(m.invoke(actorId, "incr", undefined, "a2"));
      await flush();
      expect(replacing.settled()).toBe(false);
      expect(store.get(counterKey(actorId.getId()))).toEqual(10);
      expect(m.turnLockSize()).toBeGreaterThan(0);

      release.resolve();
      await expect(old.promise).rejects.toThrow("ACTOR_ACTIVATION_SUPERSEDED");
      expect(await replacing.promise).toEqual(111);
      expect(store.get(counterKey(actorId.getId()))).toEqual(111);
      expect(created()[0].deactivations).toEqual(1);
    });

    it("does not save state written by the onDeactivate of a losing activation", async () => {
      const m = new ActorManager(WriteOnDeactivateActor, client);
      otherHostWrites(10);
      loadHold.release = deferred();
      const release = loadHold.release;
      const old = watch(m.invoke(actorId, "incr", undefined, "a1"));
      await loadHold.entered.promise;

      const replacing = watch(m.invoke(actorId, "incr", undefined, "a2"));
      await flush();
      expect(replacing.settled()).toBe(false);
      expect(created()[0].deactivations).toEqual(0);

      release.resolve();
      await expect(old.promise).rejects.toThrow("ACTOR_ACTIVATION_SUPERSEDED");
      expect(await replacing.promise).toEqual(11);
      expect(created()[0].deactivations).toEqual(1);
      // onDeactivate writes -1, and that save is refused because the object was discarded.
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

    it("activates one object when a second same-id call arrives during onActivate", async () => {
      const m = new ActorManager(ReadOnActivateActor, client);
      loadHold.release = deferred();
      const release = loadHold.release;
      const first = watch(m.invoke(actorId, "incr", undefined, "a1"));
      await loadHold.entered.promise;
      const second = watch(m.invoke(actorId, "incr", undefined, "a1"));
      await flush();
      expect(second.settled()).toBe(false);
      expect(created()).toHaveLength(1);

      release.resolve();
      expect(await first.promise).toEqual(1);
      expect(await second.promise).toEqual(2);
      expect(created()).toHaveLength(1);
      expect(created()[0].deactivations).toEqual(0);
      expect(active(m).get(actorId.getId())?.actor).toBe(created()[0]);
    });

    it("does not run another call until a stale-object reset finishes deactivating", async () => {
      const m = new ActorManager(HeldDeactivateActor, client);
      await m.invoke(actorId, "incr", undefined, "a1");

      HeldDeactivateActor.hold = { entered: deferred(), release: deferred() };
      const hold = HeldDeactivateActor.hold;
      const resetting = watch(m.invoke(actorId, "incr", undefined, "a2"));
      await hold.entered.promise;

      const other = watch(m.invoke(actorId, "incr", undefined, "a1"));
      await flush();
      expect(other.settled()).toBe(false);
      expect(resetting.settled()).toBe(false);
      expect(active(m).has(actorId.getId())).toBe(false);
      expect(m.turnLockSize()).toBeGreaterThan(0);

      hold.release.resolve();
      // a1 was admitted while a2 still owned the turn, so a2 must not activate and evict it.
      await expect(resetting.promise).rejects.toThrow("ACTOR_ACTIVATION_SUPERSEDED");
      expect(await other.promise).toEqual(2);
      expect(store.get(counterKey(actorId.getId()))).toEqual(2);
      expect(active(m).get(actorId.getId())?.actor).toBe(created()[1]);
      expect(active(m).get(actorId.getId())?.activationId).toEqual("a1");
      expect(created()).toHaveLength(2);
      expect(created()[0].deactivations).toEqual(1);
    });
  });

  describe("object that lost ownership saving on its own", () => {
    it("refuses an explicit save in onActivate of a losing activation", async () => {
      const m = new ActorManager(SaveOnActivateActor, client);
      otherHostWrites(10);
      loadHold.release = deferred();
      const release = loadHold.release;
      const old = watch(m.invoke(actorId, "incr", undefined, "a1"));
      await loadHold.entered.promise;

      const replacing = watch(m.invoke(actorId, "incr", undefined, "a2"));
      await flush();
      expect(replacing.settled()).toBe(false);
      expect(store.get(counterKey(actorId.getId()))).toEqual(10);
      expect(m.turnLockSize()).toBeGreaterThan(0);

      release.resolve();
      await expect(old.promise).rejects.toThrow("ACTOR_REPLACED");
      expect(await replacing.promise).toEqual(111);
      expect(store.get(counterKey(actorId.getId()))).toEqual(111);
      expect(active(m).get(actorId.getId())?.actor).toBe(created()[1]);
    });

    it("fails a late activation after the newer one was removed", async () => {
      const m = new ActorManager(ReadOnActivateActor, client);
      otherHostWrites(10);
      loadHold.release = deferred();
      const release = loadHold.release;
      const old = watch(m.invoke(actorId, "incr", undefined, "a1"));
      await loadHold.entered.promise;

      otherHostWrites(20);
      const replacing = watch(m.invoke(actorId, "incr", undefined, "a2"));
      const deleting = watch(m.deactivateActor(actorId));
      await flush();
      expect(replacing.settled()).toBe(false);
      expect(deleting.settled()).toBe(false);
      expect(m.turnLockSize()).toBeGreaterThan(0);

      release.resolve();
      await expect(old.promise).rejects.toThrow("ACTOR_ACTIVATION_SUPERSEDED");
      expect(await replacing.promise).toEqual(21);
      await deleting.promise;
      expect(store.get(counterKey(actorId.getId()))).toEqual(21);
      expect(active(m).has(actorId.getId())).toBe(false);
      expect(created()[0].deactivations).toEqual(1);
    });

    it("runs queued same-id calls on the single object activated under the lock", async () => {
      const m = new ActorManager(HeldReadOnActivateActor, client);
      loadHold.release = deferred();
      const release = loadHold.release;
      const first = watch(m.invoke(actorId, "count", undefined, "a1"));
      await loadHold.entered.promise;
      const second = watch(m.invoke(actorId, "count", undefined, "a1"));
      await flush();
      expect(second.settled()).toBe(false);
      expect(created()).toHaveLength(1);

      release.resolve();
      await first.promise;
      await second.promise;
      expect(created()).toHaveLength(1);
      expect(created()[0].calls).toEqual(2);
      expect(created()[0].deactivations).toEqual(0);
      expect(active(m).get(actorId.getId())?.actor).toBe(created()[0]);
    });

    it("refuses an explicit save from a call still running after DELETE and a new activation", async () => {
      const m = new ActorManager(ExplicitSaveActor, client);
      otherHostWrites(1);
      const old = watch(m.invoke(actorId, "incrAndSaveAfterGate", undefined, "a1"));
      await gates.entered.promise;
      otherHostWrites(5);
      const deleting = watch(m.deactivateActor(actorId));
      const replacing = watch(m.invoke(actorId, "incr", undefined, "a2"));
      await flush();
      expect(active(m).has(actorId.getId())).toBe(false);
      expect(deleting.settled()).toBe(false);
      expect(replacing.settled()).toBe(false);
      expect(m.turnLockSize()).toBeGreaterThan(0);
      expect(store.get(counterKey(actorId.getId()))).toEqual(5);

      gates.release.resolve();
      await expect(old.promise).rejects.toThrow("ACTOR_REPLACED");
      await deleting.promise;
      expect(await replacing.promise).toEqual(6);
      expect(store.get(counterKey(actorId.getId()))).toEqual(6);
    });

    it("refuses an explicit save from an onDeactivate that a new activation supersedes", async () => {
      const m = new ActorManager(HeldSaveOnDeactivateActor, client);
      expect(await m.invoke(actorId, "incr", undefined, "a1")).toEqual(1);

      HeldSaveOnDeactivateActor.hold = { entered: deferred(), release: deferred() };
      const hold = HeldSaveOnDeactivateActor.hold;
      const deleting = watch(m.deactivateActor(actorId));
      await hold.entered.promise;

      const replacing = watch(m.invoke(actorId, "incr", undefined, "a2"));
      await flush();
      expect(replacing.settled()).toBe(false);
      expect(deleting.settled()).toBe(false);
      expect(m.turnLockSize()).toBeGreaterThan(0);

      hold.release.resolve();
      await expect(deleting.promise).rejects.toThrow("ACTOR_REPLACED");
      expect(await replacing.promise).toEqual(2);
      expect(store.get(counterKey(actorId.getId()))).toEqual(2);
    });

    it("still saves from onDeactivate on DELETE", async () => {
      const m = new ActorManager(HeldSaveOnDeactivateActor, client);
      await m.invoke(actorId, "incr", undefined, "a1");
      await m.deactivateActor(actorId);
      expect(store.get(counterKey(actorId.getId()))).toEqual(-1);
      expect(m["owners"].has(actorId.getId())).toBe(false);
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
      const old = watch(m.invoke(actorId, "incrAndSaveAfterGate", undefined, "a1"));
      await gates.entered.promise;
      otherHostWrites(5);
      const replacing = watch(m.invoke(actorId, "incr", undefined, "a2"));
      await flush();
      expect(replacing.settled()).toBe(false);
      expect(active(m).has(actorId.getId())).toBe(false);
      expect(created()[0].deactivations).toEqual(0);
      expect(m.turnLockSize()).toBeGreaterThan(0);
      expect(store.get(counterKey(actorId.getId()))).toEqual(5);

      gates.release.resolve();
      await expect(old.promise).rejects.toThrow("ACTOR_REPLACED");
      expect(await replacing.promise).toEqual(6);
      expect(store.get(counterKey(actorId.getId()))).toEqual(6);
      expect(created()).toHaveLength(2);
      expect(created()[0].deactivations).toEqual(1);
    });
  });

  describe("call still running on a replaced object", () => {
    const runReplaced = async (startOld: () => Promise<unknown>) => {
      otherHostWrites(1);
      const old = watch(startOld());
      await gates.entered.promise;
      otherHostWrites(5);
      const replacing = watch(manager.invoke(actorId, "incr", undefined, "a2"));
      await flush();
      expect(replacing.settled()).toBe(false);
      expect(active(manager).has(actorId.getId())).toBe(false);
      expect(created()).toHaveLength(1);
      expect(created()[0].deactivations).toEqual(0);
      expect(manager.turnLockSize()).toBeGreaterThan(0);

      gates.release.resolve();
      await expect(old.promise).rejects.toThrow("ACTOR_DEACTIVATED_DURING_CALL");
      expect(await replacing.promise).toEqual(6);
      expect(store.get(counterKey(actorId.getId()))).toEqual(6);
      expect(created()).toHaveLength(2);
      expect(created()[0].deactivations).toEqual(1);
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
      const old = watch(manager.invoke(actorId, "incrAfterGate", undefined, "a1"));
      await gates.entered.promise;
      const deleting = watch(manager.deactivateActor(actorId));
      await flush();
      expect(deleting.settled()).toBe(false);
      expect(active(manager).has(actorId.getId())).toBe(false);
      expect(manager.turnLockSize()).toBeGreaterThan(0);

      gates.release.resolve();
      await expect(old.promise).rejects.toThrow("ACTOR_DEACTIVATED_DURING_CALL");
      await deleting.promise;
      expect(store.get(counterKey(actorId.getId()))).toEqual(1);
      expect(active(manager).has(actorId.getId())).toBe(false);
    });

    it("still saves when the other call has no id", async () => {
      otherHostWrites(1);
      const old = watch(manager.invoke(actorId, "incrAfterGate", undefined, "a1"));
      await gates.entered.promise;
      const reading = watch(manager.invoke(actorId, "read"));
      await flush();
      expect(reading.settled()).toBe(false);
      expect(active(manager).has(actorId.getId())).toBe(true);

      gates.release.resolve();
      expect(await old.promise).toEqual(2);
      expect(await reading.promise).toEqual(2);
      expect(store.get(counterKey(actorId.getId()))).toEqual(2);
      expect(created()).toHaveLength(1);
    });

    it("rejects the older queued activation instead of letting it evict the newer one", async () => {
      await manager.invoke(actorId, "incr", undefined, "a0");
      const held = watch(manager.invoke(actorId, "incrAfterGate", undefined, "a0"));
      await gates.entered.promise;
      otherHostWrites(5);
      const older = watch(manager.invoke(actorId, "incr", undefined, "a1"));
      const newer = watch(manager.invoke(actorId, "incr", undefined, "a2"));
      await flush();
      expect(older.settled()).toBe(false);
      expect(newer.settled()).toBe(false);
      expect(active(manager).has(actorId.getId())).toBe(false);
      expect(created()[0].deactivations).toEqual(0);

      gates.release.resolve();
      await expect(held.promise).rejects.toThrow("ACTOR_DEACTIVATED_DURING_CALL");
      await expect(older.promise).rejects.toThrow("ACTOR_ACTIVATION_SUPERSEDED");
      expect(await newer.promise).toEqual(6);
      expect(store.get(counterKey(actorId.getId()))).toEqual(6);
      expect(active(manager).get(actorId.getId())?.activationId).toEqual("a2");
      expect(active(manager).get(actorId.getId())?.actor).toBe(created()[1]);
      expect(created()[0].deactivations).toEqual(1);
    });
  });
});
