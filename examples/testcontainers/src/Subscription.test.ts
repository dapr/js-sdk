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

import { DAPR_RUNTIME_IMAGE, DaprContainer } from "./DaprContainer";
import { Subscription } from "./Subscription";

describe("Subscription", () => {
  it("should convert default route to YAML", () => {
    const dapr = new DaprContainer(DAPR_RUNTIME_IMAGE)
      .withAppName("dapr-app")
      .withAppPort(8081)
      .withSubscription(new Subscription("my-subscription", "pubsub", "topic", undefined, "/events"))
      .withAppChannelAddress("host.testcontainers.internal");
    const subscriptions = dapr.getSubscriptions();
    expect(subscriptions.length).toBe(1);
    const subscription = subscriptions[0];
    const subscriptionYaml = subscription.toYaml();
    const expectedSubscriptionYaml =
      "apiVersion: dapr.io/v2alpha1\n" +
      "kind: Subscription\n" +
      "metadata:\n" +
      "  name: my-subscription\n" +
      "spec:\n" +
      "  pubsubname: pubsub\n" +
      "  topic: topic\n" +
      "  routes:\n" +
      "    default: /events\n";
    expect(subscriptionYaml).toEqual(expectedSubscriptionYaml);
  });

  it("should convert rules to YAML", () => {
    const rules = [
      {
        match: 'event.type == "foo"',
        path: "/foo",
      },
    ];
    const subscription = new Subscription("my-subscription", "pubsub", "topic", rules);
    const subscriptionYaml = subscription.toYaml();
    const expectedSubscriptionYaml =
      "apiVersion: dapr.io/v2alpha1\n" +
      "kind: Subscription\n" +
      "metadata:\n" +
      "  name: my-subscription\n" +
      "spec:\n" +
      "  pubsubname: pubsub\n" +
      "  topic: topic\n" +
      "  routes:\n" +
      "    rules:\n" +
      '    - match: event.type == "foo"\n' +
      "      path: /foo\n";
    expect(subscriptionYaml).toEqual(expectedSubscriptionYaml);
  });
});
