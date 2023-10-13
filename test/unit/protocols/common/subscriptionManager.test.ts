/*
Copyright 2023 The Dapr Authors
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

import { SubscriptionManager } from "../../../../src/pubsub/subscriptionManager";

describe("subscriptionManager", () => {
  describe("lookupTopicWildcard", () => {
    it("should return an empty topic and route if the pubsub is not registered", () => {
      const sm = new SubscriptionManager();
      const res = sm.lookupTopicWilcard("pubsub", "topic", "route");

      expect(res[0]).toEqual("");
      expect(res[1]).toEqual("");
    });

    it("should return an empty topic and route if the pubsub is registered, but no topic matched", () => {
      const sm = new SubscriptionManager();
      sm.registerSubscription("pubsub", "topic", {});

      const res = sm.lookupTopicWilcard("pubsub", "topic-undefined", "route");

      expect(res[0]).toEqual("");
      expect(res[1]).toEqual("");
    });
  });
});
