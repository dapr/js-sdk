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

import { GetConfigurationResponse } from "../../types/configuration/GetConfigurationResponse";
import { SubscribeConfigurationCallback } from "../../types/configuration/SubscribeConfigurationCallback";
import { SubscribeConfigurationStream } from "../../types/configuration/SubscribeConfigurationStream";
import { KeyValueType } from "../../types/KeyValue.type";

export default interface IClientConfiguration {
  // https://github.com/dapr/dapr/blob/master/dapr/proto/runtime/v1/dapr.proto#L90
  get(storeName: string, keys?: string[], metadata?: KeyValueType): Promise<GetConfigurationResponse>;
  subscribe(storeName: string, cb: SubscribeConfigurationCallback): Promise<SubscribeConfigurationStream>;
  subscribeWithKeys(storeName: string, keys: string[], cb: SubscribeConfigurationCallback): Promise<SubscribeConfigurationStream>;
  subscribeWithMetadata(storeName: string, keys: string[], metadata: KeyValueType, cb: SubscribeConfigurationCallback): Promise<SubscribeConfigurationStream>;
}