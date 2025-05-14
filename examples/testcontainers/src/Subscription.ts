/*
Copyright 2025 The Dapr Authors
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

import YAML from "yaml";

export class Subscription {
  constructor(
    public readonly name: string,
    public readonly pubsubName: string,
    public readonly topic: string,
    public readonly route: string
  ) {}

  toYaml(): string {
    const subscriptionObj: {
      apiVersion: string;
      kind: string;
      metadata: {
        name: string;
      };
      spec: {
        pubsub: string;
        topic: string;
        route: string;
        metadata: {
          name: string;
          value: string;
        }[];
      };
    } = {
      apiVersion: "dapr.io/v1alpha1",
      kind: "Subscription",
      metadata: {
        name: this.name
      },
      spec: {
        pubsub: this.pubsubName,
        topic: this.topic,
        route: this.route,
        metadata: [
          {
            name: "topic",
            value: this.topic
          },
          {
            name: "pubsubname",
            value: this.pubsubName
          }
        ]
      }
    };
    return YAML.stringify(subscriptionObj);
  }
}
