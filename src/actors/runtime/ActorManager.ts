import { v4 as uuidv4 } from "uuid";
import DaprClient from "../../implementation/Client/DaprClient";
import IClient from "../../interfaces/Client/IClient";
import Class from "../../types/Class";
import ActorId from "../ActorId";
import AbstractActor from "./AbstractActor";
import ActorReminderData from "./ActorReminderData";
import ActorTimerData from "./ActorTimerData";
import BufferSerializer from "./BufferSerializer";

/**
 * The Actor Manager manages actor objects of a specific actor type
 */
const REMINDER_METHOD_NAME = 'receiveReminder'; // the callback method name for the reminder

export default class ActorManager<T extends AbstractActor> {
  readonly actorCls: Class<T>;
  readonly daprClient: DaprClient;
  readonly serializer: BufferSerializer = new BufferSerializer();

  actors: Map<string, T>;

  // dispatcher: ActorMethodDispatcher<T>;
  // timerMethodContext: any;
  // reminderMethodContext: any;

  constructor(actorCls: Class<T>, daprClient: DaprClient) {
    this.daprClient = daprClient;
    this.actorCls = actorCls;

    this.actors = new Map<string, T>();

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

  async activateActor(actorId: ActorId): Promise<void> {
    const actor = await this.createActor(actorId);

    // We activate the actor by calling the onActivateInternal method on it
    // this will create its state object
    await actor.onActivateInternal();

    this.actors.set(actorId.getId(), actor);
  }

  async deactivateActor(actorId: ActorId): Promise<void> {
    if (!this.actors.has(actorId.getId())) {
      throw new Error(JSON.stringify({
        error: 'ACTOR_NOT_ACTIVATED',
        errorMsg: `The actor ${actorId.getId()} was not activated`
      }));
    }
    
    const actor = await this.getActiveActor(actorId);
    await actor.onDeactivateInternal();

    this.actors.delete(actorId.getId());
  }

  async getActiveActor(actorId: ActorId): Promise<T> {
    if (!this.actors.has(actorId.getId())) {
      // console.log(`Doesn't have active actor (${actorId.getId()}), activating it`);
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
  async invoke(actorId: ActorId, actorMethodName: string, requestBody?: Buffer): Promise<any> {
    const requestBodyDeserialized = this.serializer.deserialize(requestBody || Buffer.from(""));
    return await this.callActorMethod(actorId, actorMethodName, requestBodyDeserialized);
  }

  async fireReminder(actorId: ActorId, reminderName: string, requestBody?: Buffer): Promise<void> {
    // @todo: make sure we are remindable
    const requestBodyDeserialized = this.serializer.deserialize(requestBody || Buffer.from(""));
    const reminderData = ActorReminderData.fromObject(reminderName, requestBodyDeserialized as object);
    await this.callActorMethod(actorId, REMINDER_METHOD_NAME, reminderData.state);
  }

  async fireTimer(actorId: ActorId, timerName: string, requestBody?: Buffer): Promise<void> {
    // @todo: make sure we are remindable
    const requestBodyDeserialized = this.serializer.deserialize(requestBody || Buffer.from(""));
    const timerData = ActorTimerData.fromObject(timerName, requestBodyDeserialized as object);
    await this.callActorMethod(actorId, timerData.callback, timerData.state);
  }

  async callActorMethod(actorId: ActorId, actorMethodName: string, ...args: any): Promise<Buffer> {
    const actorObject = await this.getActiveActor(actorId);

    // Check if the actor method exists? Skip type-checking as it's the power of Javascript
    // @ts-ignore
    if (typeof actorObject[actorMethodName] !== "function") {
      throw new Error(JSON.stringify({
        error: 'ACTOR_METHOD_DOES_NOT_EXIST',
        errorMsg: `The actor method '${actorMethodName}' does not exist on ${this.actorCls.name}`
      }));
    }

    // @todo: actor reentrancy

    // Call the actor method, Skip type-checking as it's the power of Javascript
    await actorObject.onActorMethodPreInternal();
    // @ts-ignore
    const res = await actorObject[actorMethodName](...args);
    await actorObject.onActorMethodPostInternal();

    return res;
  }
}