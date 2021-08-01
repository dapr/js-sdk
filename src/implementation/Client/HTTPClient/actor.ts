import HTTPClient from './HTTPClient';
import { InvokeFetchOptions } from '../../../types/InvokeFetchOptions';
import { OperationType } from '../../../types/Operation.type';
import { ActorReminderType } from '../../../types/ActorReminder.type';
import { ActorTimerType } from '../../../types/ActorTimer.type';
import IClientActor from '../../../interfaces/Client/IClientActor';
import HttpStatusCode from '../../../enum/HttpStatusCode.enum';
import { KeyValueType } from '../../../types/KeyValue.type';

// https://docs.dapr.io/reference/api/actors_api/
export default class DaprClientActor implements IClientActor {
  client: HTTPClient;

  constructor(client: HTTPClient) {
    this.client = client;
  }

  async invoke(method: "GET" | "POST" | "PUT" | "DELETE" = "POST", actorType: string, actorId: string, methodName: string, body?: any): Promise<object> {
    const res = await this.client.execute(`/actors/${actorType}/${actorId}/method/${methodName}`, {
      method,
      body: body
    });

    switch (res.status) {
      case HttpStatusCode.OK:
        const txt = await res.text();

        try {
          const json = JSON.parse(txt);
          return json;
        } catch (e) {
          return txt;
        }
      case HttpStatusCode.INTERNAL_SERVER_ERROR: {
        const json = await res.json();
        throw new Error(JSON.stringify(json));
      }
      default:
        // The status code from the upstream call
        throw new Error(JSON.stringify({
          error: "UNKNOWN",
          error_msg: `An unknown problem occured and we got the status ${res.statusCode} with response ${res}`
        }));
    }
  }

  async stateTransaction(actorType: string, actorId: string, operations: OperationType[]): Promise<void> {
    const res = await this.client.execute(`/actors/${actorType}/${actorId}/state`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(operations)
    });

