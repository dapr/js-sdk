/*
Copyright 2022 The Dapr Authors
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

import DaprClient from "../../implementation/Client/DaprClient";
import Class from "../../types/Class";
import ActorId from "../ActorId";
import AbstractActor from "./AbstractActor";
import ActorReminderData from "./ActorReminderData";
import ActorTimerData from "./ActorTimerData";
import ActorTurnLock, { ActorTurnLease, normalizeReentrancyId } from "./ActorTurnLock";
import BufferSerializer from "./BufferSerializer";
import { Logger } from "../../logger/Logger";

/**
 * The Actor Manager manages actor objects of a specific actor type
 */
const REMINDER_METHOD_NAME = "receiveReminder"; // the callback method name for the reminder

type LiveActor<T> = {
  actor: T;
  activationId: string;
  generation: number;
  /** A newer activation id took this object. Its saves are refused and its onDeactivate errors are logged. */
  replaced: boolean;
  /**
   * DELETE sets this before waiting for the turn so a call still running cannot save.
   * Cleared again for DELETE's own onDeactivate, unless a newer activation already replaced it.
   */
  blockSaves: boolean;
};
type Owner = { generation: number; activationId: string; removed: boolean };
type Admission = { ticket: number; activationId: string; waiters: number };
type Admitted = { ticket: number; detachedStale: boolean };

export default class ActorManager<T extends AbstractActor> {
  readonly actorCls: Class<T>;
  readonly daprClient: DaprClient;
  readonly serializer: BufferSerializer = new BufferSerializer();
  private readonly logger: Logger;

  private readonly activeActors = new Map<string, LiveActor<T>>();
  // the latest activation of each actor, kept across removal so a late one can't take over
  private readonly owners = new Map<string, Owner>();
  // created, but onActivate has not finished, so a newer id can fence it before it is registered
  private readonly activating = new Map<string, LiveActor<T>>();
  // removed from activeActors; onDeactivate runs in the next root turn
  private readonly detached = new Map<string, LiveActor<T>[]>();
  // onDeactivate in progress, so a newer activation id can still stop its save
  private readonly deactivating = new Map<string, LiveActor<T>[]>();
  // newest non-empty activation id admitted for an actor, and how many of those calls are still open
  private readonly latest = new Map<string, Admission>();
  private nextGeneration = 0;
  private admissions = 0;

  // One turn per actor id. The sidecar drops its lock when the caller cancels; this one does not.
  private readonly turnLock = new ActorTurnLock();

  // dispatcher: ActorMethodDispatcher<T>;
  // timerMethodContext: any;
  // reminderMethodContext: any;

  constructor(actorCls: Class<T>, daprClient: DaprClient) {
    this.daprClient = daprClient;
    this.actorCls = actorCls;
    this.logger = new Logger("Actors", "ActorManager", daprClient.options.logger);

    // @todo: we need to make sure race condition cannot happen when accessing the active actors
    // NodeJS has an event loop (main thread -> runs JS code) and a worker pool (threadpool -> automatically created for offloading work through libuv) threads
    // we can have a new thread through the worker_thread module
    // https://medium.com/@mohllal/node-js-multithreading-a5cd74958a67
    //
    //
    // Python: asyncio.lock -> implements a mutex lock for asyncio tasks to guarantee exclusive access to a shared resource
    // Java: Collections.synchronizedMap -> is a thread-saf synchronized map to guarantee serial access
    // NodeJS: https://nodejs.org/api/worker_threads.html
    // this.activeActorsLock = null; // Unknown in JS, states: asyncio.lock() in python @todo: we need a Mutex locking function

    // this.dispatcher = new ActorMethodDispatcher(this.runtimeCtx.getActorTypeInformation());
    // this.timerMethodContext = ActorMethodContext.createForTimer(TIMER_METHOD_NAME);
    // this.reminderMethodContext = ActorMethodContext.createForReminder(REMINDER_METHOD_NAME);
  }

