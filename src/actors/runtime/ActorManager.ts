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
import BufferSerializer from "./BufferSerializer";
import { Logger } from "../../logger/Logger";

/**
 * The Actor Manager manages actor objects of a specific actor type
 */
const REMINDER_METHOD_NAME = "receiveReminder"; // the callback method name for the reminder

export default class ActorManager<T extends AbstractActor> {
  readonly actorCls: Class<T>;
  readonly daprClient: DaprClient;
  readonly serializer: BufferSerializer = new BufferSerializer();
  private readonly logger: Logger;

  actors: Map<string, T>;
  activationIds: Map<string, string>;

  // dispatcher: ActorMethodDispatcher<T>;
  // timerMethodContext: any;
  // reminderMethodContext: any;

  constructor(actorCls: Class<T>, daprClient: DaprClient) {
    this.daprClient = daprClient;
    this.actorCls = actorCls;
    this.logger = new Logger("Actors", "ActorManager", daprClient.options.logger);

    this.actors = new Map<string, T>();
    this.activationIds = new Map<string, string>();

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

  async createActor(actorId: ActorId): Promise<T> {
    return new this.actorCls(this.daprClient, actorId);
  }

  async activateActor(actorId: ActorId, activationId = ""): Promise<T> {
    const actor = await this.createActor(actorId);

    // We activate the actor by calling the onActivateInternal method on it
    // this will create its state object
    await actor.onActivateInternal(this.noneRegistered(actorId));

    // another call may have registered an object while this one was activating
    const registered = this.actors.get(actorId.getId());
    if (!registered) {
      this.actors.set(actorId.getId(), actor);
      this.activationIds.set(actorId.getId(), activationId);
      return actor;
    }

    const registeredId = this.activationIds.get(actorId.getId());
    await this.deactivateDiscarded(actorId, actor);
    if (activationId && activationId !== registeredId) {
      throw new Error(
        JSON.stringify({
          error: "ACTOR_ACTIVATION_SUPERSEDED",
          errorMsg: `The actor ${actorId.getId()} was activated by activation ${registeredId} during this activation`,
        }),
      );
    }
    return registered;
  }

  async deactivateActor(actorId: ActorId): Promise<void> {
    if (!this.actors.has(actorId.getId())) {
      throw new Error(
        JSON.stringify({
          error: "ACTOR_NOT_ACTIVATED",
          errorMsg: `The actor ${actorId.getId()} was not activated`,
        }),
      );
    }

    const actor = await this.getActiveActor(actorId);
    this.forget(actorId);
    await actor.onDeactivateInternal(this.noneRegistered(actorId));
  }

  // an unregistered object must not overwrite the registered one's state
  private noneRegistered(actorId: ActorId): () => boolean {
    return () => !this.actors.has(actorId.getId());
  }

  private forget(actorId: ActorId): void {
    this.actors.delete(actorId.getId());
    this.activationIds.delete(actorId.getId());
  }

  private async deactivateDiscarded(actorId: ActorId, actor: T): Promise<void> {
    try {
      await actor.onDeactivateInternal(() => false);
    } catch (err) {
      this.logger.error(`Deactivating discarded object for actor ${actorId.getId()} failed: ${err}`);
    }
  }

  async getActiveActor(actorId: ActorId, activationId = ""): Promise<T> {
    const current = this.actors.get(actorId.getId());
    if (current) {
      if (!activationId || this.activationIds.get(actorId.getId()) === activationId) {
        return current;
      }

      // a new activation id means daprd reactivated the actor, so this object is stale
      this.forget(actorId);
      await this.deactivateDiscarded(actorId, current);
    }

    return await this.activateActor(actorId, activationId);
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
  async invoke(actorId: ActorId, actorMethodName: string, requestBody?: Buffer, activationId = ""): Promise<any> {
    const requestBodyDeserialized = this.serializer.deserialize(requestBody || Buffer.from(""));
    return await this.callActorMethod(actorId, actorMethodName, requestBodyDeserialized, activationId);
  }

  async fireReminder(actorId: ActorId, reminderName: string, requestBody?: Buffer, activationId = ""): Promise<void> {
    // @todo: make sure we are remindable
    const requestBodyDeserialized = this.serializer.deserialize(requestBody || Buffer.from(""));
    const reminderData = ActorReminderData.fromObject(reminderName, requestBodyDeserialized as object);
    await this.callActorMethod(actorId, REMINDER_METHOD_NAME, reminderData.state, activationId);
  }

  async fireTimer(actorId: ActorId, timerName: string, requestBody?: Buffer, activationId = ""): Promise<void> {
    // @todo: make sure we are remindable
    const requestBodyDeserialized = this.serializer.deserialize(requestBody || Buffer.from(""));
    const timerData = ActorTimerData.fromObject(timerName, requestBodyDeserialized as object);
    await this.callActorMethod(actorId, timerData.callback, timerData.state, activationId);
  }

  async callActorMethod(actorId: ActorId, actorMethodName: string, args: any, activationId = ""): Promise<Buffer> {
    const actorObject = await this.getActiveActor(actorId, activationId);

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

    // @todo: actor reentrancy

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
  }

  // a call left over from a previous activation must not overwrite what the new one saved
  private ensureLive(actorId: ActorId, actor: T): void {
    if (this.actors.get(actorId.getId()) !== actor) {
      throw new Error(
        JSON.stringify({
          error: "ACTOR_DEACTIVATED_DURING_CALL",
          errorMsg: `The actor ${actorId.getId()} was deactivated or replaced during the call, state not saved`,
        }),
      );
    }
  }
}
