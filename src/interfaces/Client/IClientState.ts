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

import { OperationType } from "../../types/Operation.type";
import { IRequestMetadata } from "../../types/RequestMetadata.type";
import { KeyValuePairType } from "../../types/KeyValuePair.type";
import { KeyValueType } from "../../types/KeyValue.type";
import { StateQueryType } from "../../types/state/StateQuery.type";
import { StateQueryResponseType } from "../../types/state/StateQueryResponse.type";
import { StateGetBulkOptions } from "../../types/state/StateGetBulkOptions.type";
import { StateSaveResponseType } from "../../types/state/StateSaveResponseType";
import { StateSaveOptions } from "../../types/state/StateSaveOptions.type";
import { StateDeleteOptions } from "../../types/state/StateDeleteOptions.type";
import { StateGetOptions } from "../../types/state/StateGetOptions.type";

export default interface IClientState {
  save(storeName: string, stateObjects: KeyValuePairType[], options?: StateSaveOptions): Promise<StateSaveResponseType>;
  get(storeName: string, key: string, options?: Partial<StateGetOptions>): Promise<KeyValueType | string>;
  getBulk(storeName: string, keys: string[], options?: StateGetBulkOptions): Promise<KeyValueType[]>;
  delete(storeName: string, key: string, options?: Partial<StateDeleteOptions>): Promise<StateSaveResponseType>;
  transaction(storeName: string, operations?: OperationType[], metadata?: IRequestMetadata | null): Promise<void>;
  query(storeName: string, query: StateQueryType): Promise<StateQueryResponseType>;
}
