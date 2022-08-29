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
import { DaprPubSubType } from "../../types/pubsub/DaprPubSub.type";
import { DaprPubSubRouteType } from "../../types/pubsub/DaprPubSubRouteType.type";
import { PubSubSubscriptionOptionsType } from "../../types/pubsub/PubSubSubscriptionOptions.type";

export default interface IServerPubSub {
    subscribe(pubSubName: string, topic: string, cb: TypeDaprPubSubCallback, route?: string | DaprPubSubRouteType)
        : Promise<void>;
    subscribeWithOptions(pubsubName: string, topic: string, options: PubSubSubscriptionOptionsType)
        : Promise<void>;

    getSubscriptions(): DaprPubSubType[];
    getRoutes(): { [key: string]: any };
    subscribeOnEvent(pubsubName: string, topic: string, route: string | DaprPubSubRouteType, cb: TypeDaprPubSubCallback): void;
    getSubscriptionEventHandlers(): { [key: string]: TypeDaprPubSubCallback[] };
}