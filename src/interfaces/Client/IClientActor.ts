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

import ActorId from "../../actors/ActorId";
import { ActorReminderType } from "../../types/ActorReminder.type";
import { ActorTimerType } from "../../types/ActorTimer.type";
import { KeyValueType } from "../../types/KeyValue.type";
import { ActorStateTransactionType } from "../../types/actors/ActorStateTransaction.type";

export default interface IClientActor {
  invoke(actorType: string, actorId: ActorId, methodName: string, body?: any): Promise<object>;
  stateTransaction(actorType: string, actorId: ActorId, operations: ActorStateTransactionType[]): Promise<void>;
  stateGet(actorType: string, actorId: ActorId, key: string): Promise<KeyValueType | string>;
  registerActorReminder(actorType: string, actorId: ActorId, name: string, reminder: ActorReminderType): Promise<void>;
  unregisterActorReminder(actorType: string, actorId: ActorId, name: string): Promise<void>;
  registerActorTimer(actorType: string, actorId: ActorId, name: string, timer: ActorTimerType): Promise<void>;
  unregisterActorTimer(actorType: string, actorId: ActorId, name: string): Promise<void>;
  getActors(): Promise<object>;
}
