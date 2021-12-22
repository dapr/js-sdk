import HTTPClient from '../../../implementation/Client/HTTPClient/HTTPClient';
import { OperationType } from '../../../types/Operation.type';
import { ActorReminderType } from '../../../types/ActorReminder.type';
import { ActorTimerType } from '../../../types/ActorTimer.type';
import IClientActor from '../../../interfaces/Client/IClientActor';
import { KeyValueType } from '../../../types/KeyValue.type';

// https://docs.dapr.io/reference/api/actors_api/
export default class ActorClientHTTP implements IClientActor {
  client: HTTPClient;

  constructor(client: HTTPClient) {
    this.client = client;
  }

  async invoke(actorType: string, actorId: string, methodName: string, body?: any): Promise<object> {
    const result = await this.client.execute(`/actors/${actorType}/${actorId}/method/${methodName}`, {
      method: "POST", // we always use POST calls for Invoking (ref: https://github.com/dapr/js-sdk/pull/137#discussion_r772636068)
      body
    });

    return result as object;
  }

  async stateTransaction(actorType: string, actorId: string, operations: OperationType[]): Promise<void> {
    await this.client.execute(`/actors/${actorType}/${actorId}/state`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(operations)
    });
  }

  async stateGet(actorType: string, actorId: string, key: string): Promise<KeyValueType | string> {
    const result = await this.client.execute(`/actors/${actorType}/${actorId}/state/${key}`);
    return result as any;
  }

  async registerActorReminder(actorType: string, actorId: string, name: string, reminder: ActorReminderType): Promise<void> {
    await this.client.execute(`/actors/${actorType}/${actorId}/reminders/${name}`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        period: reminder.period.toString().toLocaleLowerCase().replace('pt', ''),
        dueTime: reminder?.dueTime?.toString()?.toLocaleLowerCase().replace('pt', ''),
        data: reminder.data
      }),
    });
  }

  async reminderGet(actorType: string, actorId: string, name: string): Promise<object> {
    const result = await this.client.execute(`/actors/${actorType}/${actorId}/reminders/${name}`);
    return result as object;
  }

  async unregisterActorReminder(actorType: string, actorId: string, name: string): Promise<void> {
    await this.client.execute(`/actors/${actorType}/${actorId}/reminders/${name}`, {
      method: 'DELETE',
    });
  }

  async registerActorTimer(actorType: string, actorId: string, name: string, timer: ActorTimerType): Promise<void> {
    await this.client.execute(`/actors/${actorType}/${actorId}/timers/${name}`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        period: timer.period.toString().toLocaleLowerCase().replace('pt', ''),
        dueTime: timer?.dueTime?.toString()?.toLocaleLowerCase().replace('pt', ''),
        data: timer.data,
        callback: timer.callback
      }),
    });
  }

  async unregisterActorTimer(actorType: string, actorId: string, name: string): Promise<void> {
    await this.client.execute(`/actors/${actorType}/${actorId}/timers/${name}`, {
      method: 'DELETE',
    });
  }

  async deactivate(actorType: string, actorId: string): Promise<void> {
    await this.client.execute(`/actors/${actorType}/${actorId}`, {
      method: 'DELETE',
    });
  }

  async getActors(): Promise<object> {
    const result = await this.client.execute(`replace('/v1.0', '')}/dapr/config`);
    return result as object;
  }
}
