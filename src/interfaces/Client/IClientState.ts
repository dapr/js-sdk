import { OperationType } from "../../types/Operation.type";
import { IRequestMetadata } from "../../types/RequestMetadata.type";
import { KeyValuePairType } from "../../types/KeyValuePair.type";
import { KeyValueType } from "../../types/KeyValue.type";
import { StateQueryType } from "../../types/state/StateQuery.type";
import { StateQueryResponseType } from "../../types/state/StateQueryResponse.type";

export default interface IClientState {
  save(storeName: string, stateObjects: KeyValuePairType[]): Promise<void>;
  get(storeName: string, key: string): Promise<KeyValueType | string>;
  getBulk(storeName: string, keys: string[], parallelism?: number, metadata?: string): Promise<KeyValueType[]>;
  delete(storeName: string, key: string): Promise<void>;
  transaction(storeName: string, operations?: OperationType[], metadata?: IRequestMetadata | null): Promise<void>;
  query(storeName: string, query: StateQueryType): Promise<StateQueryResponseType>;
}