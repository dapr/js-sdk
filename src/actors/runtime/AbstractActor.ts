import ActorId from "../ActorId";
import ActorStateManager from "./ActorStateManager";

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
  stateManager: ActorStateManager;
  id: ActorId;
  
  /**
   * Instantiates a new Actor
   * 
   * @param runtimeContext context for the runtime
   * @param id actor identifier
   */
  constructor(id: ActorId) {
    this.id = id;
    this.stateManager = new ActorStateManager(this);
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
  // async registerReminder<Type>(reminderName: string, state: Buffer, dueTime: string, period: string) {
  //   const actorType = this.runtimeCtx.actorTypeInfo.name;
  //   await this.runtimeCtx.daprClient.actor.reminderCreate(actorType, this.id.id, reminderName, {
  //     period,
  //     dueTime,
  //     data: state
  //   });
  // }

  // async unregisterReminder(reminderName: string) {
  //   const actorType = this.runtimeCtx.actorTypeInfo.name;
  //   await this.runtimeCtx.daprClient.actor.reminderDelete(actorType, this.id.id, reminderName);
  // }
}