  /**
   * Actor ids that still have a turn-lock entry.
   * Idle ids are removed, including after deactivation, so the table does not grow without bound.
   */
  turnLockSize(): number {
    return this.turnLock.size;
  }

  /**
   * Objects currently activated for this type, keyed by actor id.
   */
  get actors(): Map<string, T> {
    const objects = new Map<string, T>();
    for (const [id, active] of this.activeActors) {
      objects.set(id, active.actor);
    }
    return objects;
  }

  async createActor(actorId: ActorId): Promise<T> {
    return new this.actorCls(this.daprClient, actorId);
  }

  async activateActor(
    actorId: ActorId,
    activationId = "",
    generation = this.claim(actorId, activationId),
    ticket = this.admissions,
  ): Promise<T> {
    if (this.isSuperseded(actorId, activationId, ticket)) {
      throw this.superseded(actorId);
    }

    const actor = await this.createActor(actorId);
    const live: LiveActor<T> = { actor, activationId, generation, replaced: false, blockSaves: false };
    actor.getStateManager().guard(() => this.owns(actorId, generation) && !live.blockSaves);
    const id = actorId.getId();
    this.activating.set(id, live);

    try {
      // We activate the actor by calling the onActivateInternal method on it
      // this will create its state object
      await actor.onActivateInternal(
        () => this.owns(actorId, generation) && !live.replaced && !live.blockSaves && this.noneRegistered(actorId),
      );
    } catch (err) {
      if (this.activating.get(id) === live) {
        this.activating.delete(id);
      }
      throw err;
    }
    if (this.activating.get(id) === live) {
      this.activating.delete(id);
    }

    if (!this.owns(actorId, generation) || live.replaced || this.isSuperseded(actorId, activationId, ticket)) {
      await this.deactivateDiscarded(actorId, actor);
      throw this.superseded(actorId);
    }

    // another call with the same activation may have registered an object while this one was activating
    if (!this.activeActors.has(id)) {
      this.activeActors.set(id, live);
      return actor;
    }

    await this.deactivateDiscarded(actorId, actor);
    const registered = this.activeActors.get(id);
    if (registered?.generation !== generation || registered.replaced) {
      throw this.superseded(actorId);
    }
    return registered.actor;
  }

  async deactivateActor(actorId: ActorId): Promise<void> {
    // Unregister before waiting for the turn so a call still running can't save.
    // Deactivation is its own turn. A reentrancy id must not let it overlap a running method.
    const removed = this.unregisterForDelete(actorId);
    await this.withTurn(actorId, undefined, false, async () => {
      let owned = removed;
      if (!owned) {
        owned = this.unregisterForDelete(actorId);
      }
      if (!owned && !this.hasDetached(actorId)) {
        throw this.notActivated(actorId);
      }
      await this.cleanupDetached(actorId, owned);
    });
  }

  // an activation with another id, or any after a removal, takes over from the previous one
  private claim(actorId: ActorId, activationId: string): number {
    const owner = this.owners.get(actorId.getId());
    if (owner && !owner.removed && (!activationId || owner.activationId === activationId)) {
      return owner.generation;
    }
    const generation = ++this.nextGeneration;
    this.owners.set(actorId.getId(), { generation, activationId, removed: false });
    return generation;
  }

  private owns(actorId: ActorId, generation: number): boolean {
    return this.owners.get(actorId.getId())?.generation === generation;
  }

  private noneRegistered(actorId: ActorId): boolean {
    return !this.activeActors.has(actorId.getId());
  }

  private superseded(actorId: ActorId): Error {
    return new Error(
      JSON.stringify({
        error: "ACTOR_ACTIVATION_SUPERSEDED",
        errorMsg: `The actor ${actorId.getId()} was activated by a newer activation during this activation`,
      }),
    );
  }

