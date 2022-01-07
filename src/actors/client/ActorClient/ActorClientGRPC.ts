import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Any } from "google-protobuf/google/protobuf/any_pb";
import { ExecuteActorStateTransactionRequest, GetActorStateRequest, GetActorStateResponse, GetMetadataResponse, InvokeActorRequest, InvokeActorResponse, RegisterActorReminderRequest, RegisterActorTimerRequest, TransactionalActorStateOperation, UnregisterActorReminderRequest, UnregisterActorTimerRequest } from '../../../proto/dapr/proto/runtime/v1/dapr_pb';
import GRPCClient from '../../../implementation/Client/GRPCClient/GRPCClient';
import { OperationType } from '../../../types/Operation.type';
import { ActorReminderType } from '../../../types/ActorReminder.type';
import { ActorTimerType } from '../../../types/ActorTimer.type';
import IClientActor from '../../../interfaces/Client/IClientActor';
import { KeyValueType } from '../../../types/KeyValue.type';
import ActorId from "../../ActorId";

// https://docs.dapr.io/reference/api/actors_api/
export default class ActorClientGRPC implements IClientActor {
  client: GRPCClient;

  constructor(client: GRPCClient) {
    this.client = client;
  }

  async invoke(actorType: string, actorId: ActorId, methodName: string, body?: any): Promise<object> {
    const msgService = new InvokeActorRequest();
    msgService.setActorId(actorId.getId())
    msgService.setActorType(actorType);
    msgService.setMethod(methodName);

    if (body) {
      // @todo: if body is any, do we have to figure out how to serialize in JS? (e.g. if object -> JSON.stringify?)
      msgService.setData(body);
    }

    return new Promise((resolve, reject) => {
      const client = this.client.getClient();
      client.invokeActor(msgService, (err, res: InvokeActorResponse) => {
        if (err) {
          return reject(err);
        }

        // https://docs.dapr.io/reference/api/secrets_api/#response-body
        const resData = Buffer.from(res.getData()).toString();

        try {
          return resolve(JSON.parse(resData));
        } catch (e) {
          return resolve(resData as any);
        }
      });
    });
  }

  async stateTransaction(actorType: string, actorId: ActorId, operations: OperationType[]): Promise<void> {
    const transactionItems: TransactionalActorStateOperation[] = [];

    for (const o of operations) {
      const transactionItem = new TransactionalActorStateOperation();
      transactionItem.setKey(o.request.key);
      transactionItem.setOperationtype(o.operation);

      const msgSerialized = new Any();
      msgSerialized.setValue(Buffer.from(`${o.request.value}`, "utf-8"));
      transactionItem.setValue(msgSerialized);

      transactionItems.push(transactionItem);
    }

    const msgService = new ExecuteActorStateTransactionRequest();
    msgService.setActorType(actorType);
    msgService.setActorId(actorId.getId());
    msgService.setOperationsList(transactionItems);

    return new Promise((resolve, reject) => {
      const client = this.client.getClient();
      client.executeActorStateTransaction(msgService, (err, res) => {
        if (err) {
          return reject(err);
        }

        // https://docs.dapr.io/reference/api/state_api/#request-body-1
        return resolve();
      });
    });
  }

  async stateGet(actorType: string, actorId: ActorId, key: string): Promise<KeyValueType | string> {
    const msgService = new GetActorStateRequest();
    msgService.setActorType(actorType);
    msgService.setActorId(actorId.getId())
    msgService.setKey(key);

    return new Promise((resolve, reject) => {
      const client = this.client.getClient();
      client.getActorState(msgService, (err, res: GetActorStateResponse) => {
        if (err) {
          return reject(err);
        }

        // https://docs.dapr.io/reference/api/actors_api/#http-response-codes-2
        const resData = Buffer.from(res.getData()).toString();

        try {
          const json = JSON.parse(resData);
          return resolve(json);
        } catch (e) {
          return resolve(resData);
        }
      });
    });
  }

