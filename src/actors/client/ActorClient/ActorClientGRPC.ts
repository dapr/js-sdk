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

import { create } from "@bufbuild/protobuf";
import { AnySchema } from "@bufbuild/protobuf/wkt";
import {
  ExecuteActorStateTransactionRequestSchema,
  GetActorStateRequestSchema,
  InvokeActorRequestSchema,
  RegisterActorReminderRequestSchema,
  RegisterActorTimerRequestSchema,
  TransactionalActorStateOperationSchema,
  UnregisterActorReminderRequestSchema,
  UnregisterActorTimerRequestSchema,
  GetMetadataRequestSchema,
} from "../../../proto/dapr/proto/runtime/v1/dapr_pb";
import GRPCClient from "../../../implementation/Client/GRPCClient/GRPCClient";
import { OperationType } from "../../../types/Operation.type";
import { ActorReminderType } from "../../../types/ActorReminder.type";
import { ActorTimerType } from "../../../types/ActorTimer.type";
import IClientActor from "../../../interfaces/Client/IClientActor";
import { KeyValueType } from "../../../types/KeyValue.type";
import ActorId from "../../ActorId";

// https://docs.dapr.io/reference/api/actors_api/
export default class ActorClientGRPC implements IClientActor {
  client: GRPCClient;

  constructor(client: GRPCClient) {
    this.client = client;
  }

  async invoke(actorType: string, actorId: ActorId, methodName: string, body?: any): Promise<object> {
    const client = await this.client.getClient();

    const res = await client.invokeActor(create(InvokeActorRequestSchema, {
      actorType,
      actorId: actorId.getId(),
      method: methodName,
      data: body ? Buffer.from(JSON.stringify(body), "utf-8") : new Uint8Array(),
    }));

    const resData = Buffer.from(res.data).toString();

    try {
      return JSON.parse(resData);
    } catch (e) {
      return resData as any;
    }
  }

  async stateTransaction(actorType: string, actorId: ActorId, operations: OperationType[]): Promise<void> {
    const client = await this.client.getClient();

    const transactionItems = operations.map((o) =>
      create(TransactionalActorStateOperationSchema, {
        operationType: o.operation,
        key: o.request.key,
        value: create(AnySchema, {
          value: Buffer.from(`${o.request.value}`, "utf-8"),
        }),
      }),
    );

    await client.executeActorStateTransaction(create(ExecuteActorStateTransactionRequestSchema, {
      actorType,
      actorId: actorId.getId(),
      operations: transactionItems,
    }));
  }

  async stateGet(actorType: string, actorId: ActorId, key: string): Promise<KeyValueType | string> {
    const client = await this.client.getClient();

    const res = await client.getActorState(create(GetActorStateRequestSchema, {
      actorType,
      actorId: actorId.getId(),
      key,
    }));

    const resData = Buffer.from(res.data).toString();

    try {
      return JSON.parse(resData);
    } catch (e) {
      return resData;
    }
  }

  async registerActorReminder(
    actorType: string,
    actorId: ActorId,
    name: string,
    reminder: ActorReminderType,
  ): Promise<void> {
    const client = await this.client.getClient();

    await client.registerActorReminder(create(RegisterActorReminderRequestSchema, {
      actorType,
      actorId: actorId.getId(),
      name,
      data: reminder.data ? Buffer.from(reminder.data.toString(), "utf-8") : new Uint8Array(),
      period: reminder.period ? reminder.period.toString() : "",
      dueTime: reminder.dueTime ? reminder.dueTime.toString() : "",
      ttl: reminder.ttl ? reminder.ttl.toString() : "",
    }));
  }

  async unregisterActorReminder(actorType: string, actorId: ActorId, name: string): Promise<void> {
    const client = await this.client.getClient();

    await client.unregisterActorReminder(create(UnregisterActorReminderRequestSchema, {
      actorType,
      actorId: actorId.getId(),
      name,
    }));
  }

  async registerActorTimer(actorType: string, actorId: ActorId, name: string, timer: ActorTimerType): Promise<void> {
    const client = await this.client.getClient();

    await client.registerActorTimer(create(RegisterActorTimerRequestSchema, {
      actorType,
      actorId: actorId.getId(),
      name,
      callback: timer.callback ?? "",
      data: timer.data ? Buffer.from(timer.data, "utf-8") : new Uint8Array(),
      period: timer.period ? timer.period.toString() : "",
      dueTime: timer.dueTime ? timer.dueTime.toString() : "",
      ttl: timer.ttl ? timer.ttl.toString() : "",
    }));
  }

  async unregisterActorTimer(actorType: string, actorId: ActorId, name: string): Promise<void> {
    const client = await this.client.getClient();

    await client.unregisterActorTimer(create(UnregisterActorTimerRequestSchema, {
      actorType,
      actorId: actorId.getId(),
      name,
    }));
  }

  async getActors(): Promise<object> {
    const client = await this.client.getClient();

    const res = await client.getMetadata(create(GetMetadataRequestSchema));

    // https://docs.dapr.io/reference/api/actors_api/#http-response-codes-2
    return res.activeActorsCount;
  }
}
