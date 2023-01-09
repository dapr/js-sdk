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

import { KeyValueType } from "../../types/KeyValue.type";
import { PubSubPublishResponseType } from "../../types/pubsub/PubSubPublishResponse.type";

export default interface IClientPubSub {
  /**
   * Publish data to a topic.
   * If the data is a valid cloud event, it will be published with Content-Type: application/cloudevents+json.
   * Otherwise, if it's a JSON object, it will be published with Content-Type: application/json.
   * Otherwise, it will be published with Content-Type: text/plain.
   * @param pubSubName name of the pubsub component
   * @param topic name of the topic
   * @param data data to publish
   * @param metadata metadata for the message
   *
   * @returns response from the publish
   */
  publish(
    pubSubName: string,
    topic: string,
    data?: object | string,
    metadata?: KeyValueType,
  ): Promise<PubSubPublishResponseType>;
}
