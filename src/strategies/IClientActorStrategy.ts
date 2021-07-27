import { ActorReminderType } from "../types/ActorReminder.type";
import { ActorTimerType } from "../types/ActorTimer.type";
import { KeyValueType } from "../types/KeyValue.type";
import { OperationType } from "../types/Operation.type";

export default interface IClientActorStrategy {
    invoke(method: "GET" | "POST" | "PUT" | "DELETE", actorType: string, actorId: string, methodName: string, body?: object): Promise<object>;
    stateTransaction(actorType: string, actorId: string, operations: OperationType[]): Promise<void>;
    stateGet(actorType: string, actorId: string, key: string): Promise<KeyValueType | string>;
    reminderCreate(actorType: string, actorId: string, name: string, reminder: ActorReminderType): Promise<void>;
    reminderDelete(actorType: string, actorId: string, name: string): Promise<void>;
    timerCreate(actorType: string, actorId: string, name: string, timer: ActorTimerType): Promise<void>;
    timerDelete(actorType: string, actorId: string, name: string): Promise<void>;
    getActors(): Promise<object>;
}