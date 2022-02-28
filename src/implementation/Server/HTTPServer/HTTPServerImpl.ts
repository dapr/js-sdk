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

interface PubSubSubscriptionRoute {
    pubsubname: string;
    topic: string;
    route: string;
}

export default class HTTPServerImpl {
    pubSubSubscriptionRoutes: PubSubSubscriptionRoute[];

    constructor() {
        this.pubSubSubscriptionRoutes = [];
    }

    registerPubSubSubscriptionRoute(pubSubName: string, topicName: string, route: string): void {
        this.pubSubSubscriptionRoutes.push({
            pubsubname: pubSubName, topic: topicName, route
        });
    }
}