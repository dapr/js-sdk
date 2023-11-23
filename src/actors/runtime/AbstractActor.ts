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

import { Temporal } from "@js-temporal/polyfill";
import DaprClient from "../../implementation/Client/DaprClient";
import { Logger } from "../../logger/Logger";
import ActorId from "../ActorId";
import ActorClient from "../client/ActorClient/ActorClient";
import ActorStateManager from "./ActorStateManager";
import StateProvider from "./StateProvider";

/**
 * Represents the base class for actors.
 * The base type for actors, that provides the common functionality for actors.
 * The state is preserved across actor garbage collections and fail-overs.
 *
 * Example
 *
 * export default interface IDemoCounterActor extends IActor {
 *   increment(amount: number): void;
 * }
 *
 * export default class DemoActorImpl extends AbstractActor implements IDemoActor {
 *   increment(amount: number): void {
 *     throw new Error("Method not implemented.");
 *   }
 * }
 */
export default abstract class AbstractActor {
  private readonly stateManager: ActorStateManager<any>;
  private readonly id: ActorId;
  private readonly daprClient: DaprClient;
  private readonly actorClient: ActorClient;
  private readonly daprStateProvider: StateProvider;
  private readonly actorType: any; // set at constructor level
  private readonly logger: Logger;

  /**
   * Instantiates a new Actor
   *
   * @param runtimeContext context for the runtime
   * @param id actor identifier
   */
  constructor(daprClient: DaprClient, id: ActorId) {
    this.daprClient = daprClient;
    this.actorClient = new ActorClient(
      daprClient.options.daprHost,
      daprClient.options.daprPort,
      daprClient.options.communicationProtocol,
      daprClient.options,
    );
    this.logger = new Logger("Actors", "AbstractActor", daprClient.options.logger);
    this.id = id;

    this.stateManager = new ActorStateManager(this);
    this.daprStateProvider = new StateProvider(this.actorClient);

    // Interesting one: get the Class Type of the child
    this.actorType = this.constructor.name;
  }

  /**
   * Registers a reminder for this actor
   *
   * Reminders are a mechanism to trigger persistent callbacks on an actor at specified times.
   * Their functionality is similar to timers. But unlike timers, reminders are triggered under
   * all circumstances until the actor explicitly unregisters them or the actor is explicitly
   * deleted. Specifically, reminders are triggered across actor deactivations and failovers
   * because the Actors runtime persists information about the actor's reminders using actor
   * state provider. Also existing reminders can be updated by calling this registration method
   * again using the same reminderName.
   *
   * @todo:
   * https://github.com/dapr/java-sdk/blob/master/sdk-actors/src/main/java/io/dapr/actors/runtime/AbstractActor.java
   * https://github.com/dapr/python-sdk/blob/46c5664d2e75c20122120dab3be882c4d059a987/dapr/actor/runtime/actor.py#L93
   *
   * @param reminderName name of the reminder
   * @param state the state to be send along with the reminder trigger
   * @param dueTime Specifies the time after which the reminder is invoked
   * @param period Specifies the period between different invocations
   * @param ttl time to duration after which the reminder will be expired and deleted
   * @param <Type> Type of the state object
   * @return Async void response
   */
  async registerActorReminder<_Type>(
    reminderName: string,
    dueTime: Temporal.Duration,
    period?: Temporal.Duration,
    ttl?: Temporal.Duration,
    state?: any,
  ) {
    await this.actorClient.actor.registerActorReminder(this.actorType, this.id, reminderName, {
      period,
      dueTime,
      ttl,
      data: state,
    });
  }

  async unregisterActorReminder(reminderName: string) {
    await this.actorClient.actor.unregisterActorReminder(this.actorType, this.id, reminderName);
  }

  async registerActorTimer(
    timerName: string,
    callback: string,
    dueTime: Temporal.Duration,
    period?: Temporal.Duration,
    ttl?: Temporal.Duration,
    state?: any,
  ) {
    // Register the timer in the sidecar
    return await this.actorClient.actor.registerActorTimer(this.actorType, this.id, timerName, {
      period,
      dueTime,
      ttl,
      data: state,
      callback,
    });
  }

  async unregisterActorTimer(timerName: string) {
    await this.actorClient.actor.unregisterActorTimer(this.actorType, this.id, timerName);
  }

  /**
   * Clears all state cache, calls the overridden onActivate and then saves the states
   * This method gets called when the actor is activated
   * Note: we require this to save the state so that we know the actor got activated!
   */
  async onActivateInternal(): Promise<void> {
    await this.resetStateInternal();
    await this.onActivate();
    await this.saveStateInternal();
  }

  /**
   * Clears all state cache and calls the overridden method onDeactivate
   * This callback is called when an actor is deactivated
   */
  async onDeactivateInternal(): Promise<void> {
    await this.resetStateInternal();
    await this.onDeactivate();
    await this.saveStateInternal();
  }

  /**
   * Calls the onActorMethodPre hook on the actor implementation
   * This gets called just before executing a method
   */
  async onActorMethodPreInternal(): Promise<void> {
    await this.onActorMethodPre();
  }

  /**
   * Calls the onActorMethodPost hook on the actor implementation
   * This gets called just after executing a method
   * It also persists the state changes of the actor
   */
  async onActorMethodPostInternal(): Promise<void> {
    await this.onActorMethodPost();

    // We need to save the state of the actor
    await this.saveStateInternal();
  }

  /**
   * This will be called when an actor method invocation failed or the actor is activated
   */
  async resetStateInternal(): Promise<void> {
    await this.stateManager.clearCache();
  }

  /**
   * Saves all the state changes (ADD/UPDATE/REMOVE) that were made since the last call
   * to the actor state provider associated with teh actor
   */
  async saveStateInternal(): Promise<void> {
    await this.stateManager.saveState();
  }

  /**
   * This method gets called right after an actor gets activated
   * and before a method call or reminders are dispatched on it
   */
  async onActivate(): Promise<void> {
    return;
  }

  /**
   * This method gets called right before an actor gets deactivated
   */
  async onDeactivate(): Promise<void> {
    return;
  }

  /**
   * Gets called before executing a method
   * @returns
   */
  async onActorMethodPre(): Promise<void> {
    return;
  }

  /**
   * Gets called after executing a method
   * @returns
   */
  async onActorMethodPost(): Promise<void> {
    return;
  }

  async receiveReminder(_data: string): Promise<void> {
    this.logger.warn(
      JSON.stringify({
        error: "ACTOR_METHOD_NOT_IMPLEMENTED",
        errorMsg: `A reminder was created for the actor with id: ${this.id} but the method 'receiveReminder' was not implemented`,
      }),
    );
  }

  getDaprClient(): DaprClient {
    return this.daprClient;
  }

  getStateProvider(): StateProvider {
    return this.daprStateProvider;
  }

  getStateManager<T>(): ActorStateManager<T> {
    return this.stateManager;
  }

  getActorId(): ActorId {
    return this.id;
  }

  getActorType(): any {
    return this.actorType;
  }
}
