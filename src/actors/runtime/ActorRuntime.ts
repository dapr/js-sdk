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

import { DaprClient } from "../..";
import IClient from "../../interfaces/Client/IClient";
import Class from "../../types/Class";
import ActorId from "../ActorId";
import AbstractActor from "./AbstractActor";
import ActorManager from "./ActorManager";
import ActorRuntimeConfig from "./ActorRuntimeConfig";

/**
 * Creates instances of "Actor" and activates and deactivates "Actor"
 */
export default class ActorRuntime {
  private static instance: ActorRuntime;

  private readonly daprClient: DaprClient;
  private actorManagers: Map<string, ActorManager<any>>;
  private actorRuntimeConfig: ActorRuntimeConfig;

  // @todo: we need to make sure race condition cannot happen when accessing the active actors
  // NodeJS has an event loop (main thread -> runs JS code) and a worker pool (threadpool -> automatically created for offloading work through libuv) threads
  // we can have a new thread through the worker_thread module 
  // https://medium.com/@mohllal/node-js-multithreading-a5cd74958a67
  // 
  //
  // Python: asyncio.lock -> implements a mutex lock for asyncio tasks to guarantee exclusive access to a shared resource
  // Java: Collections.synchronizedMap -> is a thread-saf synchronized map to guarantee serial access
  // NodeJS: https://nodejs.org/api/worker_threads.html
  // actorManagersLock

  private constructor(daprClient: DaprClient) {
    this.daprClient = daprClient;
    this.actorRuntimeConfig = this.daprClient.options.actor ?? new ActorRuntimeConfig();
    this.actorManagers = new Map<string, ActorManager<any>>();
  }

  static getInstanceByDaprClient(daprClient: DaprClient): ActorRuntime {
    if (!ActorRuntime.instance) {
      ActorRuntime.instance = new ActorRuntime(daprClient);
    }

    return ActorRuntime.instance;
  }

  static getInstance(client: IClient): ActorRuntime {
    if (!ActorRuntime.instance) {
      const daprClient = DaprClient.create(client);
      ActorRuntime.instance = new ActorRuntime(daprClient);
    }

    return ActorRuntime.instance;
  }

  registerActor<T extends AbstractActor>(actorCls: Class<T>): void {
    // Create an ActorManager if it hasn't been registered yet
    if (!this.actorManagers.has(actorCls.name)) {
      this.actorManagers.set(actorCls.name, new ActorManager<T>(actorCls, this.daprClient));
    }
  }

  getRegisteredActorTypes(): string[] {
    return Array.from(this.actorManagers.keys());
  }

  getActorRuntimeConfig(): ActorRuntimeConfig {
    return this.actorRuntimeConfig;
  }

  setActorRuntimeConfig(config: ActorRuntimeConfig): void {
    this.actorRuntimeConfig = config;
  }

  clearActorManagers(): void {
    this.actorManagers = new Map<string, ActorManager<any>>();
  }

  getActorManager<T extends AbstractActor>(actorTypeName: string): ActorManager<T> {
    const actorManager = this.actorManagers.get(actorTypeName);

    if (!actorManager) {
      throw new Error(`ACTOR_TYPE_${actorTypeName}_NOT_REGISTERED`);
    }

    // We need to cast to ActorManager<T> since Map actorManagers
    // is initialized with ActorManager<any> since we don't know the type there
    return actorManager as ActorManager<T>;
  }

  /**
   * Invokes a method on the actor from the runtime
   * This method will open the manager for the actor type and get the matching object
   * It will then invoke the method on this object
   * 
   * @param actorTypeName 
   * @param actorId 
   * @param actorMethodName 
   * @param payload 
   * @returns 
   */
  async invoke(actorTypeName: string, actorId: string, actorMethodName: string, requestBody?: Buffer): Promise<Buffer> {
    const actorIdObj = new ActorId(actorId);
    const manager = this.getActorManager(actorTypeName);
    return await manager.invoke(actorIdObj, actorMethodName, requestBody);
  }

  /**
   * Fires a reminder for the actor
   * 
   * @param actorTypeName the name fo the actor type
   * @param actorId the actor id
   * @param name the name of the reminder
   * @param requestBody the body passed to the reminder callback
   */
  async fireReminder(actorTypeName: string, actorId: string, name: string, requestBody?: Buffer) {
    const actorIdObj = new ActorId(actorId);
    const manager = this.getActorManager(actorTypeName);
    return await manager.fireReminder(actorIdObj, name, requestBody);
  }

  /**
   * Fires a timer for the actor
   * 
   * @param actorTypeName the name fo the actor type
   * @param actorId the actor id
   * @param name the name of the timer
   * @param requestBody the body passed to the timer callback
   */
  async fireTimer(actorTypeName: string, actorId: string, name: string, requestBody?: Buffer) {
    const actorIdObj = new ActorId(actorId);
    const manager = this.getActorManager(actorTypeName);
    return await manager.fireTimer(actorIdObj, name, requestBody);
  }

  async deactivate(actorTypeName: string, actorId: string): Promise<void> {
    const actorIdObj = new ActorId(actorId);
    const manager = this.getActorManager(actorTypeName);
    return await manager.deactivateActor(actorIdObj);
  }
}