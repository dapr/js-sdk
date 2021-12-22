import { ActorReminderType } from "../../types/ActorReminder.type";
import { ActorTimerType } from "../../types/ActorTimer.type";
import { KeyValueType } from "../../types/KeyValue.type";
import { OperationType } from "../../types/Operation.type";

export default interface IClientActor {
  invoke(actorType: string, actorId: string, methodName: string, body?: any): Promise<object>;
  stateTransaction(actorType: string, actorId: string, operations: OperationType[]): Promise<void>;
  stateGet(actorType: string, actorId: string, key: string): Promise<KeyValueType | string>;
  registerActorReminder(actorType: string, actorId: string, name: string, reminder: ActorReminderType): Promise<void>;
  unregisterActorReminder(actorType: string, actorId: string, name: string): Promise<void>;
  registerActorTimer(actorType: string, actorId: string, name: string, timer: ActorTimerType): Promise<void>;
  unregisterActorTimer(actorType: string, actorId: string, name: string): Promise<void>;
  getActors(): Promise<object>;
}