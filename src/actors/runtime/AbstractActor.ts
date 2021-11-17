import { Temporal } from "@js-temporal/polyfill";
import DaprClient from "../../implementation/Client/DaprClient";
import HTTPClientActor from "../../implementation/Client/HTTPClient/actor";
import HTTPClient from "../../implementation/Client/HTTPClient/HTTPClient";
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

  /**
   * Instantiates a new Actor
   * 
   * @param runtimeContext context for the runtime
   * @param id actor identifier
   */
  constructor(daprClient: DaprClient, id: ActorId) {
    this.daprClient = daprClient;
    this.actorClient = new ActorClient(daprClient);

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
   * @param dueTime due time for the first trigger
   * @param period frequency for the triggers
   * @param <Type> Type of the state object
   * @return Async void response
   */
  async registerReminder<Type>(reminderName: string, dueTime: Temporal.Duration, period: Temporal.Duration, state?: any) {
    await this.actorClient.actor.reminderCreate(this.actorType, this.id.getId(), reminderName, {
      period,
      dueTime,
      data: state
    });
  }

  async unregisterReminder(reminderName: string) {
    await this.actorClient.actor.reminderDelete(this.actorType, this.id.getId(), reminderName);
  }

  async registerTimer(timerName: string, callback: string, dueTime: Temporal.Duration, period: Temporal.Duration, state?: any) {
    // Register the timer in the sidecar
    // console.log(`actorType: ${this.actorType}, actorId: ${this.id.getId()}, timerName: ${timerName}, callback: ${callback}, dueTime: ${dueTime.toString()}, period: ${period.toString()}`);
    return await this.actorClient.actor.timerCreate(this.actorType, this.id.getId(), timerName, {
      period,
      dueTime,
      data: state,
      callback
    });
  }

  async unregisterTimer(timerName: string) {
    await this.actorClient.actor.timerDelete(this.actorType, this.id.getId(), timerName);
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

  async receiveReminder(data: string): Promise<void> {
    console.warn(JSON.stringify({
      error: "ACTOR_METHOD_NOT_IMPLEMENTED",
      errorMsg: `A reminder was created for the actor with id: ${this.id.getId()} but the method 'receiveReminder' was not implemented`,
    }));
  }

  getDaprClient(): DaprClient {
    return this.daprClient;
  }

  getStateProvider(): StateProvider {
    return this.daprStateProvider;
  }

  getStateManager(): ActorStateManager<any> {
    return this.stateManager;
  }

  getId(): string {
    return this.id.getId();
  }

  getActorId(): ActorId {
    return this.id;
  }

  getActorType(): any {
    return this.actorType;
  }
}