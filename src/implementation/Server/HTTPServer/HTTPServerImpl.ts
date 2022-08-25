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

import { KeyValueType } from "../../../types/KeyValue.type";

interface PubSubSubscriptionRoute {
    pubsubname: string;
    topic: string;
    route: string;
    metadata: { [key: string]: string };
}

export default class HTTPServerImpl {
    pubSubSubscriptionRoutes: PubSubSubscriptionRoute[];

    constructor() {
        this.pubSubSubscriptionRoutes = [];
    }

    registerPubSubSubscriptionRoute(pubSubName: string, topicName: string, route: string, metadata?: KeyValueType): void {
        const httpMetadata: { [key: string]: string } = {};
        for (const [key, value] of Object.entries(metadata ?? {})) {
            httpMetadata[key] = JSON.stringify(value);
        }
        this.pubSubSubscriptionRoutes.push({
            pubsubname: pubSubName, topic: topicName, route: route, metadata: httpMetadata
        });
    }
}