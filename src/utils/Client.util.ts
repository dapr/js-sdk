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
import { ConfigurationType } from "../types/configuration/Configuration.type";
import { ConfigurationItem } from "../types/configuration/ConfigurationItem";
import { ConfigurationItem as ConfigurationItemProto } from "../proto/dapr/proto/common/v1/common_pb";
import { Map } from "google-protobuf";
import { PubSubBulkPublishEntry } from "../types/pubsub/PubSubBulkPublishEntry.type";
import { randomUUID } from "crypto";
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

  configDict.forEach(function (v, k) {
    const item: ConfigurationItem = {
      key: k,
      value: v.getValue(),
      version: v.getVersion(),
      metadata: v
        .getMetadataMap()
        .toObject()
        .reduce((result: object, [key, value]) => {
          // @ts-ignore
          result[key] = value;
          return result;
        }, {}),
    };
    configMap[k] = item;
  });
  return configMap;
}

/**
 * Checks if the input object is a valid Cloud Event.
 * A valid Cloud Event is a JSON object that contains id, source, type, and specversion.
 * See https://github.com/cloudevents/spec/blob/v1.0/spec.md#required-attributes
 * @param str input object
 * @returns true if the object is a valid Cloud Event
 */
function isCloudEvent(obj: object): boolean {
  const requiredAttributes = ["id", "source", "type", "specversion"];
  return (
    typeof obj === "object" &&
    obj !== null &&
    requiredAttributes.every((attr) => {
      return Object.prototype.hasOwnProperty.call(obj, attr);
    })
  );
}

/**
 * Gets the Content-Type for the input data.
 * If the data is a valid Cloud Event, the Content-Type is "application/cloudevents+json".
 * If the data is a JSON object, the Content-Type is "application/json".
 * Otherwise, the Content-Type is "text/plain".
 * @param data input data
 * @returns Content-Type header value
 */
export function getContentType(data: object | string): string {
  if (typeof data === "string") {
    return "text/plain";
  }

  if (isCloudEvent(data)) {
    return "application/cloudevents+json";
  } else {
    return "application/json";
  }
}

/**
 * Configure the entries for bulk publish request.
 * If entryIDs are missing, generate UUIDs for them.
 * If contentTypes are missing, infer them based on the data using {@link getContentType}.
 *
 * @param entries entries to configure
 * @returns configured entries
 */
export function configureBulkPublishEntries(entries: PubSubBulkPublishEntry[]): PubSubBulkPublishEntry[] {
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    // If entryID is missing, generate a UUID for it.
    if (!entry.entryID) {
      entry.entryID = randomUUID();
    }
    // If contentType is missing, infer it from the data.
    if (entry.data && !entry.contentType) {
      entry.contentType = getContentType(entry.data);
    }
  }
  return entries;
}