  async registerActorReminder(actorType: string, actorId: ActorId, name: string, reminder: ActorReminderType): Promise<void> {
    const msgService = new RegisterActorReminderRequest();
    msgService.setActorType(actorType);
    msgService.setActorId(actorId.getId());
    msgService.setName(name);

    if (reminder.data) {
      msgService.setData(Buffer.from(reminder?.data.toString(), "utf-8"))
    }

    if (reminder.period) {
      msgService.setPeriod(reminder.period.toString());
    }

    if (reminder.dueTime) {
      msgService.setDueTime(reminder.dueTime.toString());
    }

    return new Promise((resolve, reject) => {
      const client = this.client.getClient();
      client.registerActorReminder(msgService, (err, res) => {
        if (err) {
          return reject(err);
        }

        // https://docs.dapr.io/reference/api/actors_api/#http-response-codes-3
        return resolve();
      });
    });
  }

  async unregisterActorReminder(actorType: string, actorId: ActorId, name: string): Promise<void> {
    const msgService = new UnregisterActorReminderRequest();
    msgService.setActorType(actorType);
    msgService.setActorId(actorId.getId());
    msgService.setName(name);

    return new Promise((resolve, reject) => {
      const client = this.client.getClient();
      client.unregisterActorReminder(msgService, (err, res) => {
        if (err) {
          return reject(err);
        }

        // https://docs.dapr.io/reference/api/actors_api/#delete-actor-reminder
        return resolve();
      });
    });
  }

  async registerActorTimer(actorType: string, actorId: ActorId, name: string, timer: ActorTimerType): Promise<void> {
    const msgService = new RegisterActorTimerRequest();
    msgService.setActorType(actorType);
    msgService.setActorId(actorId.getId());
    msgService.setName(name);

    if (timer.callback) {
      msgService.setCallback(timer.callback);
    }

    if (timer.data) {
      msgService.setData(Buffer.from(timer.data, "utf-8"))
    }

    if (timer.period) {
      msgService.setPeriod(timer.period.toString());
    }

    if (timer.dueTime) {
      msgService.setDueTime(timer.dueTime.toString());
    }

    return new Promise((resolve, reject) => {
      const client = this.client.getClient();
      client.registerActorTimer(msgService, (err, res) => {
        if (err) {
          return reject(err);
        }

        // https://docs.dapr.io/reference/api/actors_api/#http-response-codes-3
        return resolve();
      });
    });
  }

  async unregisterActorTimer(actorType: string, actorId: ActorId, name: string): Promise<void> {
    const msgService = new UnregisterActorTimerRequest();
    msgService.setActorType(actorType);
    msgService.setActorId(actorId.getId());
    msgService.setName(name);

    return new Promise((resolve, reject) => {
      const client = this.client.getClient();
      client.unregisterActorTimer(msgService, (err, res) => {
        if (err) {
          return reject(err);
        }

        // https://docs.dapr.io/reference/api/actors_api/#delete-actor-timer
        return resolve();
      });
    });
  }

  // @todo: cannot find this one
  // async deactivate(actorType: string, actorId: string): Promise<ResActorDeactivateDto> {
  //     const msgService = new UnregisterActorTimerRequest();
  //     msgService.setActorType(actorType);
  //     msgService.setActorId(actorId);
  //     msgService.setName(name);

  //     return new Promise(async (resolve, reject) => {
  //         const client = await GRPCClientSingleton.getClient();
  //         client.unregisterActorTimer(msgService, (err, res) => {
  //             if (err) {
  //                 return reject(err);
  //             }

  //             // https://docs.dapr.io/reference/api/actors_api/#delete-actor-timer
  //             return resolve();
  //         });
  //     });
  // }

  async getActors(): Promise<object> {
    return new Promise((resolve, reject) => {
      const client = this.client.getClient();

      client.getMetadata(new Empty(), (err, res: GetMetadataResponse) => {
        if (err) {
          return reject(err);
        }

        // https://docs.dapr.io/reference/api/actors_api/#http-response-codes-2
        return resolve(res.getActiveActorsCountList());
      });
    });
  }
}
