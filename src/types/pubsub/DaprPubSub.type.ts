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

// https://github.com/dapr/dapr/blob/master/pkg/apis/subscriptions/v2alpha1/types.go#L36
import { KeyValueType } from "../KeyValue.type";
import { DaprPubSubRouteType } from "./DaprPubSubRouteType.type";

/**
 * DaprPubSubType is the Type used by the Dapr API to interface with its PubSub component
 */
export type DaprPubSubType = {
  // The pubsub component name
  pubsubname: string;

  // The topic name
  topic: string;

  // Metadata 
  metadata?: KeyValueType;

  // A singular route to send the event to
  route?: string;

  // A rule based route to send the event to
  routes?: DaprPubSubRouteType;

  // The path to send unprocessable events to
  deadLetterTopic?: string;
}

