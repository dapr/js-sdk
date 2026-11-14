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

/**
 * The Actor Manager manages actor objects of a specific actor type
 */
const REMINDER_METHOD_NAME = "receiveReminder"; // the callback method name for the reminder

export default class ActorManager<T extends AbstractActor> {
  readonly actorCls: Class<T>;
  readonly daprClient: DaprClient;
  readonly serializer: BufferSerializer = new BufferSerializer();

  actors: Map<string, T>;

  // One turn per actor id. The sidecar drops its lock when the caller cancels; this one does not.
  private readonly turnLock = new ActorTurnLock();

  constructor(actorCls: Class<T>, daprClient: DaprClient) {
    this.daprClient = daprClient;
    this.actorCls = actorCls;

    this.actors = new Map<string, T>();
  }

  /**
   * Actor ids that still have a turn-lock entry.
   * Idle ids are removed, including after deactivation, so the table does not grow without bound.
   */
  turnLockSize(): number {
    return this.turnLock.size;
  }

  async createActor(actorId: ActorId): Promise<T> {
    return new this.actorCls(this.daprClient, actorId);
  }

  async activateActor(actorId: ActorId): Promise<void> {
    const actor = await this.createActor(actorId);

    // We activate the actor by calling the onActivateInternal method on it
    // this will create its state object
    await actor.onActivateInternal();

    this.actors.set(actorId.getId(), actor);
  }

  async deactivateActor(actorId: ActorId): Promise<void> {
    // Deactivation is its own turn. A reentrancy id must not let it overlap a running method.
    await this.runInTurn(actorId, undefined, async () => {
      const actor = this.actors.get(actorId.getId());
      if (!actor) {
        throw new Error(
          JSON.stringify({
            error: "ACTOR_NOT_ACTIVATED",
            errorMsg: `The actor ${actorId.getId()} was not activated`,
          }),
        );
      }

      await actor.onDeactivateInternal();
      this.actors.delete(actorId.getId());
    });
  }

  async getActiveActor(actorId: ActorId): Promise<T> {
    if (!this.actors.has(actorId.getId())) {
      await this.activateActor(actorId);
    }

    const actor = this.actors.get(actorId.getId());

    if (!actor) {
      throw new Error(`${actorId.getId()} was not activated correctly`);
    }

    return actor;
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
  async invoke(actorId: ActorId, actorMethodName: string, requestBody?: Buffer, reentrancyId?: string): Promise<any> {
    const requestBodyDeserialized = this.serializer.deserialize(requestBody || Buffer.from(""));
    return await this.callActorMethod(actorId, actorMethodName, requestBodyDeserialized, reentrancyId);
  }

  async fireReminder(
    actorId: ActorId,
    reminderName: string,
    requestBody?: Buffer,
    reentrancyId?: string,
  ): Promise<void> {
    // @todo: make sure we are remindable
    const requestBodyDeserialized = this.serializer.deserialize(requestBody || Buffer.from(""));
    const reminderData = ActorReminderData.fromObject(reminderName, requestBodyDeserialized as object);
    await this.callActorMethod(actorId, REMINDER_METHOD_NAME, reminderData.state, reentrancyId);
  }

  async fireTimer(actorId: ActorId, timerName: string, requestBody?: Buffer, reentrancyId?: string): Promise<void> {
    // @todo: make sure we are remindable
    const requestBodyDeserialized = this.serializer.deserialize(requestBody || Buffer.from(""));
    const timerData = ActorTimerData.fromObject(timerName, requestBodyDeserialized as object);
    await this.callActorMethod(actorId, timerData.callback, timerData.state, reentrancyId);
  }

  async callActorMethod(actorId: ActorId, actorMethodName: string, args: any, reentrancyId?: string): Promise<Buffer> {
    return await this.runInTurn(actorId, reentrancyId, async (lease) => {
      const actorObject = await this.getActiveActor(actorId);

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

      await actorObject.onActorMethodPostInternal();

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

  private async runInTurn<TResult>(
    actorId: ActorId,
    reentrancyId: string | undefined,
    fn: (lease: ActorTurnLease) => Promise<TResult>,
  ): Promise<TResult> {
    const lease = await this.turnLock.acquire(actorId.getId(), this.effectiveReentrancyId(reentrancyId));
    try {
      return await fn(lease);
    } finally {
      // A sync throw or a rejected method must release the turn, or every later call on this id hangs.
      lease.release();
    }
  }
}
