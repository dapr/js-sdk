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

import GRPCServerImpl from "../../../../src/implementation/Server/GRPCServer/GRPCServerImpl";

describe("GRPCServerImpl", () => {
  const mockLogWarn = jest.fn();

  const customLoggerService = {
    service: {
      error: () => jest.fn(),
      warn: mockLogWarn,
      info: () => jest.fn(),
      verbose: () => jest.fn(),
      debug: () => jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("onTopicEvent", () => {
    it("should correctly check if a pubsub was registered", async () => {
      const g = new GRPCServerImpl(undefined as any, customLoggerService);

      await g.onTopicEvent(
        {
          request: {
            getPubsubName: () => "pubsub",
          },
        } as any,
        () => {
          return {
            status: 200,
          };
        },
      );

      expect(mockLogWarn).toBeCalledTimes(1);
      expect(mockLogWarn.mock.calls[0][0]).toContain("PubSub 'pubsub' has not been registered, ignoring event.");
    });

    it("should correctly check if a topic was registered", async () => {
      const g = new GRPCServerImpl(undefined as any, customLoggerService);

      // Mock the entire class SubscriptionManager with a custom implementation
      // @ts-ignore
      g.subscriptionManager = {
        isPubSubRegistered: () => true,
        lookupTopicWilcard: () => ["", ""],
      };

      await g.onTopicEvent(
        {
          request: {
            getPubsubName: () => "pubsub",
            getTopic: () => "",
            getPath: () => "path",
          },
        } as any,
        () => {
          return {
            status: 200,
          };
        },
      );

      expect(mockLogWarn).toBeCalledTimes(1);
      expect(mockLogWarn.mock.calls[0][0]).toContain(
        "Topic '' has not been subscribed to pubsub 'pubsub', ignoring event.",
      );
    });
  });

  describe("onBulkTopicEventAlpha1", () => {
    it("should correctly check if a pubsub was registered", async () => {
      const g = new GRPCServerImpl(undefined as any, customLoggerService);

      await g.onBulkTopicEventAlpha1(
        {
          request: {
            getPubsubName: () => "pubsub",
          },
        } as any,
        () => {
          return {
            status: 200,
          };
        },
      );

      expect(mockLogWarn).toBeCalledTimes(1);
      expect(mockLogWarn.mock.calls[0][0]).toContain("PubSub 'pubsub' has not been registered, ignoring bulk event.");
    });

    it("should correctly check if a pubsub was registered", async () => {
      const g = new GRPCServerImpl(undefined as any, customLoggerService);

      // Mock the entire class SubscriptionManager with a custom implementation
      // @ts-ignore
      g.subscriptionManager = {
        isPubSubRegistered: () => true,
        lookupTopicWilcard: () => ["", ""],
      };

      await g.onBulkTopicEventAlpha1(
        {
          request: {
            getPubsubName: () => "pubsub",
            getTopic: () => "",
            getPath: () => "path",
          },
        } as any,
        () => {
          return {
            status: 200,
          };
        },
      );

      expect(mockLogWarn).toBeCalledTimes(1);
      expect(mockLogWarn.mock.calls[0][0]).toContain(
        "Topic '' has not been subscribed to pubsub 'pubsub', ignoring bulk event.",
      );
    });
  });
});
