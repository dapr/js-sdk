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

type Rule = {
  match?: string;
  path: string;
};

type SubscriptionResource = {
  apiVersion: "dapr.io/v2alpha1";
  kind: "Subscription";
  metadata: {
    name: string;
  };
  spec: {
    pubsubname: string;
    topic: string;
    routes: {
      rules?: Rule[];
      default?: string;
    }
  };
};

export class Subscription {
  constructor(
    public readonly name: string,
    public readonly pubsubName: string,
    public readonly topic: string,
    public readonly rules?: Rule[],
    public readonly defaultRoute?: string
  ) {}

  toYaml(): string {
    const resource: SubscriptionResource = {
      apiVersion: "dapr.io/v2alpha1",
      kind: "Subscription",
      metadata: {
        name: this.name
      },
      spec: {
        pubsubname: this.pubsubName,
        topic: this.topic,
        routes: {
          ...{ rules: this.rules },
          ...{ default: this.defaultRoute }
        }
      }
    };
    return YAML.stringify(resource, { indentSeq: false });
  }
}