  private async deactivateDiscarded(actorId: ActorId, actor: T): Promise<void> {
    actor.getStateManager().discard();
    try {
      await actor.onDeactivateInternal(() => false);
    } catch (err) {
      this.logger.error(`Deactivating discarded object for actor ${actorId.getId()} failed: ${err}`);
    }
  }

  async getActiveActor(actorId: ActorId, activationId = ""): Promise<T> {
    return await this.callInTurn(actorId, activationId, undefined, async (actor) => actor);
  }

  /**
   * Execute the given method with requestBody on the given Actor
   *
   * @param actorId
   * @param actorMethodName
   * @param requestBody
   * @param actorMethodContext
   * @returns
   */
  async invoke(
    actorId: ActorId,
    actorMethodName: string,
    requestBody?: Buffer,
    activationId = "",
    reentrancyId?: string,
  ): Promise<any> {
    const requestBodyDeserialized = this.serializer.deserialize(requestBody || Buffer.from(""));
    return await this.callActorMethod(actorId, actorMethodName, requestBodyDeserialized, activationId, reentrancyId);
  }

  async fireReminder(
    actorId: ActorId,
    reminderName: string,
    requestBody?: Buffer,
    activationId = "",
    reentrancyId?: string,
  ): Promise<void> {
    // @todo: make sure we are remindable
    const requestBodyDeserialized = this.serializer.deserialize(requestBody || Buffer.from(""));
    const reminderData = ActorReminderData.fromObject(reminderName, requestBodyDeserialized as object);
    await this.callActorMethod(actorId, REMINDER_METHOD_NAME, reminderData.state, activationId, reentrancyId);
  }

  async fireTimer(
    actorId: ActorId,
    timerName: string,
    requestBody?: Buffer,
    activationId = "",
    reentrancyId?: string,
  ): Promise<void> {
    // @todo: make sure we are remindable
    const requestBodyDeserialized = this.serializer.deserialize(requestBody || Buffer.from(""));
    const timerData = ActorTimerData.fromObject(timerName, requestBodyDeserialized as object);
    await this.callActorMethod(actorId, timerData.callback, timerData.state, activationId, reentrancyId);
  }

  async callActorMethod(
    actorId: ActorId,
    actorMethodName: string,
    args: any,
    activationId = "",
    reentrancyId?: string,
  ): Promise<Buffer> {
    // A new activation id drops the stale activation before waiting for the turn, so a call still
    // running on it skips its save. Its deactivation waits for a root turn so onDeactivate never
    // overlaps that call. A call already in the active reentrancy chain is not a new activation.
    return await this.callInTurn(actorId, activationId, reentrancyId, async (actorObject, lease) => {
      // Check if the actor method exists? Skip type-checking as it's the power of Javascript
      // @ts-ignore
      if (typeof actorObject[actorMethodName] !== "function") {
        throw new Error(
          JSON.stringify({
            error: "ACTOR_METHOD_DOES_NOT_EXIST",
            errorMsg: `The actor method '${actorMethodName}' does not exist on ${this.actorCls.name}`,
          }),
        );
      }

      // Matching call chains may enter only after activation has finished.
      lease.allowReentrancy();

      // Call the actor method, Skip type-checking as it's the power of Javascript
      await actorObject.onActorMethodPreInternal();

      let res;

      // If we have an array, we passed multiple parameters and should thus spread those
      if (Array.isArray(args)) {
        // @ts-ignore
        res = await actorObject[actorMethodName](...args);
      } else {
        // @ts-ignore
        res = await actorObject[actorMethodName](args);
      }

      await actorObject.onActorMethodPostInternal(() => this.ensureLive(actorId, actorObject));

      return res;
    });
  }

  /**
   * The header is ignored unless this actor type has reentrancy enabled.
   * Read at call time so a later `setActorRuntimeOptions` applies to managers already created.
   */
  private effectiveReentrancyId(reentrancyId: string | undefined): string | undefined {
    if (this.daprClient.options?.actor?.reentrancy?.enabled !== true) {
      return undefined;
    }
    return normalizeReentrancyId(reentrancyId);
  }

