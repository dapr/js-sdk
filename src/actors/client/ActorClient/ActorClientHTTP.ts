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

import HTTPClient from "../../../implementation/Client/HTTPClient/HTTPClient";
import { OperationType } from "../../../types/Operation.type";
import { ActorReminderType } from "../../../types/ActorReminder.type";
import { ActorTimerType } from "../../../types/ActorTimer.type";
import IClientActor from "../../../interfaces/Client/IClientActor";
import { KeyValueType } from "../../../types/KeyValue.type";
import ActorId from "../../ActorId";

// https://docs.dapr.io/reference/api/actors_api/
export default class ActorClientHTTP implements IClientActor {
  client: HTTPClient;

  constructor(client: HTTPClient) {
    this.client = client;
  }

  async invoke(actorType: string, actorId: ActorId, methodName: string, body?: any): Promise<object> {
    const result = await this.client.execute(`/actors/${actorType}/${actorId.getURLSafeId()}/method/${methodName}`, {
      method: "POST", // we always use POST calls for Invoking (ref: https://github.com/dapr/js-sdk/pull/137#discussion_r772636068)
      body,
    });

    return result as object;
  }

  async stateTransaction(actorType: string, actorId: ActorId, operations: OperationType[]): Promise<void> {
    await this.client.execute(`/actors/${actorType}/${actorId.getURLSafeId()}/state`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: operations,
    });
  }

  async stateGet(actorType: string, actorId: ActorId, key: string): Promise<KeyValueType | string> {
    const result = await this.client.execute(`/actors/${actorType}/${actorId.getURLSafeId()}/state/${key}`);
    return result as any;
  }

  async registerActorReminder(
    actorType: string,
    actorId: ActorId,
    name: string,
    reminder: ActorReminderType,
  ): Promise<void> {
    await this.client.execute(`/actors/${actorType}/${actorId.getURLSafeId()}/reminders/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        period: reminder?.period?.toString()?.toLocaleLowerCase().replace("pt", ""),
        dueTime: reminder?.dueTime?.toString()?.toLocaleLowerCase().replace("pt", ""),
        ttl: reminder?.ttl?.toString()?.toLocaleLowerCase().replace("pt", ""),
        data: reminder.data,
      },
    });
  }

  async reminderGet(actorType: string, actorId: ActorId, name: string): Promise<object> {
    const result = await this.client.execute(`/actors/${actorType}/${actorId.getURLSafeId()}/reminders/${name}`);
    return result as object;
  }

  async unregisterActorReminder(actorType: string, actorId: ActorId, name: string): Promise<void> {
    await this.client.execute(`/actors/${actorType}/${actorId.getURLSafeId()}/reminders/${name}`, {
      method: "DELETE",
    });
  }

  async registerActorTimer(actorType: string, actorId: ActorId, name: string, timer: ActorTimerType): Promise<void> {
    await this.client.execute(`/actors/${actorType}/${actorId.getURLSafeId()}/timers/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        period: timer?.period?.toString()?.toLocaleLowerCase().replace("pt", ""),
        dueTime: timer?.dueTime?.toString()?.toLocaleLowerCase().replace("pt", ""),
        ttl: timer?.ttl?.toString()?.toLocaleLowerCase().replace("pt", ""),
        data: timer.data,
        callback: timer.callback,
      },
    });
  }

  async unregisterActorTimer(actorType: string, actorId: ActorId, name: string): Promise<void> {
    await this.client.execute(`/actors/${actorType}/${actorId.getURLSafeId()}/timers/${name}`, {
      method: "DELETE",
    });
  }

  async deactivate(actorType: string, actorId: ActorId): Promise<void> {
    await this.client.execute(`/actors/${actorType}/${actorId.getURLSafeId()}`, {
      method: "DELETE",
    });
  }

  async getActors(): Promise<object> {
    const result = await this.client.execute(`replace('/v1.0', '')}/dapr/config`);
    return result as object;
  }
}
