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
import GRPCClient from "./GRPCClient";
import {
  DeleteStateRequestSchema,
  ExecuteStateTransactionRequestSchema,
  GetBulkStateRequestSchema,
  GetStateRequestSchema,
  QueryStateRequestSchema,
  SaveStateRequestSchema,
  TransactionalStateOperationSchema,
} from "../../../proto/dapr/proto/runtime/v1/dapr_pb";
import { Etag, EtagSchema, StateItem, StateItemSchema, StateOptions, StateOptionsSchema } from "../../../proto/dapr/proto/common/v1/common_pb";
import { KeyValuePairType } from "../../../types/KeyValuePair.type";
import { OperationType } from "../../../types/Operation.type";
import { IRequestMetadata } from "../../../types/RequestMetadata.type";
import IClientState from "../../../interfaces/Client/IClientState";
import { KeyValueType } from "../../../types/KeyValue.type";
import { StateQueryType } from "../../../types/state/StateQuery.type";
import { StateQueryResponseType } from "../../../types/state/StateQueryResponse.type";
import { StateGetBulkOptions } from "../../../types/state/StateGetBulkOptions.type";
import { Settings } from "../../../utils/Settings.util";
import { StateSaveResponseType } from "../../../types/state/StateSaveResponseType";
import { StateSaveOptions } from "../../../types/state/StateSaveOptions.type";
import { StateDeleteOptions } from "../../../types/state/StateDeleteOptions.type";
import { StateGetOptions } from "../../../types/state/StateGetOptions.type";
import { IStateOptions } from "../../../types/state/StateOptions.type";

// https://docs.dapr.io/reference/api/state_api/
export default class GRPCClientState implements IClientState {
  client: GRPCClient;

  constructor(client: GRPCClient) {
    this.client = client;
  }

  async save(
    storeName: string,
    stateObjects: KeyValuePairType[],
    options: StateSaveOptions = {},
  ): Promise<StateSaveResponseType> {
    const states: StateItem[] = [];

    for (const stateObject of stateObjects) {
      const si = create(StateItemSchema, {
        key: stateObject.key,
        value: Buffer.from(
          typeof stateObject.value === "object" ? JSON.stringify(stateObject.value) : stateObject.value.toString(),
          "utf-8",
        ),
        etag: stateObject?.etag ? create(EtagSchema, { value: stateObject.etag }) : undefined,
        options: this._configureStateOptions(stateObject?.options),
        metadata: { ...stateObject.metadata, ...options.metadata },
      });
      states.push(si);
    }

    const client = await this.client.getClient();
    await client.saveState(create(SaveStateRequestSchema, { storeName, states }));

    return {};
  }

  async get(storeName: string, key: string, options?: Partial<StateGetOptions>): Promise<KeyValueType | string> {
    const client = await this.client.getClient();

    const res = await client.getState(create(GetStateRequestSchema, {
      storeName,
      key,
      consistency: options?.consistency as any,
    }));

    const resData = Buffer.from(res.data).toString();

    try {
      return JSON.parse(resData);
    } catch (e) {
      return resData;
    }
  }

  async getBulk(storeName: string, keys: string[], options: StateGetBulkOptions = {}): Promise<KeyValueType[]> {
    const client = await this.client.getClient();

    const res = await client.getBulkState(create(GetBulkStateRequestSchema, {
      storeName,
      keys,
      parallelism: options.parallelism ?? Settings.getDefaultStateGetBulkParallelism(),
      metadata: options.metadata ?? {},
    }));

    return res.items.map((i) => {
      const resDataStr = Buffer.from(i.data).toString();
      let data: string;
      try {
        data = JSON.parse(resDataStr);
      } catch (e) {
        data = resDataStr;
      }
      return {
        key: i.key,
        data,
        etag: i.etag,
      };
    });
  }

  async delete(storeName: string, key: string, options?: StateDeleteOptions): Promise<StateSaveResponseType> {
    const client = await this.client.getClient();

    await client.deleteState(create(DeleteStateRequestSchema, {
      storeName,
      key,
      etag: options?.etag ? create(EtagSchema, { value: options.etag }) : undefined,
      options: this._configureStateOptions(options),
    }));

    return {};
  }

  async transaction(
    storeName: string,
    operations: OperationType[] = [],
    metadata: IRequestMetadata | null = null,
  ): Promise<void> {
    const ops = operations.map((o) => {
      const si = create(StateItemSchema, {
        key: o.request.key,
        value: Buffer.from(o.request.value || "", "utf-8"),
        etag: o.request.etag ? create(EtagSchema, { value: o.request.etag.toString() }) : undefined,
        options: this._configureStateOptions(o.request?.options),
      });

      return create(TransactionalStateOperationSchema, {
        operationType: o.operation,
        request: si,
      });
    });

    const client = await this.client.getClient();

    await client.executeStateTransaction(create(ExecuteStateTransactionRequestSchema, {
      storeName,
      operations: ops,
      metadata: metadata ? { ...metadata } : {},
    }));
  }

  async query(storeName: string, query: StateQueryType): Promise<StateQueryResponseType> {
    const client = await this.client.getClient();

    const res = await client.queryStateAlpha1(create(QueryStateRequestSchema, {
      storeName,
      query: JSON.stringify(query),
    }));

    if (res.results.length === 0) {
      return {
        results: [],
        token: res.token,
      } as StateQueryResponseType;
    }

    return {
      results: res.results.map((i) => ({
        key: i.key,
        data: i.data,
        etag: i.etag,
        error: i.error,
      })),
      token: res.token,
    };
  }

  _configureStateOptions(opt?: Partial<IStateOptions>): StateOptions | undefined {
    if (opt === undefined) {
      return undefined;
    }

    return create(StateOptionsSchema, {
      consistency: opt?.consistency as any,
      concurrency: opt?.concurrency as any,
    });
  }
}
