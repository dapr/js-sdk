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

import { Temporal } from "@js-temporal/polyfill";
import ActorId from "../../../src/actors/ActorId";
import AbstractActor from "../../../src/actors/runtime/AbstractActor";
import ActorStateManager from "../../../src/actors/runtime/ActorStateManager";
import StateProvider from "../../../src/actors/runtime/StateProvider";
import { OperationType } from "../../../src/types/Operation.type";

describe("ActorStateManager TTL", () => {
  let store: Map<string, any>;
  let transactions: OperationType[][];
  let manager: ActorStateManager<any>;

  beforeEach(() => {
    jest.useFakeTimers({ now: new Date("2026-01-01T00:00:00Z") });
    store = new Map();
    transactions = [];

    const actorClient: any = {
      actor: {
        stateGet: jest.fn(async (_type: string, _id: ActorId, key: string) => store.get(key) ?? ""),
        stateTransaction: jest.fn(async (_type: string, _id: ActorId, ops: OperationType[]) => {
          transactions.push(ops);
        }),
      },
    };
    const stateProvider = new StateProvider(actorClient);
    const actor = {
      getStateProvider: () => stateProvider,
      getActorType: () => "TestActor",
      getActorId: () => new ActorId("1"),
    } as unknown as AbstractActor;

    manager = new ActorStateManager(actor);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("sends ttlInSeconds metadata when setting state with a TTL", async () => {
    await manager.setState("key", "value", Temporal.Duration.from({ minutes: 1 }));
    await manager.saveState();

    expect(transactions).toEqual([
      [{ operation: "upsert", request: { key: "key", value: "value", metadata: { ttlInSeconds: "60" } } }],
    ]);
  });

  it("sends the remaining TTL rounded up at save time", async () => {
    await manager.setState("key", "value", Temporal.Duration.from({ seconds: 10 }));
    jest.advanceTimersByTime(2500);
    await manager.saveState();

    expect(transactions[0][0].request.metadata).toEqual({ ttlInSeconds: "8" });
  });

  it("does not send metadata when no TTL is given", async () => {
    await manager.setState("key", "value");
    await manager.saveState();

    expect(transactions[0][0].request).toEqual({ key: "key", value: "value" });
  });

  it("explicitly removes an existing TTL when the state is set again without one", async () => {
    await manager.setState("key", "value", Temporal.Duration.from({ minutes: 1 }));
    await manager.setState("key", "value2");
    await manager.saveState();

    expect(transactions[0][0].request).toEqual({ key: "key", value: "value2", metadata: { ttlInSeconds: "-1" } });
  });

  it("removes a persisted TTL only once", async () => {
    await manager.setState("key", "value", Temporal.Duration.from({ minutes: 1 }));
    await manager.saveState();
    await manager.setState("key", "value2");
    await manager.saveState();
    await manager.setState("key", "value3");
    await manager.saveState();

    expect(transactions.map((t) => t[0].request.metadata)).toEqual([
      { ttlInSeconds: "60" },
      { ttlInSeconds: "-1" },
      undefined,
    ]);
  });

  it("supports TTL on add, getOrAdd and addOrUpdate", async () => {
    const ttl = Temporal.Duration.from({ seconds: 30 });
    await manager.addState("a", 1, ttl);
    await manager.getOrAddState("b", 2, ttl);
    await manager.addOrUpdateState("c", 3, (_k, v) => v + 1, ttl);
    await manager.saveState();

    expect(transactions[0].map((o) => [o.request.key, o.request.metadata])).toEqual([
      ["a", { ttlInSeconds: "30" }],
      ["b", { ttlInSeconds: "30" }],
      ["c", { ttlInSeconds: "30" }],
    ]);
  });

  it("treats cached state as absent once its TTL has elapsed", async () => {
    await manager.setState("key", "value", Temporal.Duration.from({ seconds: 5 }));
    expect(await manager.tryGetState("key")).toEqual([true, "value"]);
    expect(await manager.containsState("key")).toBe(true);

    jest.advanceTimersByTime(5000);

    expect(await manager.tryGetState("key")).toEqual([false, null]);
    expect(await manager.containsState("key")).toBe(false);
    expect(await manager.tryAddState("key", "new")).toBe(true);
    expect(await manager.getState("key")).toBe("new");
  });

  it("does not add state that already exists in the store", async () => {
    store.set("existing", "value");

    expect(await manager.tryAddState("existing", "other", Temporal.Duration.from({ seconds: 5 }))).toBe(false);
    expect(await manager.tryAddState("missing", "other", Temporal.Duration.from({ seconds: 5 }))).toBe(true);
  });

  it("rejects non-positive TTLs", async () => {
    await expect(manager.setState("key", "value", Temporal.Duration.from({ seconds: 0 }))).rejects.toThrow(
      "positive duration",
    );
  });
});

describe("ActorStateManager add semantics", () => {
  let store: Map<string, any>;
  let transactions: OperationType[][];
  let stateGet: jest.Mock;
  let manager: ActorStateManager<any>;

  beforeEach(() => {
    store = new Map();
    transactions = [];
    stateGet = jest.fn(async (_type: string, _id: ActorId, key: string) => store.get(key) ?? "");

    const actorClient: any = {
      actor: {
        stateGet,
        stateTransaction: jest.fn(async (_type: string, _id: ActorId, ops: OperationType[]) => {
          transactions.push(ops);
        }),
      },
    };
    const stateProvider = new StateProvider(actorClient);
    const actor = {
      getStateProvider: () => stateProvider,
      getActorType: () => "TestActor",
      getActorId: () => new ActorId("1"),
    } as unknown as AbstractActor;

    manager = new ActorStateManager(actor);
  });

  it("adds a key that does not exist in the store", async () => {
    await manager.addState("new", "value");
    await manager.saveState();

    expect(transactions).toEqual([[{ operation: "upsert", request: { key: "new", value: "value" } }]]);
  });

  it("throws when adding a key that already exists in the store and does not overwrite it", async () => {
    store.set("existing", "stored");

    await expect(manager.addState("existing", "value")).rejects.toThrow("The actor state name existing already exist");
    await manager.saveState();

    expect(transactions).toEqual([]);
  });

  it("does not add the same key twice", async () => {
    expect(await manager.tryAddState("key", "first")).toBe(true);
    expect(await manager.tryAddState("key", "second")).toBe(false);
    expect(await manager.getState("key")).toBe("first");
  });

  it("does not query the store again for a key already loaded into the cache", async () => {
    store.set("existing", "stored");
    expect(await manager.getState("existing")).toBe("stored");
    stateGet.mockClear();

    expect(await manager.tryAddState("existing", "value")).toBe(false);
    expect(stateGet).not.toHaveBeenCalled();
  });

  it("re-adds a removed key as an upsert", async () => {
    store.set("existing", "stored");
    await manager.removeState("existing");

    expect(await manager.tryAddState("existing", "value")).toBe(true);
    await manager.saveState();

    expect(transactions).toEqual([[{ operation: "upsert", request: { key: "existing", value: "value" } }]]);
  });
});
