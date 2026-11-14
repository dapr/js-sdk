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
import { DaprClient } from "../../../src";
import ActorClientHTTP from "../../../src/actors/client/ActorClient/ActorClientHTTP";
import AbstractActor from "../../../src/actors/runtime/AbstractActor";
import ActorRuntime from "../../../src/actors/runtime/ActorRuntime";
import ActorTurnLock, {
  reentrancyIdFromHeaderValue,
  normalizeReentrancyId,
} from "../../../src/actors/runtime/ActorTurnLock";
import CommunicationProtocolEnum from "../../../src/enum/CommunicationProtocol.enum";
import { LogLevel } from "../../../src/types/logger/LogLevel";
import HTTPServer from "../../../src/implementation/Server/HTTPServer/HTTPServer";
import HTTPServerActor from "../../../src/implementation/Server/HTTPServer/actor";
import { ActorRuntimeOptions } from "../../../src/types/actors/ActorRuntimeOptions";

/**
 * A gate the actor method can wait on without the test holding the turn.
 * Resolving it twice is harmless.
 */
function deferred<T = void>(): {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
} {
  let resolve: (value: T | PromiseLike<T>) => void = () => undefined;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function flush(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

type RecordedOperation = { operation: string; key: string; value: unknown };

type DeferredStateSave = {
  gate: {
    resolve: () => void;
    reject: (error: unknown) => void;
  };
  started: Promise<void>;
  saves: RecordedOperation[][];
  release: () => void;
};

let unblockStateMock: () => void = () => undefined;
let restoreStateMock: () => void = () => undefined;

function controllable(): {
  promise: Promise<void>;
  resolve: () => void;
  reject: (error: unknown) => void;
} {
  let resolve: () => void = () => undefined;
  let reject: (error: unknown) => void = () => undefined;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/**
 * The runtime persists actor state through `ActorClient.stateTransaction`
 * (other SDKs call this saveActorStateTransactionally). The save numbered
 * `deferOnCall` (1-based) stays pending until the gate settles. Later saves
 * complete immediately. `stateGet` reports an empty store, so a later turn
 * can only see values the actor kept in its own cache.
 */
function mockDeferredActorStateSave(deferOnCall = 1): DeferredStateSave {
  const gate = controllable();
  let markStarted: () => void = () => undefined;
  const started = new Promise<void>((resolve) => {
    markStarted = resolve;
  });
  const saves: RecordedOperation[][] = [];
  let restored = false;

  const stateGet = jest.spyOn(ActorClientHTTP.prototype, "stateGet").mockResolvedValue("");
  const stateTransaction = jest
    .spyOn(ActorClientHTTP.prototype, "stateTransaction")
    .mockImplementation(async (_actorType, _actorId, ops) => {
      saves.push(
        ops.map((op) => ({
          operation: op.operation,
          key: op.request.key,
          value: op.request.value,
        })),
      );
      if (saves.length === deferOnCall) {
        markStarted();
        await gate.promise;
      }
    });

  const release = () => {
    gate.resolve();
  };
  const restore = () => {
    if (restored) {
      return;
    }
    restored = true;
    stateGet.mockRestore();
    stateTransaction.mockRestore();
  };
  unblockStateMock = release;
  restoreStateMock = restore;

  return { gate, started, saves, release };
}

class Probe {
  events: string[] = [];
  current = 0;
  max = 0;
  depth = 0;
  maxDepth = 0;
  holds = 0;
  holdTarget = 1;
  gate = deferred<void>();
  entered = deferred<void>();
  bottom = deferred<void>();
  activationGate = deferred<void>();
  activationStarted = deferred<void>();
  failDeactivate = false;
  failPost = false;
  failPre = false;
  failActivate = false;
  persistOnActivate = false;
  persistOnDeactivate = false;

  constructor() {
    this.activationGate.resolve();
  }

  reset(): void {
    this.events = [];
    this.current = 0;
    this.max = 0;
    this.depth = 0;
    this.maxDepth = 0;
    this.holds = 0;
    this.holdTarget = 1;
    this.gate = deferred<void>();
    this.entered = deferred<void>();
    this.bottom = deferred<void>();
    this.activationGate = deferred<void>();
    this.activationGate.resolve();
    this.activationStarted = deferred<void>();
    this.failDeactivate = false;
    this.failPost = false;
    this.failPre = false;
    this.failActivate = false;
    this.persistOnActivate = false;
    this.persistOnDeactivate = false;
  }

  /** Unblock every actor still waiting so a failed assertion cannot hang the suite. */
  release(): void {
    this.gate.resolve();
    this.activationGate.resolve();
    this.bottom.resolve();
  }

  trackEnter(name: string): void {
    this.events.push(`enter:${name}`);
    this.current += 1;
    this.max = Math.max(this.max, this.current);
    if (name === "first") {
      this.holds += 1;
      if (this.holds >= this.holdTarget) {
        this.entered.resolve();
      }
    }
  }

  trackExit(name: string): void {
    this.current -= 1;
    this.events.push(`exit:${name}`);
  }
}

const probe = new Probe();
let runtime: ActorRuntime;

/**
 * Actor used to reproduce daprd releasing its lock while the method is still running.
 * The test starts the next call directly; the turn lock is what keeps them from overlapping.
 */
class TurnProbeActor extends AbstractActor {
  async onActivate(): Promise<void> {
    probe.events.push("activate-start");
    probe.activationStarted.resolve();
    if (probe.failActivate) {
      throw new Error("activate-boom");
    }
    await probe.activationGate.promise;
    probe.events.push("activate-end");
  }

  async onDeactivate(): Promise<void> {
    if (probe.failDeactivate) {
      probe.failDeactivate = false;
      throw new Error("deactivate-boom");
    }
    probe.events.push("deactivate");
  }

  async onActorMethodPre(): Promise<void> {
    if (probe.failPre) {
      probe.failPre = false;
      throw new Error("pre-boom");
    }
  }

  async onActorMethodPost(): Promise<void> {
    if (probe.failPost) {
      probe.failPost = false;
      throw new Error("post-boom");
    }
  }

  async work(name: string): Promise<string> {
    probe.trackEnter(name);
    if (name === "first") {
      await probe.gate.promise;
    }
    probe.trackExit(name);
    return name;
  }

  async mark(name: string): Promise<void> {
    probe.events.push(`mark:${name}`);
    probe.current += 1;
    probe.max = Math.max(probe.max, probe.current);
    await Promise.resolve();
    probe.current -= 1;
  }

  async ping(): Promise<string> {
    probe.events.push("ping");
    return "pong";
  }

  async explode(kind: string): Promise<void> {
    probe.events.push(`explode:${kind}`);
    if (kind === "sync") {
      throw new Error("sync-boom");
    }
    await Promise.resolve();
    throw new Error("async-boom");
  }

  explodeNow(): void {
    probe.events.push("explode:now");
    throw new Error("throw-boom");
  }

  async receiveReminder(data: unknown): Promise<void> {
    probe.events.push(`reminder:${String(data)}`);
  }

  async onTimer(data: unknown): Promise<void> {
    probe.events.push(`timer:${String(data)}`);
  }

  async hop(spec: { depth: number; max: number; reentrancyId: string }): Promise<void> {
    probe.events.push(`enter:${spec.depth}`);
    probe.depth += 1;
    probe.maxDepth = Math.max(probe.maxDepth, probe.depth);
    if (spec.depth < spec.max) {
      const next = { ...spec, depth: spec.depth + 1 };
      await runtime.invoke(
        TurnProbeActor.name,
        this.getActorId().getId(),
        "hop",
        Buffer.from(JSON.stringify(next)),
        spec.reentrancyId,
      );
    } else {
      probe.events.push("bottom");
      probe.bottom.resolve();
      await probe.gate.promise;
    }
    probe.depth -= 1;
    probe.events.push(`exit:${spec.depth}`);
  }
}

class OtherTypeActor extends AbstractActor {
  async work(name: string): Promise<string> {
    probe.trackEnter(name);
    if (name === "first") {
      await probe.gate.promise;
    }
    probe.trackExit(name);
    return name;
  }
}

/**
 * Writes real actor state. The method returns before `onActorMethodPostInternal`
 * awaits the transactional save, which is the window the turn must still own.
 */
class StateTurnActor extends AbstractActor {
  async onActivate(): Promise<void> {
    probe.events.push("activate-start");
    if (probe.persistOnActivate) {
      await this.getStateManager<boolean>().setState("ready", true);
    }
    probe.events.push("activate-end");
  }

  async onDeactivate(): Promise<void> {
    probe.events.push("deactivate");
    if (probe.persistOnDeactivate) {
      await this.getStateManager<boolean>().setState("closed", true);
    }
  }

  async onActorMethodPost(): Promise<void> {
    probe.events.push("post");
  }

  async add(amount: number): Promise<number> {
    probe.events.push("enter:add");
    const [hasCount, current] = await this.getStateManager<number>().tryGetState("count");
    const next = (hasCount ? current ?? 0 : 0) + amount;
    await this.getStateManager<number>().setState("count", next);
    probe.events.push("body-returned");
    return next;
  }

  async read(name: string): Promise<unknown> {
    probe.events.push(`enter:read:${name}`);
    const [hasValue, value] = await this.getStateManager<unknown>().tryGetState(name);
    probe.events.push(`exit:read:${name}`);
    return hasValue ? value : null;
  }
}

function defaultOptions(): ActorRuntimeOptions {
  return {
    actorIdleTimeout: "1h",
    actorScanInterval: "30s",
    drainOngoingCallTimeout: "1m",
    drainRebalancedActors: true,
    reentrancy: { enabled: false },
    remindersStoragePartitions: 1,
  };
}

function enableReentrancy(): void {
  runtime.setActorRuntimeOptions({
    ...runtime.getActorRuntimeOptions(),
    reentrancy: { enabled: true, maxStackDepth: 32 },
  });
}

function call(
  actor: { name: string },
  id: string,
  method: string,
  body?: unknown,
  reentrancyId?: string,
): Promise<unknown> {
  const requestBody =
    body === undefined ? undefined : Buffer.from(typeof body === "string" ? body : JSON.stringify(body));
  return runtime.invoke(actor.name, id, method, requestBody, reentrancyId);
}

function lockSize(actor: { name: string } = TurnProbeActor): number {
  return runtime.getActorManager(actor.name).turnLockSize();
}

describe("reentrancy id header", () => {
  it("accepts the canonical header and ignores an empty value", () => {
    expect(reentrancyIdFromHeaderValue("chain-1")).toEqual("chain-1");
    expect(reentrancyIdFromHeaderValue("")).toBeUndefined();
    expect(reentrancyIdFromHeaderValue(undefined)).toBeUndefined();
    expect(reentrancyIdFromHeaderValue(["chain-1", "other"])).toEqual("chain-1");
    expect(reentrancyIdFromHeaderValue([""])).toBeUndefined();
    // IsNullOrEmpty does not trim. A whitespace id is still an id.
    expect(normalizeReentrancyId("  ")).toEqual("  ");
    expect(normalizeReentrancyId(null)).toBeUndefined();
  });
});

describe("ActorTurnLock", () => {
  it("runs one turn at a time and grants waiters FIFO", async () => {
    const lock = new ActorTurnLock();
    const holder = await lock.acquire("actor-1", undefined);
    const order: number[] = [];
    let active = 0;
    let maxActive = 0;

    const pending = Array.from({ length: 20 }, (_, index) =>
      lock.acquire("actor-1", undefined).then(async (lease) => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        order.push(index);
        await Promise.resolve();
        active -= 1;
        lease.release();
      }),
    );

    await flush();
    expect(order).toEqual([]);
    holder.release();
    await Promise.all(pending);

    expect(order).toEqual(Array.from({ length: 20 }, (_, index) => index));
    expect(maxActive).toEqual(1);
    expect(lock.size).toEqual(0);
  });

  it("does not block different actor ids", async () => {
    const lock = new ActorTurnLock();
    const leases = await Promise.all(
      Array.from({ length: 20 }, (_, index) => lock.acquire(`actor-${index}`, undefined)),
    );
    expect(lock.size).toEqual(20);
    for (const lease of leases) {
      lease.release();
    }
    expect(lock.size).toEqual(0);
  });

  it("reenters only for the same id after the turn allows it, and keeps other waiters FIFO", async () => {
    const lock = new ActorTurnLock();
    const holder = await lock.acquire("actor-1", "chain");
    const events: string[] = [];

    const other1 = lock.acquire("actor-1", undefined).then((lease) => {
      events.push("other1");
      return lease;
    });
    const same = lock.acquire("actor-1", "chain").then((lease) => {
      events.push("same");
      return lease;
    });
    const nested = lock.acquire("actor-1", "chain").then((lease) => {
      events.push("nested");
      return lease;
    });
    const other2 = lock.acquire("actor-1", "other").then((lease) => {
      events.push("other2");
      return lease;
    });
    const absent = lock.acquire("actor-1", "").then((lease) => {
      events.push("absent");
      return lease;
    });

    await flush();
    expect(events).toEqual([]);

    holder.allowReentrancy();
    await flush();
    // Both matching frames enter. The earlier non-matching waiter stays first among the others.
    expect(events).toEqual(["same", "nested"]);

    (await same).release();
    (await nested).release();
    await flush();
    expect(events).toEqual(["same", "nested"]);

    holder.release();
    (await other1).release();
    (await other2).release();
    (await absent).release();

    expect(events).toEqual(["same", "nested", "other1", "other2", "absent"]);
    expect(lock.size).toEqual(0);
  });

  it("does not let a matching id in before allowReentrancy", async () => {
    const lock = new ActorTurnLock();
    const holder = await lock.acquire("actor-1", "chain");
    let entered = false;
    const waiting = lock.acquire("actor-1", "chain").then((lease) => {
      entered = true;
      return lease;
    });

    await flush();
    expect(entered).toEqual(false);
    holder.allowReentrancy();
    const lease = await waiting;
    expect(entered).toEqual(true);
    lease.release();
    holder.release();
    expect(lock.size).toEqual(0);
  });

  it("drops the entry when the last turn finishes, including when nobody was waiting", async () => {
    const lock = new ActorTurnLock();
    const first = await lock.acquire("ephemeral", "chain");
    expect(lock.size).toEqual(1);
    first.allowReentrancy();
    const second = await lock.acquire("ephemeral", "chain");
    second.release();
    expect(lock.size).toEqual(1);
    first.release();
    expect(lock.size).toEqual(0);

    const again = await lock.acquire("ephemeral", undefined);
    again.release();
    expect(lock.size).toEqual(0);
  });
});

describe("actor turn gate", () => {
  let client: DaprClient;
  const pending: Promise<unknown>[] = [];

  beforeAll(() => {
    client = new DaprClient({ daprHost: "127.0.0.1", daprPort: "1000", isKeepAlive: false });
  });

  beforeEach(() => {
    pending.length = 0;
    probe.reset();
    runtime = ActorRuntime.getInstanceByDaprClient(client);
    runtime.setActorRuntimeOptions(defaultOptions());
    runtime.clearActorManagers();
    runtime.registerActor(TurnProbeActor);
    runtime.registerActor(OtherTypeActor);
    runtime.registerActor(StateTurnActor);
  });

  afterEach(async () => {
    probe.release();
    unblockStateMock();
    unblockStateMock = () => undefined;
    try {
      await Promise.allSettled(pending);
    } finally {
      restoreStateMock();
      restoreStateMock = () => undefined;
    }
  });

  function track<T>(promise: Promise<T>): Promise<T> {
    pending.push(promise);
    return promise;
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
    pending.push(observed);
    return { promise: observed, settled: () => done };
  }

  it("keeps a second call behind a method that is still running", async () => {
    const first = track(call(TurnProbeActor, "same", "work", "first"));
    await probe.entered.promise;
    const second = track(call(TurnProbeActor, "same", "work", "second"));
    const third = track(call(TurnProbeActor, "same", "work", "third"));
    await flush();

    expect(probe.max).toEqual(1);
    expect(probe.events).toEqual(["activate-start", "activate-end", "enter:first"]);

    probe.gate.resolve();
    await Promise.all([first, second, third]);

    expect(probe.max).toEqual(1);
    expect(probe.events).toEqual([
      "activate-start",
      "activate-end",
      "enter:first",
      "exit:first",
      "enter:second",
      "exit:second",
      "enter:third",
      "exit:third",
    ]);
    expect(lockSize()).toEqual(0);
  });

  it("runs different actor ids at the same time", async () => {
    probe.holdTarget = 2;
    const first = track(call(TurnProbeActor, "one", "work", "first"));
    const second = track(call(TurnProbeActor, "two", "work", "first"));
    await probe.entered.promise;

    expect(probe.max).toEqual(2);
    expect(probe.events.filter((event) => event === "enter:first")).toHaveLength(2);
    expect(probe.events.some((event) => event.startsWith("exit:"))).toEqual(false);

    probe.gate.resolve();
    await Promise.all([first, second]);
    expect(probe.max).toEqual(2);
    expect(probe.events.filter((event) => event.startsWith("exit:"))).toHaveLength(2);
    expect(lockSize()).toEqual(0);
  });

  it("does not share a turn across actor types that happen to use the same id", async () => {
    probe.holdTarget = 2;
    const first = track(call(TurnProbeActor, "shared", "work", "first"));
    const second = track(call(OtherTypeActor, "shared", "work", "first"));
    await probe.entered.promise;

    expect(probe.max).toEqual(2);
    probe.gate.resolve();
    await Promise.all([first, second]);
    expect(lockSize(TurnProbeActor)).toEqual(0);
    expect(lockSize(OtherTypeActor)).toEqual(0);
  });

  it("releases the turn when the method throws or rejects", async () => {
    await expect(call(TurnProbeActor, "same", "explode", "sync")).rejects.toThrow("sync-boom");
    await expect(call(TurnProbeActor, "same", "explode", "async")).rejects.toThrow("async-boom");
    await expect(call(TurnProbeActor, "same", "explodeNow")).rejects.toThrow("throw-boom");
    await expect(call(TurnProbeActor, "same", "missing")).rejects.toThrow(/ACTOR_METHOD_DOES_NOT_EXIST/);

    probe.failPre = true;
    await expect(call(TurnProbeActor, "same", "ping")).rejects.toThrow("pre-boom");
    probe.failPost = true;
    await expect(call(TurnProbeActor, "same", "ping")).rejects.toThrow("post-boom");

    await expect(call(TurnProbeActor, "same", "ping")).resolves.toEqual("pong");
    expect(lockSize()).toEqual(0);
    expect(probe.events).toContain("ping");
  });

  it("releases the turn when activation fails and lets a later call activate", async () => {
    probe.failActivate = true;
    await expect(call(TurnProbeActor, "same", "ping")).rejects.toThrow("activate-boom");
    expect(lockSize()).toEqual(0);
    expect(runtime.getActorManager(TurnProbeActor.name).actors.size).toEqual(0);

    probe.failActivate = false;
    await expect(call(TurnProbeActor, "same", "ping")).resolves.toEqual("pong");
    expect(lockSize()).toEqual(0);
    expect(runtime.getActorManager(TurnProbeActor.name).actors.size).toEqual(1);
  });

  it("serializes when reentrancy is disabled, even with a matching header", async () => {
    const first = track(call(TurnProbeActor, "same", "work", "first", "chain"));
    await probe.entered.promise;
    const second = track(call(TurnProbeActor, "same", "mark", "again", "chain"));
    await flush();

    expect(probe.events).not.toContain("mark:again");
    probe.gate.resolve();
    await Promise.all([first, second]);
    expect(probe.max).toEqual(1);
    expect(probe.events.indexOf("exit:first")).toBeLessThan(probe.events.indexOf("mark:again"));
  });

  it("reenters a matching chain and still queues every other id", async () => {
    enableReentrancy();
    const first = track(call(TurnProbeActor, "same", "work", "first", "chain"));
    await probe.entered.promise;

    const same = track(call(TurnProbeActor, "same", "mark", "same", "chain"));
    await same;
    expect(probe.events).toContain("mark:same");
    expect(probe.max).toBeGreaterThan(1);
    expect(probe.events).not.toContain("exit:first");

    const other = track(call(TurnProbeActor, "same", "mark", "other", "other-chain"));
    const missing = track(call(TurnProbeActor, "same", "mark", "missing", undefined));
    const empty = track(call(TurnProbeActor, "same", "mark", "empty", ""));
    await flush();
    expect(probe.events).not.toContain("mark:other");
    expect(probe.events).not.toContain("mark:missing");
    expect(probe.events).not.toContain("mark:empty");

    probe.gate.resolve();
    await Promise.all([first, other, missing, empty]);
    expect(probe.events.indexOf("exit:first")).toBeLessThan(probe.events.indexOf("mark:other"));
    expect(probe.events.indexOf("mark:other")).toBeLessThan(probe.events.indexOf("mark:missing"));
    expect(probe.events.indexOf("mark:missing")).toBeLessThan(probe.events.indexOf("mark:empty"));
    expect(lockSize()).toEqual(0);
  });

  it("supports a nested call chain and does not let another chain in until the depth is zero", async () => {
    enableReentrancy();
    const hop = track(call(TurnProbeActor, "same", "hop", { depth: 0, max: 2, reentrancyId: "chain" }, "chain"));
    await probe.bottom.promise;
    expect(probe.maxDepth).toEqual(3);
    expect(probe.events).toEqual(["activate-start", "activate-end", "enter:0", "enter:1", "enter:2", "bottom"]);

    const extra = track(call(TurnProbeActor, "same", "mark", "extra", "chain"));
    await extra;
    expect(probe.events).toContain("mark:extra");

    const outsider = track(call(TurnProbeActor, "same", "mark", "outsider", "someone-else"));
    await flush();
    expect(probe.events).not.toContain("mark:outsider");

    probe.gate.resolve();
    await Promise.all([hop, outsider]);
    expect(probe.events).toEqual([
      "activate-start",
      "activate-end",
      "enter:0",
      "enter:1",
      "enter:2",
      "bottom",
      "mark:extra",
      "exit:2",
      "exit:1",
      "exit:0",
      "mark:outsider",
    ]);
    expect(lockSize()).toEqual(0);
  });

  it("does not reenter during activation", async () => {
    enableReentrancy();
    probe.activationGate = deferred<void>();
    const first = track(call(TurnProbeActor, "same", "ping", undefined, "chain"));
    await probe.activationStarted.promise;
    const second = track(call(TurnProbeActor, "same", "ping", undefined, "chain"));
    await flush();

    expect(probe.events).toEqual(["activate-start"]);
    probe.activationGate.resolve();
    await Promise.all([first, second]);

    const finished = probe.events.indexOf("activate-end");
    expect(finished).toBeGreaterThan(probe.events.indexOf("activate-start"));
    expect(probe.events.indexOf("ping")).toBeGreaterThan(finished);
    expect(probe.events.filter((event) => event === "ping")).toHaveLength(2);
  });

  it("keeps reminders and timers on the same turn as method calls", async () => {
    const first = track(call(TurnProbeActor, "same", "work", "first"));
    await probe.entered.promise;

    const reminder = track(
      runtime.fireReminder(TurnProbeActor.name, "same", "pay", Buffer.from(JSON.stringify({ data: "hello" }))),
    );
    const timer = track(
      runtime.fireTimer(
        TurnProbeActor.name,
        "same",
        "tick",
        Buffer.from(JSON.stringify({ callback: "onTimer", data: "now" })),
      ),
    );
    await flush();
    expect(probe.events).not.toContain("reminder:hello");
    expect(probe.events).not.toContain("timer:now");

    probe.gate.resolve();
    await Promise.all([first, reminder, timer]);
    expect(probe.events).toEqual([
      "activate-start",
      "activate-end",
      "enter:first",
      "exit:first",
      "reminder:hello",
      "timer:now",
    ]);
    expect(lockSize()).toEqual(0);
  });

  it("lets a reminder with the same reentrancy id join the active turn", async () => {
    enableReentrancy();
    const first = track(call(TurnProbeActor, "same", "work", "first", "chain"));
    await probe.entered.promise;
    await runtime.fireReminder(
      TurnProbeActor.name,
      "same",
      "pay",
      Buffer.from(JSON.stringify({ data: "hello" })),
      "chain",
    );
    expect(probe.events).toContain("reminder:hello");
    expect(probe.events).not.toContain("exit:first");

    const blocked = track(
      runtime.fireTimer(
        TurnProbeActor.name,
        "same",
        "tick",
        Buffer.from(JSON.stringify({ callback: "onTimer", data: "now" })),
        "other",
      ),
    );
    await flush();
    expect(probe.events).not.toContain("timer:now");
    probe.gate.resolve();
    await Promise.all([first, blocked]);
    expect(probe.events.indexOf("exit:first")).toBeLessThan(probe.events.indexOf("timer:now"));
  });

  it("waits to deactivate until the running turn finishes and then drops the lock entry", async () => {
    enableReentrancy();
    const first = track(call(TurnProbeActor, "same", "work", "first", "chain"));
    await probe.entered.promise;
    let deactivated = false;
    const stopping = track(
      runtime.deactivate(TurnProbeActor.name, "same").then(() => {
        deactivated = true;
      }),
    );
    await flush();
    expect(deactivated).toEqual(false);
    expect(probe.events).not.toContain("deactivate");

    probe.gate.resolve();
    await Promise.all([first, stopping]);
    expect(probe.events).toEqual(["activate-start", "activate-end", "enter:first", "exit:first", "deactivate"]);
    expect(runtime.getActorManager(TurnProbeActor.name).actors.has("same")).toEqual(false);
    expect(lockSize()).toEqual(0);
  });

  it("releases the turn when deactivation throws and does not leak unknown ids", async () => {
    await call(TurnProbeActor, "same", "ping");
    probe.failDeactivate = true;
    await expect(runtime.deactivate(TurnProbeActor.name, "same")).rejects.toThrow("deactivate-boom");
    expect(lockSize()).toEqual(0);
    expect(runtime.getActorManager(TurnProbeActor.name).actors.has("same")).toEqual(true);

    await runtime.deactivate(TurnProbeActor.name, "same");
    expect(runtime.getActorManager(TurnProbeActor.name).actors.has("same")).toEqual(false);
    expect(lockSize()).toEqual(0);

    await expect(runtime.deactivate(TurnProbeActor.name, "missing")).rejects.toThrow(/ACTOR_NOT_ACTIVATED/);
    expect(lockSize()).toEqual(0);
  });

  it("does not keep a lock entry for every actor id it has activated", async () => {
    for (let index = 0; index < 40; index += 1) {
      await call(TurnProbeActor, `live-${index}`, "ping");
    }
    const manager = runtime.getActorManager(TurnProbeActor.name);
    expect(manager.actors.size).toEqual(40);
    expect(manager.turnLockSize()).toEqual(0);

    for (let index = 0; index < 40; index += 1) {
      await runtime.deactivate(TurnProbeActor.name, `live-${index}`);
    }
    expect(manager.actors.size).toEqual(0);
    expect(manager.turnLockSize()).toEqual(0);
  });

  it("holds the turn through the post-method state save, then runs queued work in order", async () => {
    const state = mockDeferredActorStateSave(1);
    try {
      const first = watch(call(StateTurnActor, "acct", "add", 1));
      await state.started;
      await flush();

      // The method body and the post hook have returned. Persistence has not.
      expect(probe.events).toEqual(["activate-start", "activate-end", "enter:add", "body-returned", "post"]);
      expect(first.settled()).toEqual(false);
      expect(runtime.getActorManager(StateTurnActor.name).actors.has("acct")).toEqual(true);
      expect(state.saves).toEqual([[{ operation: "upsert", key: "count", value: 1 }]]);
      expect(lockSize(StateTurnActor)).toBeGreaterThan(0);

      const second = watch(call(StateTurnActor, "acct", "add", 10));
      let deactivated = false;
      const stopping = watch(
        runtime.deactivate(StateTurnActor.name, "acct").then(() => {
          deactivated = true;
        }),
      );
      await flush();

      expect(first.settled()).toEqual(false);
      expect(second.settled()).toEqual(false);
      expect(deactivated).toEqual(false);
      expect(probe.events.filter((event) => event === "enter:add")).toHaveLength(1);
      expect(probe.events).not.toContain("deactivate");
      expect(state.saves).toHaveLength(1);
      expect(lockSize(StateTurnActor)).toBeGreaterThan(0);

      state.gate.resolve();
      await expect(first.promise).resolves.toEqual(1);
      // The store mock stays empty, so 11 is the cached write from the first turn.
      await expect(second.promise).resolves.toEqual(11);
      await stopping.promise;

      expect(deactivated).toEqual(true);
      expect(probe.events).toEqual([
        "activate-start",
        "activate-end",
        "enter:add",
        "body-returned",
        "post",
        "enter:add",
        "body-returned",
        "post",
        "deactivate",
      ]);
      expect(state.saves).toEqual([
        [{ operation: "upsert", key: "count", value: 1 }],
        [{ operation: "upsert", key: "count", value: 11 }],
      ]);
      expect(runtime.getActorManager(StateTurnActor.name).actors.has("acct")).toEqual(false);
      expect(lockSize(StateTurnActor)).toEqual(0);
    } finally {
      state.release();
    }
  });

  it("releases the turn when the post-method state save fails so queued work can finish", async () => {
    const state = mockDeferredActorStateSave(1);
    try {
      const first = watch(call(StateTurnActor, "acct", "add", 1));
      await state.started;

      const second = watch(call(StateTurnActor, "acct", "read", "count"));
      let deactivated = false;
      const stopping = watch(
        runtime.deactivate(StateTurnActor.name, "acct").then(() => {
          deactivated = true;
        }),
      );
      await flush();

      expect(first.settled()).toEqual(false);
      expect(second.settled()).toEqual(false);
      expect(deactivated).toEqual(false);
      expect(probe.events).toEqual(["activate-start", "activate-end", "enter:add", "body-returned", "post"]);
      expect(probe.events).not.toContain("enter:read:count");
      expect(probe.events).not.toContain("deactivate");
      expect(lockSize(StateTurnActor)).toBeGreaterThan(0);

      state.gate.reject(new Error("state-store-down"));
      await expect(first.promise).rejects.toThrow("state-store-down");
      // The failed save leaves the method's write in the actor cache. The queued read sees it.
      await expect(second.promise).resolves.toEqual(1);
      await stopping.promise;

      expect(deactivated).toEqual(true);
      expect(probe.events).toEqual([
        "activate-start",
        "activate-end",
        "enter:add",
        "body-returned",
        "post",
        "enter:read:count",
        "exit:read:count",
        "post",
        "deactivate",
      ]);
      expect(state.saves).toEqual([[{ operation: "upsert", key: "count", value: 1 }]]);
      expect(runtime.getActorManager(StateTurnActor.name).actors.has("acct")).toEqual(false);
      expect(lockSize(StateTurnActor)).toEqual(0);
    } finally {
      state.release();
    }
  });

  it("does not run the method or a queued call until the activation state save settles", async () => {
    probe.persistOnActivate = true;
    const state = mockDeferredActorStateSave(1);
    try {
      const first = watch(call(StateTurnActor, "acct", "add", 1));
      await state.started;
      await flush();

      expect(probe.events).toEqual(["activate-start", "activate-end"]);
      expect(first.settled()).toEqual(false);
      expect(runtime.getActorManager(StateTurnActor.name).actors.has("acct")).toEqual(false);
      expect(state.saves).toEqual([[{ operation: "upsert", key: "ready", value: true }]]);
      expect(lockSize(StateTurnActor)).toBeGreaterThan(0);

      const second = watch(call(StateTurnActor, "acct", "add", 10));
      await flush();
      expect(second.settled()).toEqual(false);
      expect(probe.events).not.toContain("enter:add");
      expect(state.saves).toHaveLength(1);
      expect(lockSize(StateTurnActor)).toBeGreaterThan(0);

      state.gate.resolve();
      await expect(first.promise).resolves.toEqual(1);
      await expect(second.promise).resolves.toEqual(11);
      expect(probe.events).toEqual([
        "activate-start",
        "activate-end",
        "enter:add",
        "body-returned",
        "post",
        "enter:add",
        "body-returned",
        "post",
      ]);
      expect(state.saves).toEqual([
        [{ operation: "upsert", key: "ready", value: true }],
        [{ operation: "upsert", key: "count", value: 1 }],
        [{ operation: "upsert", key: "count", value: 11 }],
      ]);
      expect(lockSize(StateTurnActor)).toEqual(0);
    } finally {
      state.release();
    }
  });

  it("releases the turn when the activation state save fails and lets the next call activate", async () => {
    probe.persistOnActivate = true;
    const state = mockDeferredActorStateSave(1);
    try {
      const first = watch(call(StateTurnActor, "acct", "add", 1));
      await state.started;
      const second = watch(call(StateTurnActor, "acct", "add", 4));
      await flush();

      expect(probe.events).toEqual(["activate-start", "activate-end"]);
      expect(first.settled()).toEqual(false);
      expect(second.settled()).toEqual(false);
      expect(runtime.getActorManager(StateTurnActor.name).actors.has("acct")).toEqual(false);
      expect(lockSize(StateTurnActor)).toBeGreaterThan(0);

      state.gate.reject(new Error("state-store-down"));
      await expect(first.promise).rejects.toThrow("state-store-down");
      await expect(second.promise).resolves.toEqual(4);

      expect(probe.events.filter((event) => event === "activate-start")).toHaveLength(2);
      expect(probe.events.filter((event) => event === "enter:add")).toHaveLength(1);
      expect(runtime.getActorManager(StateTurnActor.name).actors.has("acct")).toEqual(true);
      expect(lockSize(StateTurnActor)).toEqual(0);
    } finally {
      state.release();
    }
  });

  it("holds the turn through the deactivation state save before a queued invocation runs", async () => {
    probe.persistOnDeactivate = true;
    const state = mockDeferredActorStateSave(2);
    try {
      await call(StateTurnActor, "acct", "add", 1);
      expect(state.saves).toHaveLength(1);
      expect(lockSize(StateTurnActor)).toEqual(0);

      const stopping = watch(runtime.deactivate(StateTurnActor.name, "acct"));
      await state.started;
      await flush();

      expect(stopping.settled()).toEqual(false);
      expect(probe.events).toEqual([
        "activate-start",
        "activate-end",
        "enter:add",
        "body-returned",
        "post",
        "deactivate",
      ]);
      expect(state.saves[1]).toEqual([{ operation: "upsert", key: "closed", value: true }]);
      expect(runtime.getActorManager(StateTurnActor.name).actors.has("acct")).toEqual(true);
      expect(lockSize(StateTurnActor)).toBeGreaterThan(0);

      const next = watch(call(StateTurnActor, "acct", "add", 3));
      await flush();
      expect(next.settled()).toEqual(false);
      expect(probe.events.filter((event) => event === "enter:add")).toHaveLength(1);
      expect(state.saves).toHaveLength(2);

      state.gate.resolve();
      await stopping.promise;
      await expect(next.promise).resolves.toEqual(3);
      expect(probe.events).toEqual([
        "activate-start",
        "activate-end",
        "enter:add",
        "body-returned",
        "post",
        "deactivate",
        "activate-start",
        "activate-end",
        "enter:add",
        "body-returned",
        "post",
      ]);
      expect(state.saves).toEqual([
        [{ operation: "upsert", key: "count", value: 1 }],
        [{ operation: "upsert", key: "closed", value: true }],
        [{ operation: "upsert", key: "count", value: 3 }],
      ]);
      expect(runtime.getActorManager(StateTurnActor.name).actors.has("acct")).toEqual(true);
      expect(lockSize(StateTurnActor)).toEqual(0);
    } finally {
      state.release();
    }
  });

  it("releases the turn when the deactivation state save fails and still runs queued work", async () => {
    probe.persistOnDeactivate = true;
    const state = mockDeferredActorStateSave(2);
    try {
      await call(StateTurnActor, "acct", "add", 1);
      const stopping = watch(runtime.deactivate(StateTurnActor.name, "acct"));
      await state.started;

      const next = watch(call(StateTurnActor, "acct", "read", "closed"));
      await flush();
      expect(stopping.settled()).toEqual(false);
      expect(next.settled()).toEqual(false);
      expect(probe.events).not.toContain("enter:read:closed");
      expect(runtime.getActorManager(StateTurnActor.name).actors.has("acct")).toEqual(true);
      expect(lockSize(StateTurnActor)).toBeGreaterThan(0);

      state.gate.reject(new Error("state-store-down"));
      await expect(stopping.promise).rejects.toThrow("state-store-down");
      await expect(next.promise).resolves.toEqual(true);

      expect(probe.events.filter((event) => event === "activate-start")).toHaveLength(1);
      expect(probe.events).toContain("enter:read:closed");
      expect(state.saves).toEqual([
        [{ operation: "upsert", key: "count", value: 1 }],
        [{ operation: "upsert", key: "closed", value: true }],
      ]);
      // The failed deactivation does not drop the actor. The lock entry is still removed.
      expect(runtime.getActorManager(StateTurnActor.name).actors.has("acct")).toEqual(true);
      expect(lockSize(StateTurnActor)).toEqual(0);
    } finally {
      state.release();
    }
  });

  it("reads Dapr-Reentrancy-Id on the HTTP actor route, regardless of header casing", async () => {
    enableReentrancy();
    const fakeClient = {
      options: {
        daprHost: "127.0.0.1",
        daprPort: "1000",
        logger: { level: LogLevel.Error },
      },
      daprClient: {},
    } as unknown as DaprClient;
    const server = new HTTPServer(fakeClient, {
      serverHost: "127.0.0.1",
      serverPort: "0",
      communicationProtocol: CommunicationProtocolEnum.HTTP,
    });
    await new HTTPServerActor(server, fakeClient).init();
    const listening = http.createServer(server.getServer());
    await new Promise<void>((resolve) => listening.listen(0, "127.0.0.1", resolve));
    const port = (listening.address() as AddressInfo).port;
    const url = `http://127.0.0.1:${port}/actors/${TurnProbeActor.name}/same/method`;

    const put = (method: string, body: string, reentrancyId: string, headerName: string) =>
      fetch(`${url}/${method}`, {
        method: "PUT",
        headers: {
          "Content-Type": "text/plain",
          [headerName]: reentrancyId,
        },
        body,
      });

    try {
      const first = track(put("work", "first", "chain", "dapr-reentrancy-id"));
      await probe.entered.promise;
      const same = await put("mark", "same", "chain", "Dapr-Reentrancy-Id");
      expect(same.status).toEqual(200);
      expect(probe.events).toContain("mark:same");
      expect(probe.events).not.toContain("exit:first");

      const blocked = track(put("mark", "blocked", "other", "Dapr-Reentrancy-Id"));
      await flush();
      expect(probe.events).not.toContain("mark:blocked");

      probe.gate.resolve();
      const responses = await Promise.all([first, blocked]);
      expect(responses.map((response) => response.status)).toEqual([200, 200]);
      expect(probe.events.indexOf("exit:first")).toBeLessThan(probe.events.indexOf("mark:blocked"));
      expect(lockSize()).toEqual(0);
    } finally {
      probe.release();
      await new Promise<void>((resolve, reject) => listening.close((error) => (error ? reject(error) : resolve())));
    }
  });
});
