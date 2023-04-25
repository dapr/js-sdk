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
  DeleteStateRequest,
  ExecuteStateTransactionRequest,
  GetBulkStateRequest,
  GetBulkStateResponse,
  GetStateRequest,
  GetStateResponse,
  QueryStateRequest,
  QueryStateResponse,
  SaveStateRequest,
  TransactionalStateOperation,
} from "../../../proto/dapr/proto/runtime/v1/dapr_pb";
import { Etag, StateItem, StateOptions } from "../../../proto/dapr/proto/common/v1/common_pb";
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
import { addMetadataToMap } from "../../../utils/Client.util";
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
    const stateList: StateItem[] = [];

    for (const stateObject of stateObjects) {
      const si = new StateItem();
      si.setKey(stateObject.key);
      si.setValue(
        Buffer.from(
          typeof stateObject.value === "object" ? JSON.stringify(stateObject.value) : stateObject.value.toString(),
          "utf-8",
        ),
      );

      if (stateObject?.etag) {
        const etag = new Etag();
        etag.setValue(stateObject.etag);
        si.setEtag(etag);
      }

      si.setOptions(this._configureStateOptions(stateObject?.options));

      // Merge metadata from stateObject and options.
      // Note, metadata from options will override metadata from stateObject.
      // See https://github.com/dapr/dapr/blob/029ec8cb7a1c88ec5d222bc2b0d1d53541217f19/pkg/http/api.go#L1525-L1532
      addMetadataToMap(si.getMetadataMap(), stateObject.metadata);
      addMetadataToMap(si.getMetadataMap(), options.metadata);
      stateList.push(si);
    }

    const msgService = new SaveStateRequest();
    msgService.setStoreName(storeName);
    msgService.setStatesList(stateList);

    const client = await this.client.getClient();

    return new Promise((resolve, reject) => {
      client.saveState(msgService, (err, _res) => {
        if (err) {
          return reject({ error: err });
        }

        // https://docs.dapr.io/reference/api/state_api/#response-body
        return resolve({});
      });
    });
  }

  async get(storeName: string, key: string, options?: Partial<StateGetOptions>): Promise<KeyValueType | string> {
    const msgService = new GetStateRequest();
    msgService.setStoreName(storeName);
    msgService.setKey(key);

    if (options?.consistency) {
      msgService.setConsistency(options.consistency as any);
    }

    const client = await this.client.getClient();

    return new Promise((resolve, reject) => {
      client.getState(msgService, (err, res: GetStateResponse) => {
        if (err) {
          return reject(err);
        }

        // https://docs.dapr.io/reference/api/state_api/#http-response-1
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

  async getBulk(storeName: string, keys: string[], options: StateGetBulkOptions = {}): Promise<KeyValueType[]> {
    const msgService = new GetBulkStateRequest();
    msgService.setStoreName(storeName);
    msgService.setKeysList(keys);
    msgService.setParallelism(options.parallelism ?? Settings.getDefaultStateGetBulkParallelism());
    // @todo: https://docs.dapr.io/reference/api/state_api/#optional-behaviors
    // msgService.setConsistency()

    addMetadataToMap(msgService.getMetadataMap(), options.metadata);

    const client = await this.client.getClient();
    return new Promise((resolve, reject) => {
      client.getBulkState(msgService, (err, res: GetBulkStateResponse) => {
        if (err) {
          return reject(err);
        }

        // https://docs.dapr.io/reference/api/state_api/#http-response-2
        const items = res.getItemsList();

        return resolve(
          items.map((i) => {
            const resDataStr = Buffer.from(i.getData()).toString();
            let data: string;
            try {
              data = JSON.parse(resDataStr);
            } catch (e) {
              data = resDataStr;
            }
            return {
              key: i.getKey(),
              data,
              etag: i.getEtag(),
            };
          }),
        );
      });
    });
  }

  async delete(storeName: string, key: string, options?: StateDeleteOptions): Promise<StateSaveResponseType> {
    const msgService = new DeleteStateRequest();
    msgService.setStoreName(storeName);
    msgService.setKey(key);

    if (options?.etag) {
      const etag = new Etag();
      etag.setValue(options.etag);
      msgService.setEtag(etag);
    }

    msgService.setOptions(this._configureStateOptions(options));

    const client = await this.client.getClient();

    return new Promise((resolve, reject) => {
      client.deleteState(msgService, (err, _res) => {
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
    const transactionItems: TransactionalStateOperation[] = [];

    for (const o of operations) {
      const si = new StateItem();
      si.setKey(o.request.key);
      si.setValue(Buffer.from(o.request.value || "", "utf-8"));

      if (o.request.etag) {
        const etag = new Etag();
        etag.setValue(o.request.etag.toString());

        si.setEtag(etag);
      }

      si.setOptions(this._configureStateOptions(o.request?.options));

      const transactionItem = new TransactionalStateOperation();
      transactionItem.setOperationtype(o.operation);
      transactionItem.setRequest(si);

      transactionItems.push(transactionItem);
    }

    const msgService = new ExecuteStateTransactionRequest();
    msgService.setStorename(storeName);
    msgService.setOperationsList(transactionItems);
    if (metadata) {
      merge(msgService.getMetadataMap(), metadata);
    }

    const client = await this.client.getClient();

    return new Promise((resolve, reject) => {
      client.executeStateTransaction(msgService, (err, _res) => {
        if (err) {
          return reject(err);
        }

        // https://docs.dapr.io/reference/api/state_api/#request-body-1
        return resolve();
      });
    });
  }

  async query(storeName: string, query: StateQueryType): Promise<StateQueryResponseType> {
    const msgService = new QueryStateRequest();
    msgService.setStoreName(storeName);
    msgService.setQuery(JSON.stringify(query));

    const client = await this.client.getClient();

    return new Promise((resolve, reject) => {
      client.queryStateAlpha1(msgService, (err, res: QueryStateResponse) => {
        if (err) {
          return reject(err);
        }
        const resultsList = res.getResultsList();
        if (resultsList.length === 0) {
          return resolve({
            results: [],
            token: res.getToken(),
          } as StateQueryResponseType);
        }

        // https://docs.dapr.io/reference/api/state_api/#response-body
        // map the res from gRPC
        const resMapped: StateQueryResponseType = {
          results: res.getResultsList().map((i) => ({
            key: i.getKey(),
            data: i.getData(),
            etag: i.getEtag(),
            error: i.getError(),
          })),
          token: res.getToken(),
        };

        return resolve(resMapped);
      });
    });
  }

  _configureStateOptions(opt?: Partial<IStateOptions>): StateOptions | undefined {
    if (opt === undefined) {
      return undefined;
    }

    const stateOptions = new StateOptions();
    if (opt?.consistency) {
      stateOptions.setConsistency(opt.consistency as any);
    }

    if (opt?.concurrency) {
      stateOptions.setConcurrency(opt.concurrency as any);
    }

    return stateOptions;
  }
}
