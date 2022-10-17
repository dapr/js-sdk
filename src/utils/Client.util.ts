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

import * as grpc from "@grpc/grpc-js";
import { KeyValueType } from "../types/KeyValue.type";
import { ConfigurationType } from "../types/KeyConfig.type";
import { ConfigurationItem } from "../types/configuration/ConfigurationItem";
import { ConfigurationItem  as ConfigurationItemProto} from "../proto/dapr/proto/common/v1/common_pb";
import { Map } from "google-protobuf";
/**
 * Converts a KeyValueType to a grpc.Metadata object.
 * @param metadata key value pair of metadata
 * @returns grpc.Metadata object
 */
export function createGRPCMetadata(metadata: KeyValueType = {}): grpc.Metadata {
  const grpcMetadata = new grpc.Metadata();
  for (const [key, value] of Object.entries(metadata)) {
    grpcMetadata.set(key, value);
  }
  return grpcMetadata;
}

/**
 * Converts a KeyValueType to a HTTP query parameters.
 * The query parameters are separated by "&", and the key value pair is separated by "=".
 * Each metadata key is prefixed with "metadata.".
 *
 * Example, if the metadata is { "key1": "value1", "key2": "value2" }, the query parameter will be:
 * "metadata.key1=value1&metadata.key2=value2"
 *
 * Note, the returned value does not contain the "?" prefix.
 *
 * @param metadata key value pair of metadata
 * @returns HTTP query parameter string
 */
export function createHTTPMetadataQueryParam(metadata: KeyValueType = {}): string {
    let queryParam = "";
    for (const [key, value] of Object.entries(metadata)) {
        queryParam += "&" + "metadata." + encodeURIComponent(key) + "=" + encodeURIComponent(value);
    }
    // strip the first "&" if it exists
    queryParam = queryParam.substring(1);
    return queryParam;
}

/**
 * Converts a Map<string, common_pb.ConfigurationItemProto> to a ConfigurationType object.
 * @param Map<string, common_pb.ConfigurationItemProto> 
 * @returns ConfigurationType object
 */
 export function createConfigurationType(configDict: Map<string, ConfigurationItemProto>): ConfigurationType {
    const configMap: { [k: string]: ConfigurationItem } = {};

    configDict.forEach(function(v, k) {
      const item: ConfigurationItem = {
        key : k,
        value : v.getValue(),
        version : v.getVersion(),         
        metadata :  v.getMetadataMap().toObject().reduce((result: object, [key, value]) => {
        // @ts-ignore
        result[key] = value;
        return result
      }, {}),
      };
      configMap[k] = item
  })
  return configMap
}
