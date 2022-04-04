import { GetConfigurationResponse } from "../../types/configuration/GetConfigurationResponse";
import { SubscribeConfigurationCallback } from "../../types/configuration/SubscribeConfigurationCallback";
import { KeyValueType } from "../../types/KeyValue.type";

export default interface IClientConfiguration {
  // https://github.com/dapr/dapr/blob/master/dapr/proto/runtime/v1/dapr.proto#L90
  get(storeName: string, keys?: string[], metadata?: KeyValueType): Promise<GetConfigurationResponse>;
  subscribe(storeName: string, cb: SubscribeConfigurationCallback): Promise<void>;
  subscribeWithKeys(storeName: string, keys: string[], cb: SubscribeConfigurationCallback): Promise<void>;
  subscribeWithMetadata(storeName: string, keys: string[], metadata: KeyValueType, cb: SubscribeConfigurationCallback): Promise<void>;
}