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

import {
  ExecuteActorStateTransactionRequestSchema,
  GetActorStateRequestSchema,
  GetActorStateResponse, GetMetadataRequestSchema,
  GetMetadataResponse,
  InvokeActorResponse,
  RegisterActorReminderRequestSchema,
  RegisterActorTimerRequestSchema,
  TransactionalActorStateOperation,
  UnregisterActorReminderRequestSchema,
  UnregisterActorTimerRequestSchema,
} from "../../../proto/dapr/proto/runtime/v1/dapr_pb";
import {
  InvokeActorRequestSchema,
  TransactionalActorStateOperationSchema
} from "../../../proto/dapr/proto/runtime/v1/dapr_pb";
import GRPCClient from "../../../implementation/Client/GRPCClient/GRPCClient";
import { OperationType } from "../../../types/Operation.type";
import { ActorReminderType } from "../../../types/ActorReminder.type";
import { ActorTimerType } from "../../../types/ActorTimer.type";
import IClientActor from "../../../interfaces/Client/IClientActor";
import { KeyValueType } from "../../../types/KeyValue.type";
import ActorId from "../../ActorId";
import { create } from "@bufbuild/protobuf";

// https://docs.dapr.io/reference/api/actors_api/
export default class ActorClientGRPC implements IClientActor {
  client: GRPCClient;

  constructor(client: GRPCClient) {
    this.client = client;
  }

  async invoke(actorType: string, actorId: ActorId, methodName: string, body?: any): Promise<object> {
    const msgService = create(InvokeActorRequestSchema);
    msgService.actorId = actorId.getId();
    msgService.actorType = actorType;
    msgService.method = methodName;

    if (body) {
      // @todo: if body is any, do we have to figure out how to serialize in JS? (e.g. if object -> JSON.stringify?)
      msgService.data = body;
    }

    const client = await this.client.getClient();

    return new Promise((resolve, reject) => {
      client.invokeActor(msgService, (err: any, res: InvokeActorResponse) => {
        if (err) {
          return reject(err);
        }

        // https://docs.dapr.io/reference/api/secrets_api/#response-body
        const resData = Buffer.from(res.data).toString();

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
      const transactionItem = create(TransactionalActorStateOperationSchema);
      transactionItem.key = o.request.key;
      transactionItem.operationType = o.operation;

      const msgSerialized = {
        value: Buffer.from(`${o.request.value}`, "utf-8")
      };
      transactionItem.value = msgSerialized as any;

      transactionItems.push(transactionItem);
    }

    const msgService = create(ExecuteActorStateTransactionRequestSchema);
    msgService.actorType = actorType;
    msgService.actorId = actorId.getId();
    msgService.operations = transactionItems;

    const client = await this.client.getClient();

    return new Promise((resolve, reject) => {
      client.executeActorStateTransaction(msgService, (err, _res) => {
        if (err) {
          return reject(err);
        }

        // https://docs.dapr.io/reference/api/state_api/#request-body-1
        return resolve();
      });
    });
  }

  async stateGet(actorType: string, actorId: ActorId, key: string): Promise<KeyValueType | string> {
    const msgService = create(GetActorStateRequestSchema);
    msgService.actorType = actorType;
    msgService.actorId = actorId.getId();
    msgService.key = key;

    const client = await this.client.getClient();

    return new Promise((resolve, reject) => {
      client.getActorState(msgService, (err, res: GetActorStateResponse) => {
        if (err) {
          return reject(err);
        }

        // https://docs.dapr.io/reference/api/actors_api/#http-response-codes-2
        const resData = Buffer.from(res.data).toString();

        try {
          const json = JSON.parse(resData);
          return resolve(json);
        } catch (e) {
          return resolve(resData);
        }
      });
    });
  }

  async registerActorReminder(
    actorType: string,
    actorId: ActorId,
    name: string,
    reminder: ActorReminderType,
  ): Promise<void> {
    const msgService = create(RegisterActorReminderRequestSchema);
    msgService.actorType = actorType;
    msgService.actorId = actorId.getId();
    msgService.name = name;

    if (reminder.data) {
      msgService.data = Buffer.from(reminder?.data.toString(), "utf-8");
    }

    if (reminder.period) {
      msgService.period = reminder.period.toString();
    }

    if (reminder.dueTime) {
      msgService.dueTime = reminder.dueTime.toString();
    }

    if (reminder.ttl) {
      msgService.ttl = reminder.ttl.toString();
    }

    const client = await this.client.getClient();

    return new Promise((resolve, reject) => {
      client.registerActorReminder(msgService, (err, _res) => {
        if (err) {
          return reject(err);
        }

        // https://docs.dapr.io/reference/api/actors_api/#http-response-codes-3
        return resolve();
      });
    });
  }

  async unregisterActorReminder(actorType: string, actorId: ActorId, name: string): Promise<void> {
    const msgService = create(UnregisterActorReminderRequestSchema);
    msgService.actorType = actorType;
    msgService.actorId = actorId.getId();
    msgService.name = name;

    const client = await this.client.getClient();

    return new Promise((resolve, reject) => {
      client.unregisterActorReminder(msgService, (err, _res) => {
        if (err) {
          return reject(err);
        }

        // https://docs.dapr.io/reference/api/actors_api/#delete-actor-reminder
        return resolve();
      });
    });
  }

  async registerActorTimer(actorType: string, actorId: ActorId, name: string, timer: ActorTimerType): Promise<void> {
    const msgService = create(RegisterActorTimerRequestSchema);

    msgService.actorType = actorType;
    msgService.actorId = actorId.getId();
    msgService.name = name;

    if (timer.callback) {
      msgService.callback = timer.callback;
    }

    if (timer.data) {
      msgService.data = Buffer.from(timer.data, "utf-8");
    }

    if (timer.period) {
      msgService.period = timer.period.toString();
    }

    if (timer.dueTime) {
      msgService.dueTime = timer.dueTime.toString();
    }

    if (timer.ttl) {
      msgService.ttl = timer.ttl.toString();
    }

    const client = await this.client.getClient();

    return new Promise((resolve, reject) => {
      client.registerActorTimer(msgService, (err, _res) => {
        if (err) {
          return reject(err);
        }

        // https://docs.dapr.io/reference/api/actors_api/#http-response-codes-3
        return resolve();
      });
    });
  }

  async unregisterActorTimer(actorType: string, actorId: ActorId, name: string): Promise<void> {
    const msgService = create(UnregisterActorTimerRequestSchema);
    msgService.actorType = actorType;
    msgService.actorId = actorId.getId();
    msgService.name = name;

    const client = await this.client.getClient();

    return new Promise((resolve, reject) => {
      client.unregisterActorTimer(msgService, (err, _res) => {
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
    const client = await this.client.getClient();

    return new Promise((resolve, reject) => {
      client.getMetadata(create(GetMetadataRequestSchema), (err, res: GetMetadataResponse) => {
        if (err) {
          return reject(err);
        }

        // https://docs.dapr.io/reference/api/actors_api/#http-response-codes-2
        return resolve(res.activeActorsCount);
      });
    });
  }
}