  /**
   * Admit a root call before awaiting the turn. `isInChain` calls pass an empty id, so a reentrant
   * frame cannot fence the actor its outer frame is still using.
   */
  private async callInTurn<TResult>(
    actorId: ActorId,
    activationId: string,
    reentrancyId: string | undefined,
    fn: (actor: T, lease: ActorTurnLease) => Promise<TResult>,
  ): Promise<TResult> {
    const effective = this.effectiveReentrancyId(reentrancyId);
    const inChain = this.turnLock.isInChain(actorId.getId(), effective);
    const admittedId = inChain ? "" : activationId;
    const admission = this.admit(actorId, admittedId);
    try {
      return await this.dispatchTurn(actorId, activationId, effective, inChain, admission, fn);
    } finally {
      if (admittedId) {
        this.releaseAdmission(actorId);
      }
    }
  }

  private async dispatchTurn<TResult>(
    actorId: ActorId,
    activationId: string,
    reentrancyId: string | undefined,
    inChain: boolean,
    admission: Admitted,
    fn: (actor: T, lease: ActorTurnLease) => Promise<TResult>,
  ): Promise<TResult> {
    let acquired: ActorTurnLease | Promise<ActorTurnLease>;
    try {
      acquired = this.turnLock.acquire(actorId.getId(), reentrancyId, inChain);
    } catch (error) {
      if (admission.detachedStale) {
        this.scheduleDetachedCleanup(actorId);
      }
      throw error;
    }

    // A free turn is not a Promise. Awaiting it would yield before this call holds the lease.
    const lease = acquired instanceof Promise ? await acquired : acquired;
    try {
      const actor = await this.actorForTurn(actorId, activationId, inChain, admission, lease);
      return await fn(actor, lease);
    } finally {
      // A sync throw or a rejected method must release the turn, or every later call on this id hangs.
      lease.release();
    }
  }

  /**
   * Reentrant frames keep the object the outer frame activated.
   * Replacing it would drop that frame's state manager while it is still running.
   */
  private async actorForTurn(
    actorId: ActorId,
    activationId: string,
    inChain: boolean,
    admission: Admitted,
    lease: ActorTurnLease,
  ): Promise<T> {
    if (lease.joinedExistingTurn) {
      if (admission.detachedStale) {
        this.scheduleDetachedCleanup(actorId);
      }
      const current = this.activeActors.get(actorId.getId());
      if (!current || current.replaced || current.blockSaves) {
        throw this.deactivatedDuringCall(actorId);
      }
      return current.actor;
    }

    if (inChain) {
      // Admitted into an active chain whose outer frame exited before opening reentrancy.
      // It skipped root admission, so it must not start a new activation or evict a newer one.
      throw this.deactivatedDuringCall(actorId);
    }

    await this.cleanupDetached(actorId);
    return await this.getOrActivate(actorId, activationId, admission.ticket);
  }

  private async withTurn<TResult>(
    actorId: ActorId,
    reentrancyId: string | undefined,
    join: boolean,
    fn: (lease: ActorTurnLease) => Promise<TResult>,
  ): Promise<TResult> {
    const acquired = this.turnLock.acquire(actorId.getId(), reentrancyId, join);
    const lease = acquired instanceof Promise ? await acquired : acquired;
    try {
      return await fn(lease);
    } finally {
      lease.release();
    }
  }

  // a call left over from a previous activation must not overwrite what the new one saved
  private ensureLive(actorId: ActorId, actor: T): void {
    const current = this.activeActors.get(actorId.getId());
    if (!current || current.actor !== actor || current.replaced || current.blockSaves) {
      throw this.deactivatedDuringCall(actorId);
    }
  }

  private deactivatedDuringCall(actorId: ActorId): Error {
    return new Error(
      JSON.stringify({
        error: "ACTOR_DEACTIVATED_DURING_CALL",
        errorMsg: `The actor ${actorId.getId()} was deactivated or replaced during the call, state not saved`,
      }),
    );
  }