    switch (res.status) {
      case HttpStatusCode.NO_CONTENT:
        return;
      case HttpStatusCode.BAD_REQUEST:
        throw new Error(JSON.stringify({
          error: "ACTOR_NOT_FOUND",
          error_msg: "Could not find the actor"
        }));
      case HttpStatusCode.INTERNAL_SERVER_ERROR: {
        const json = await res.json();
        throw new Error(JSON.stringify(json));
      }
      default:
        throw new Error(JSON.stringify({
          error: "UNKNOWN",
          error_msg: `An unknown problem occured and we got the status ${res.statusCode} with response ${res}`
        }));
    }
  }

  async stateGet(actorType: string, actorId: string, key: string): Promise<KeyValueType | string> {
    const res = await this.client.execute(`/actors/${actorType}/${actorId}/state/${key}`);

    switch (res.status) {
      case HttpStatusCode.OK: {
        const json = await res.json();
        return json;
      }
      case HttpStatusCode.NO_CONTENT:
        return ""; // key not found, response will be empty
      case HttpStatusCode.BAD_REQUEST:
        throw new Error(JSON.stringify({
          error: "ACTOR_NOT_FOUND",
          error_msg: `Could not find the given actor ${actorId}`
        }));
      case HttpStatusCode.INTERNAL_SERVER_ERROR: {
        const json = await res.json();
        throw new Error(JSON.stringify(json));
      }
      default:
        throw new Error(JSON.stringify({
          error: "UNKNOWN",
          error_msg: `An unknown problem occured and we got the status ${res.statusCode} with response ${res}`
        }));
    }
  }

  async reminderCreate(actorType: string, actorId: string, name: string, reminder: ActorReminderType): Promise<void> {
    const res = await this.client.execute(`/actors/${actorType}/${actorId}/reminders/${name}`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(reminder),
    });

    switch (res.status) {
      case HttpStatusCode.NO_CONTENT:
        return;
      case HttpStatusCode.BAD_REQUEST:
        throw new Error(JSON.stringify({
          error: "ACTOR_NOT_FOUND",
          error_msg: `Could not find the given actor ${actorId}`
        }));
      case HttpStatusCode.INTERNAL_SERVER_ERROR: {
        const json = await res.json();
        throw new Error(JSON.stringify(json));
      }
      default:
        throw new Error(JSON.stringify({
          error: "UNKNOWN",
          error_msg: `An unknown problem occured and we got the status ${res.statusCode} with response ${res}`
        }));
    }
  }

  async reminderGet(actorType: string, actorId: string, name: string): Promise<object> {
    const res = await this.client.execute(`/actors/${actorType}/${actorId}/reminders/${name}`);

    switch (res.status) {
      case HttpStatusCode.OK:
        const json = await res.json();
        return json;
      case HttpStatusCode.INTERNAL_SERVER_ERROR: {
        const json = await res.json();
        throw new Error(JSON.stringify(json));
      }
      default:
        throw new Error(JSON.stringify({
          error: "UNKNOWN",
          error_msg: `An unknown problem occured and we got the status ${res.statusCode} with response ${res}`
        }));
    }
  }

  async reminderDelete(actorType: string, actorId: string, name: string): Promise<void> {
    const res = await this.client.execute(`/actors/${actorType}/${actorId}/reminders/${name}`, {
      method: 'DELETE',
    });

    switch (res.status) {
      case HttpStatusCode.NO_CONTENT:
        return;
      case HttpStatusCode.INTERNAL_SERVER_ERROR: {
        const json = await res.json();
        throw new Error(JSON.stringify(json));
      }
      default:
        throw new Error(JSON.stringify({
          error: "UNKNOWN",
          error_msg: `An unknown problem occured and we got the status ${res.statusCode} with response ${res}`
        }));
    }
  }

  async timerCreate(actorType: string, actorId: string, name: string, timer: ActorTimerType): Promise<void> {
    const res = await this.client.execute(`/actors/${actorType}/${actorId}/timers/${name}`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(timer),
    });

    switch (res.status) {
      case HttpStatusCode.NO_CONTENT:
        return;
      case HttpStatusCode.BAD_REQUEST:
        throw new Error(JSON.stringify({
          error: "ACTOR_NOT_FOUND",
          error_msg: `Could not find the given actor ${actorId}`
        }));
      case HttpStatusCode.INTERNAL_SERVER_ERROR: {
        const json = await res.json();
        throw new Error(JSON.stringify(json));
      }
      default:
        throw new Error(JSON.stringify({
          error: "UNKNOWN",
          error_msg: `An unknown problem occured and we got the status ${res.statusCode} with response ${res}`
        }));
    }
  }

  async timerDelete(actorType: string, actorId: string, name: string): Promise<void> {
    const res = await this.client.execute(`/actors/${actorType}/${actorId}/timers/${name}`, {
      method: 'DELETE',
    });

    switch (res.status) {
      case HttpStatusCode.NO_CONTENT:
        return;
      case HttpStatusCode.INTERNAL_SERVER_ERROR: {
        const json = await res.json();
        throw new Error(JSON.stringify(json));
      }
      default:
        throw new Error(JSON.stringify({
          error: "UNKNOWN",
          error_msg: `An unknown problem occured and we got the status ${res.statusCode} with response ${res}`
        }));
    }
  }

  async deactivate(actorType: string, actorId: string): Promise<void> {
    const res = await this.client.execute(`/actors/${actorType}/${actorId}`, {
      method: 'DELETE',
    });

    switch (res.status) {
      case HttpStatusCode.NO_CONTENT:
        return;
      case HttpStatusCode.NOT_FOUND:
        throw new Error(JSON.stringify({
          error: "ACTOR_NOT_FOUND",
          error_msg: `Could not find the given actor ${actorId}`
        }));
      case HttpStatusCode.INTERNAL_SERVER_ERROR: {
        const json = await res.json();
        throw new Error(JSON.stringify(json));
      }
      default:
        throw new Error(JSON.stringify({
          error: "UNKNOWN",
          error_msg: `An unknown problem occured and we got the status ${res.statusCode} with response ${res}`
        }));
    }
  }

  async getActors(): Promise<object> {
    const res = await this.client.execute(`replace('/v1.0', '')}/dapr/config`);

    switch (res.status) {
      case HttpStatusCode.OK: {
        const json = await res.json();
        return json;
      }
      case HttpStatusCode.INTERNAL_SERVER_ERROR: {
        const json = await res.json();
        throw new Error(JSON.stringify(json));
      }
      default:
        throw new Error(JSON.stringify({
          error: "UNKNOWN",
          error_msg: `An unknown problem occured and we got the status ${res.statusCode} with response ${res}`
        }));
    }
  }
}
