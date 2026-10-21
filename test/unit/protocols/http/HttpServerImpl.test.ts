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

import express from "express";
import HTTPServerImpl from "../../../../src/implementation/Server/HTTPServer/HTTPServerImpl";

describe("HttpServerImpl", () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    verbose: jest.fn(),
    debug: jest.fn(),
  };
  let server: HTTPServerImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    server = new HTTPServerImpl(express(), { service: logger });
  });

  describe("extractSubscribeDataFromRequest", () => {
    it("should return string data correctly from req.body.data", () => {
      const req = {
        body: {
          data: "Hello, world!",
        },
      } as any;
      const data = server.extractDataFromSubscribeRequest(req);

      expect(data).toEqual("Hello, world!");
    });

    it("should return object data correctly from req.body.data", () => {
      const req = {
        body: {
          data: {
            foo: "bar",
          },
        },
      } as any;
      const data = server.extractDataFromSubscribeRequest(req);

      expect(data).toEqual({
        foo: "bar",
      });
    });

    it("should return data instead of data_base64 if former is present", () => {
      const req = {
        body: {
          data: "Hello, world!",
          data_base64: "SGVsbG8sIHdvcmxkIQ==",
        },
      } as any;
      const data = server.extractDataFromSubscribeRequest(req);

      expect(data).toEqual("Hello, world!");
    });

    it("should return data_base64 decoded if data is not present", () => {
      const req = {
        body: {
          data_base64: "SGVsbG8sIHdvcmxkIQ==",
        },
      } as any;
      const data = server.extractDataFromSubscribeRequest(req);

      expect(data).toEqual("Hello, world!");
    });

    it("should parse data_base64 as JSON", () => {
      const req = {
        body: {
          data_base64: "eyJmb28iOiAiYmFyIn0=",
        },
      } as any;
      const data = server.extractDataFromSubscribeRequest(req);

      expect(data).toEqual({
        foo: "bar",
      });
    });

    it("should return the req.body if data or data_base64 are not present", () => {
      const req = {
        body: {
          foo: "bar",
        },
      } as any;
      const data = server.extractDataFromSubscribeRequest(req);

      expect(data).toEqual({
        foo: "bar",
      });
    });

    it("should return the req.body if payload is not structured properly", () => {
      const requests = [
        {
          foo: "bar", // req.body is not present
        },
        {
          body: "Hello, world!", // req.body.data is not an object
        },
        {
          body: [1, 2, 3], // req.body.data is an array
        },
        {
          body: Buffer.from("Hello, world!"), // req.body is a buffer
        },
      ];

      requests.forEach((req) => {
        const data = server.extractDataFromSubscribeRequest(req as any);
        // If req.body is present, it should be returned as is.
        // Else, an empty string should be returned.
        if (req.body) {
          expect(data).toEqual(req.body);
        } else {
          expect(data).toEqual("");
        }
      });
    });
  });

  describe("generateDaprPubSubSubscriptionList", () => {
    it("returns an empty list when no subscriptions are registered", () => {
      expect(server.generateDaprPubSubSubscriptionList()).toEqual([]);
    });

    it("includes every topic across multiple pubsub components", () => {
      server.registerPubsubSubscription("pubsub", "orders", { route: "orders" });
      server.registerPubsubSubscription("pubsub", "payments", { route: "payments" });
      server.registerPubsubSubscription("audit", "events", { route: "events" });

      expect(server.generateDaprPubSubSubscriptionList()).toEqual([
        { pubsubname: "pubsub", topic: "orders", route: "/pubsub--orders--orders" },
        { pubsubname: "pubsub", topic: "payments", route: "/pubsub--payments--payments" },
        { pubsubname: "audit", topic: "events", route: "/audit--events--events" },
      ]);
    });

    it("preserves routing rules, metadata, dead-letter topics, and bulk settings", () => {
      server.registerPubsubSubscription("pubsub", "orders", {
        route: {
          default: "orders",
          rules: [{ match: 'event.type == "priority"', path: "priority" }],
        },
        metadata: { rawPayload: "true" },
        deadLetterTopic: "orders-dead-letter",
        bulkSubscribe: { enabled: true, maxMessagesCount: 10, maxAwaitDurationMs: 200 },
      });

      expect(server.generateDaprPubSubSubscriptionList()).toEqual([
        {
          pubsubname: "pubsub",
          topic: "orders",
          routes: {
            default: "/pubsub--orders--orders",
            rules: [{ match: 'event.type == "priority"', path: "/pubsub--orders--priority" }],
          },
          metadata: { rawPayload: '"true"' },
          deadLetterTopic: "orders-dead-letter",
          bulkSubscribe: { enabled: true, maxMessagesCount: 10, maxAwaitDurationMs: 200 },
        },
      ]);
    });
  });
});