  private notActivated(actorId: ActorId): Error {
    return new Error(
      JSON.stringify({
        error: "ACTOR_NOT_ACTIVATED",
        errorMsg: `The actor ${actorId.getId()} was not activated`,
      }),
    );
  }

  private admit(actorId: ActorId, activationId: string): Admitted {
    const ticket = ++this.admissions;
    if (!activationId) {
      return { ticket, detachedStale: false };
    }

    const id = actorId.getId();
    let admission = this.latest.get(id);
    if (!admission) {
      admission = { ticket, activationId, waiters: 0 };
      this.latest.set(id, admission);
    }
    admission.ticket = ticket;
    admission.activationId = activationId;
    admission.waiters += 1;
    return { ticket, detachedStale: this.detachStale(actorId, activationId) };
  }

  private releaseAdmission(actorId: ActorId): void {
    const admission = this.latest.get(actorId.getId());
    if (admission && --admission.waiters === 0) {
      this.latest.delete(actorId.getId());
    }
  }

  // Activation ids aren't ordered, so a different id that arrived after this call is the newer one.
  private isSuperseded(actorId: ActorId, activationId: string, ticket: number): boolean {
    if (!activationId) {
      return false;
    }
    const newer = this.latest.get(actorId.getId());
    return newer !== undefined && newer.ticket > ticket && newer.activationId !== activationId;
  }

  private async getOrActivate(actorId: ActorId, activationId: string, ticket: number): Promise<T> {
    if (this.isSuperseded(actorId, activationId, ticket)) {
      throw this.superseded(actorId);
    }
    this.detachStale(actorId, activationId);

    const existing = this.activeActors.get(actorId.getId());
    if (existing) {
      return this.settle(actorId, activationId, existing);
    }

    // A DELETE may have detached it since this turn's first cleanup.
    await this.cleanupDetached(actorId);
    if (this.isSuperseded(actorId, activationId, ticket)) {
      throw this.superseded(actorId);
    }
    return await this.activateActor(actorId, activationId, this.claim(actorId, activationId), ticket);
  }

  private settle(actorId: ActorId, activationId: string, registered: LiveActor<T>): T {
    if ((!activationId || registered.activationId === activationId) && !registered.replaced && !registered.blockSaves) {
      return registered.actor;
    }
    throw this.superseded(actorId);
  }

  /**
   * Drop a stale activation synchronously. The object stays out of `activeActors` so its save fails,
   * and `onDeactivate` is left queued for the root turn that already owns the lock or takes it next.
   */
  private detachStale(actorId: ActorId, activationId: string): boolean {
    if (!activationId) {
      return false;
    }

    const id = actorId.getId();
    const pending = this.activating.get(id);
    const existing = this.activeActors.get(id);
    const replacePending = pending !== undefined && pending.activationId !== activationId;
    const replaceExisting = existing !== undefined && existing.activationId !== activationId;
    // Same id, including one DELETE has already unregistered, keeps that generation so DELETE can save.
    // A different id takes ownership now, before either side awaits.
    if (
      replacePending ||
      replaceExisting ||
      this.othersDiffer(this.detached, id, activationId) ||
      this.othersDiffer(this.deactivating, id, activationId)
    ) {
      this.claim(actorId, activationId);
    }

    if (pending && pending.activationId !== activationId) {
      this.markReplaced(pending);
    }
    this.replaceOthers(this.detached, actorId, activationId);
    this.replaceOthers(this.deactivating, actorId, activationId);

    if (!replaceExisting || existing === undefined) {
      return false;
    }

    this.markReplaced(existing);
    if (this.activeActors.get(id) !== existing) {
      return false;
    }
    this.activeActors.delete(id);
    this.addDetached(actorId, existing);
    return true;
  }

