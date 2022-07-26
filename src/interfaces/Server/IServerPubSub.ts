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

import { TypeDaprPubSubCallback } from "../../types/DaprPubSubCallback.type";
import { KeyValueType } from "../../types/KeyValue.type";

export default interface IServerPubSub {
    /**
     * Subscribe to a topic.
     * @param pubSubName name of the pubsub
     * @param topic name of the topic
     * @param cb callback function to handle messages
     * @param route The HTTP route override to register for the event subscription. 
     * Default value is `/route-${pubsubName}-${topic}`. Ignored if gRPC is used.
     * @param metadata metadata for the subscription
     */
    subscribe(pubSubName: string, topic: string, cb: TypeDaprPubSubCallback, route?: string, metadata?: KeyValueType): Promise<void>;
}