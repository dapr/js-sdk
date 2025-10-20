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

import GRPCClient from "./GRPCClient";
import {
  DeleteStateRequestSchema,
  ExecuteStateTransactionRequestSchema,
  GetBulkStateRequestSchema,
  GetBulkStateResponse,
  GetStateRequestSchema,
  GetStateResponse,
  QueryStateRequestSchema,
  QueryStateResponse,
  SaveStateRequestSchema,
  TransactionalStateOperation,
  TransactionalStateOperationSchema,
} from "../../../proto/dapr/proto/runtime/v1/dapr_pb";
import {
  EtagSchema,
  StateItem,
  StateItemSchema,
  StateOptions, StateOptionsSchema,
} from "../../../proto/dapr/proto/common/v1/common_pb";
import { KeyValuePairType } from "../../../types/KeyValuePair.type";
import { OperationType } from "../../../types/Operation.type";
import { IRequestMetadata } from "../../../types/RequestMetadata.type";
import IClientState from "../../../interfaces/Client/IClientState";
import { KeyValueType } from "../../../types/KeyValue.type";
import { merge } from "../../../utils/Map.util";
import { StateQueryType } from "../../../types/state/StateQuery.type";
import { StateQueryResponseType } from "../../../types/state/StateQueryResponse.type";
import { StateGetBulkOptions } from "../../../types/state/StateGetBulkOptions.type";
import { Settings } from "../../../utils/Settings.util";
import { addMetadataToMap, convertToMap } from "../../../utils/Client.util";
import { StateSaveResponseType } from "../../../types/state/StateSaveResponseType";
import { StateSaveOptions } from "../../../types/state/StateSaveOptions.type";
import { StateDeleteOptions } from "../../../types/state/StateDeleteOptions.type";
import { StateGetOptions } from "../../../types/state/StateGetOptions.type";
import { IStateOptions } from "../../../types/state/StateOptions.type";
import { create } from "@bufbuild/protobuf";

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
    const stateList: StateItem[] = [];

    for (const stateObject of stateObjects) {
      const si = create(StateItemSchema);
      si.key = stateObject.key;
      si.value =         Buffer.from(
          typeof stateObject.value === "object" ? JSON.stringify(stateObject.value) : stateObject.value.toString(),
          "utf-8",
        );

      if (stateObject?.etag) {
        const etag = create(EtagSchema);
        etag.value = stateObject.etag;
        si.etag = etag;
      }

      si.options = this._configureStateOptions(stateObject?.options);

      // Merge metadata from stateObject and options.
      // Note, metadata from options will override metadata from stateObject.
      // See https://github.com/dapr/dapr/blob/029ec8cb7a1c88ec5d222bc2b0d1d53541217f19/pkg/http/api.go#L1525-L1532
      addMetadataToMap(convertToMap(si.metadata), stateObject.metadata);
      addMetadataToMap(convertToMap(si.metadata), options.metadata);
      stateList.push(si);
    }

    const msgService = create(SaveStateRequestSchema);
    msgService.storeName = storeName;
    msgService.states = stateList;

    const client = await this.client.getClient();

    return new Promise((resolve, reject) => {
      client.saveState(msgService, (err: Error, _res) => {
        if (err) {
          return reject({ error: err });
        }

        // https://docs.dapr.io/reference/api/state_api/#response-body
        return resolve({});
      });
    });
  }

  async get(storeName: string, key: string, options?: Partial<StateGetOptions>): Promise<KeyValueType | string> {
    const msgService = create(GetStateRequestSchema);
    msgService.storeName = storeName;
    msgService.key = key;

    if (options?.consistency) {
      msgService.consistency = options.consistency as any;
    }

    const client = await this.client.getClient();

    return new Promise((resolve, reject) => {
      client.getState(msgService, (err: Error, res: GetStateResponse) => {
        if (err) {
          return reject(err);
        }

        // https://docs.dapr.io/reference/api/state_api/#http-response-1
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

  async getBulk(storeName: string, keys: string[], options: StateGetBulkOptions = {}): Promise<KeyValueType[]> {
    const msgService = create(GetBulkStateRequestSchema);
    msgService.storeName = storeName;
    msgService.keys = keys;
    msgService.parallelism = options.parallelism ?? Settings.getDefaultStateGetBulkParallelism();
    // @todo: https://docs.dapr.io/reference/api/state_api/#optional-behaviors
    // msgService.setConsistency()

    addMetadataToMap(convertToMap(msgService.metadata), options.metadata);

    const client = await this.client.getClient();
    return new Promise((resolve, reject) => {
      client.getBulkState(msgService, (err: Error, res: GetBulkStateResponse) => {
        if (err) {
          return reject(err);
        }

        // https://docs.dapr.io/reference/api/state_api/#http-response-2
        const items = res.items;

        return resolve(
          items.map((i) => {
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
          }),
        );
      });
    });
  }

  async delete(storeName: string, key: string, options?: StateDeleteOptions): Promise<StateSaveResponseType> {
    const msgService = create(DeleteStateRequestSchema);
    msgService.storeName = storeName;
    msgService.key = key;

    if (options?.etag) {
      const etag = create(EtagSchema);
      etag.value = options.etag;
      msgService.etag = etag;
    }

    msgService.options = this._configureStateOptions(options);

    const client = await this.client.getClient();

    return new Promise((resolve, reject) => {
      client.deleteState(msgService, (err: Error, _res) => {
        if (err) {
          return reject(err);
        }

        // https://docs.dapr.io/reference/api/state_api/#http-response-3
        return resolve({});
      });
    });
  }

  async transaction(
    storeName: string,
    operations: OperationType[] = [],
    metadata: IRequestMetadata | null = null,
  ): Promise<void> {
    const transactionItems: Array<TransactionalStateOperation> = [];

    for (const o of operations) {
      const si = create(StateItemSchema);
      si.key = o.request.key;
      si.value = Buffer.from(o.request.value || "", "utf-8");

      if (o.request.etag) {
        const etag = create(EtagSchema);
        etag.value = o.request.etag.toString();

        si.etag = etag;
      }

      si.options = this._configureStateOptions(o.request?.options);

      const transactionItem = create(TransactionalStateOperationSchema);
      transactionItem.operationType = o.operation;
      transactionItem.request = si;

      transactionItems.push(transactionItem);
    }

    const msgService = create(ExecuteStateTransactionRequestSchema);
    msgService.storeName = storeName;
    msgService.operations = transactionItems;
    if (metadata) {
      merge(convertToMap(msgService.metadata), metadata);
    }

    const client = await this.client.getClient();

    return new Promise((resolve, reject) => {
      client.executeStateTransaction(msgService, (err: Error, _res) => {
        if (err) {
          return reject(err);
        }

        // https://docs.dapr.io/reference/api/state_api/#request-body-1
        return resolve();
      });
    });
  }

  async query(storeName: string, query: StateQueryType): Promise<StateQueryResponseType> {
    const msgService = create(QueryStateRequestSchema);
    msgService.storeName = storeName;
    msgService.query = JSON.stringify(query);

    const client = await this.client.getClient();

    return new Promise((resolve, reject) => {
      client.queryStateAlpha1(msgService, (err: Error, res: QueryStateResponse) => {
        if (err) {
          return reject(err);
        }
        const resultsList = res.results;
        if (resultsList.length === 0) {
          return resolve({
            results: [],
            token: res.token,
          } as StateQueryResponseType);
        }

        // https://docs.dapr.io/reference/api/state_api/#response-body
        // map the res from gRPC
        const resMapped: StateQueryResponseType = {
          results: res.results.map(i => ({
            key: i.key,
            data: i.data,
            etag: i.etag,
            error: i.error,
          })),
          token: res.token,
        };

        return resolve(resMapped);
      });
    });
  }

  _configureStateOptions(opt?: Partial<IStateOptions>): StateOptions | undefined {
    if (opt === undefined) {
      return undefined;
    }

    const stateOptions = create(StateOptionsSchema);
    if (opt?.consistency) {
      stateOptions.consistency = opt.consistency as any;
    }

    if (opt?.concurrency) {
      stateOptions.concurrency = opt.concurrency as any;
    }

    return stateOptions;
  }
}
