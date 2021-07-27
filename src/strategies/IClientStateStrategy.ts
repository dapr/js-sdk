import { OperationType } from "../types/Operation.type";
import { IRequestMetadata } from "../types/RequestMetadata.type";
import { KeyValuePairType } from "../types/KeyValuePair.type";
import { KeyValueType } from "../types/KeyValue.type";

export default interface IClientStateStrategy {
    save(storeName: string, stateObjects: KeyValuePairType[]): Promise<void>;
    get(storeName: string, key: string): Promise<KeyValueType | string>;
    getBulk(storeName: string, keys: string[], parallelism?: number, metadata?: string): Promise<KeyValueType[]>;
    delete(storeName: string, key: string): Promise<void>;
    transaction(storeName: string, operations?: OperationType[], metadata?: IRequestMetadata | null): Promise<void>;
}