  private othersDiffer(map: Map<string, LiveActor<T>[]>, id: string, activationId: string): boolean {
    const list = map.get(id);
    return list !== undefined && list.some((active) => active.activationId !== activationId);
  }

  private markReplaced(active: LiveActor<T>): void {
    active.replaced = true;
    active.blockSaves = true;
    active.actor.getStateManager().discard();
  }

  private replaceOthers(map: Map<string, LiveActor<T>[]>, actorId: ActorId, activationId: string): void {
    const list = map.get(actorId.getId());
    if (!list) {
      return;
    }
    for (const active of list) {
      if (active.activationId !== activationId) {
        this.markReplaced(active);
      }
    }
  }

  private unregisterForDelete(actorId: ActorId): LiveActor<T> | undefined {
    const id = actorId.getId();
    const current = this.activeActors.get(id);
    if (!current) {
      return undefined;
    }
    this.activeActors.delete(id);
    current.blockSaves = true;
    const owner = this.owners.get(id);
    if (owner?.generation === current.generation) {
      owner.removed = true;
    }
    this.addDetached(actorId, current);
    return current;
  }

  private addDetached(actorId: ActorId, active: LiveActor<T>): void {
    const id = actorId.getId();
    const list = this.detached.get(id);
    if (list) {
      list.push(active);
      return;
    }
    this.detached.set(id, [active]);
  }

  private hasDetached(actorId: ActorId): boolean {
    const id = actorId.getId();
    return (this.detached.get(id)?.length ?? 0) > 0 || (this.deactivating.get(id)?.length ?? 0) > 0;
  }

  // Runs in a root turn, so a detached activation is deactivated before the next one activates.
  private async cleanupDetached(actorId: ActorId, owned?: LiveActor<T>): Promise<void> {
    const id = actorId.getId();
    const list = this.detached.get(id);
    if (!list || list.length === 0) {
      return;
    }
    this.detached.delete(id);

    const tearingDown = this.deactivating.get(id) ?? [];
    tearingDown.push(...list);
    this.deactivating.set(id, tearingDown);

    let ownedError: unknown;
    try {
      for (const active of list) {
        if (active.replaced) {
          await this.deactivateStale(actorId, active);
          this.dropRemovedOwner(actorId, active);
          continue;
        }

        // DELETE fenced saves while it waited. Its own onDeactivate may save again unless a newer id won.
        active.blockSaves = false;
        try {
          await active.actor.onDeactivateInternal(
            () => this.owns(actorId, active.generation) && !active.replaced && !active.blockSaves,
          );
        } catch (err) {
          if (active !== owned) {
            this.logger.error(`Deactivating actor ${id} failed: ${err}`);
          } else {
            ownedError = err;
          }
        } finally {
          this.dropRemovedOwner(actorId, active);
        }
      }
    } finally {
      const current = this.deactivating.get(id);
      if (current) {
        for (const active of list) {
          const index = current.indexOf(active);
          if (index >= 0) {
            current.splice(index, 1);
          }
        }
        if (current.length === 0) {
          this.deactivating.delete(id);
        }
      }
    }

    if (ownedError) {
      throw ownedError;
    }
  }

  private async deactivateStale(actorId: ActorId, stale: LiveActor<T>): Promise<void> {
    try {
      await stale.actor.onDeactivateInternal(() => false);
    } catch (err) {
      this.logger.error(`Deactivating stale activation of actor ${actorId.getId()} failed: ${err}`);
    }
  }

  private dropRemovedOwner(actorId: ActorId, active: LiveActor<T>): void {
    const owner = this.owners.get(actorId.getId());
    if (owner && owner.generation === active.generation && owner.removed) {
      this.owners.delete(actorId.getId());
    }
  }

  private scheduleDetachedCleanup(actorId: ActorId): void {
    void this.withTurn(actorId, undefined, false, () => this.cleanupDetached(actorId)).catch((err) => {
      this.logger.error(`Deactivating detached actor ${actorId.getId()} failed: ${err}`);
    });
  }
}
