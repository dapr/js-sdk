/*
Copyright 2026 The Dapr Authors
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

import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { Network, StartedNetwork, StartedTestContainer } from "testcontainers";
import { Component, DaprContainer, StartedDaprContainer } from "@dapr/testcontainer-node";
import { Code } from "@connectrpc/connect";
import {
  CommunicationProtocolEnum,
  DaprClient,
  DaprPubSubStatusEnum,
  IDaprSerializer,
  LogLevel,
  PubSubStreamingSubscription,
  PubSubStreamingSubscriptionOptions,
} from "../../../src";
import { TypeDaprPubSubCallback } from "../../../src/types/DaprPubSubCallback.type";
import {
  DAPR_TEST_RUNTIME_IMAGE,
  DAPR_TEST_PLACEMENT_IMAGE,
  DAPR_TEST_SCHEDULER_IMAGE,
  startRedisContainer,
  runWithCleanupErrorSuppression,
} from "../helpers/containers";

async function waitFor(condition: () => boolean | Promise<boolean>, description: string): Promise<void> {
  const deadline = Date.now() + 15_000;
  while (!(await condition())) {
    if (Date.now() >= deadline) throw new Error(`Timed out waiting for ${description}`);
    await delay(50);
  }
}

describe("grpc/client streaming pub/sub without an app server", () => {
  let network: StartedNetwork | undefined;
  let redis: StartedTestContainer | undefined;
  let sidecar: StartedDaprContainer | undefined;
  let client: DaprClient;
  const subscriptions: PubSubStreamingSubscription[] = [];
  const appId = `streaming-${randomUUID()}`;
  const token = "streaming-test-token";

  function makeClient(serializer?: IDaprSerializer, daprApiToken = token): DaprClient {
    if (!sidecar) throw new Error("Sidecar has not started");
    return new DaprClient({
      daprHost: sidecar.getHost(),
      daprPort: String(sidecar.getGrpcPort()),
      communicationProtocol: CommunicationProtocolEnum.GRPC,
      daprApiToken,
      serializer,
      logger: { level: LogLevel.Error },
    });
  }

  async function subscribe(
    topic: string,
    callback: TypeDaprPubSubCallback,
    options?: PubSubStreamingSubscriptionOptions,
    subscriber = client,
  ): Promise<PubSubStreamingSubscription> {
    const subscription = await subscriber.pubsub.subscribeStream("pubsub", topic, callback, options);
    subscriptions.push(subscription);
    return subscription;
  }

  async function expectAcknowledged(topic: string): Promise<void> {
    if (!redis) throw new Error("Redis has not started");
    const broker = redis;
    await waitFor(async () => {
      const result = await broker.exec(["redis-cli", "--raw", "XPENDING", topic, appId]);
      expect(result.exitCode).toBe(0);
      return result.output.trim().split(/\r?\n/)[0] === "0";
    }, `Redis acknowledgement for ${topic}`);
  }

  beforeAll(async () => {
    network = await new Network().start();
    redis = await startRedisContainer(network);
    sidecar = await new DaprContainer(DAPR_TEST_RUNTIME_IMAGE)
      .withPlacementImage(DAPR_TEST_PLACEMENT_IMAGE)
      .withSchedulerImage(DAPR_TEST_SCHEDULER_IMAGE)
      .withNetwork(network)
      .withAppName(appId)
      .withCopyContentToContainer([
        {
          target: "/dapr-resources/streaming-resiliency.yaml",
          content: JSON.stringify({
            apiVersion: "dapr.io/v1alpha1",
            kind: "Resiliency",
            metadata: { name: "streaming-resiliency" },
            spec: {
              policies: { retries: { processing: { policy: "constant", duration: "100ms", maxRetries: 3 } } },
              targets: { components: { pubsub: { inbound: { retry: "processing" } } } },
            },
          }),
        },
      ])
      .withComponent(
        new Component("pubsub", "pubsub.redis", "v1", [
          { name: "redisHost", value: "redis:6379" },
          { name: "redisPassword", value: "" },
          { name: "processingTimeout", value: "2s" },
          { name: "redeliverInterval", value: "200ms" },
        ]),
      )
      .withEnvironment({ DAPR_API_TOKEN: token })
      .start();
    client = makeClient();
  }, 180_000);

  afterEach(async () => {
    for (const subscription of subscriptions.splice(0)) {
      await subscription.close();
      // Individual tests explicitly assert failures; cleanup just waits for settlement.
      await Promise.allSettled([subscription.closed]);
    }
  });

  afterAll(async () => {
    await runWithCleanupErrorSuppression(async () => {
      await client?.stop();
      await sidecar?.stop();
      await redis?.stop();
      await network?.stop();
    });
  }, 60_000);

  it.each([undefined, DaprPubSubStatusEnum.SUCCESS, DaprPubSubStatusEnum.DROP])(
    "delivers and acknowledges %s on an authenticated stream",
    async (status) => {
      const topic = randomUUID();
      const callback = jest.fn(async () => status);
      await subscribe(topic, callback);
      await client.pubsub.publish("pubsub", topic, { order: 42 });
      await waitFor(() => callback.mock.calls.length === 1, "event delivery");
      expect(callback).toHaveBeenCalledWith(
        { order: 42 },
        expect.objectContaining({ id: expect.any(String), topic, pubsubname: "pubsub" }),
      );
      await expectAcknowledged(topic);
      await delay(500);
      expect(callback).toHaveBeenCalledTimes(1);
    },
    20_000,
  );

  it.each(["retry", "exception"])(
    "redelivers after %s and acknowledges the successful retry",
    async (mode) => {
      const topic = randomUUID();
      const ids: string[] = [];
      const callback = jest.fn(async (_data: unknown, headers: object) => {
        if (!("id" in headers) || typeof headers.id !== "string") throw new Error("Missing event ID");
        ids.push(headers.id);
        if (ids.length === 1) {
          if (mode === "exception") throw new Error("transient processing failure");
          return DaprPubSubStatusEnum.RETRY;
        }
        return DaprPubSubStatusEnum.SUCCESS;
      });
      await subscribe(topic, callback);
      await client.pubsub.publish("pubsub", topic, "retry me");
      await waitFor(() => ids.length >= 2, "redelivery");
      expect(new Set(ids).size).toBe(1);
      await expectAcknowledged(topic);
      await delay(500);
      expect(ids).toHaveLength(2);
    },
    20_000,
  );

  it("passes subscription metadata for raw payloads", async () => {
    const topic = randomUUID();
    const callback = jest.fn();
    await subscribe(topic, callback, { metadata: { rawPayload: "true" } });
    await client.pubsub.publish("pubsub", topic, "raw text", {
      metadata: { rawPayload: "true" },
      contentType: "text/plain",
    });
    await waitFor(() => callback.mock.calls.length > 0, "raw payload");
    expect(callback).toHaveBeenCalledWith("raw text", expect.objectContaining({ topic }));
    await expectAcknowledged(topic);
  }, 20_000);

  it("preserves CloudEvent IDs, attributes and extensions", async () => {
    const topic = randomUUID();
    const callback = jest.fn();
    await subscribe(topic, callback);
    await client.pubsub.publish(
      "pubsub",
      topic,
      {
        specversion: "1.0",
        id: "custom-id",
        source: "streaming-test",
        type: "test.event",
        datacontenttype: "application/json",
        custom: "extension",
        data: { nested: [false, 0, null, "hello"] },
      },
      { contentType: "application/cloudevents+json" },
    );
    await waitFor(() => callback.mock.calls.length > 0, "CloudEvent");
    expect(callback).toHaveBeenCalledWith(
      { nested: [false, 0, null, "hello"] },
      expect.objectContaining({
        id: "custom-id",
        source: "streaming-test",
        type: "test.event",
        specversion: "1.0",
        custom: "extension",
      }),
    );
    await expectAcknowledged(topic);
  }, 20_000);

  it("uses the client's custom serializer for streaming deliveries", async () => {
    const serializer: IDaprSerializer = {
      contentType: "application/json",
      serialize: (value) => JSON.stringify({ wrapped: value }),
      deserialize: (data) => JSON.parse(data).wrapped,
    };
    const customClient = makeClient(serializer);
    const topic = randomUUID();
    const callback = jest.fn();
    try {
      await subscribe(topic, callback, undefined, customClient);
      await customClient.pubsub.publish("pubsub", topic, { custom: true });
      await waitFor(() => callback.mock.calls.length > 0, "custom payload");
      expect(callback).toHaveBeenCalledWith({ custom: true }, expect.any(Object));
      await expectAcknowledged(topic);
    } finally {
      await customClient.stop();
    }
  }, 20_000);

  it("routes failed processing to the configured dead-letter topic", async () => {
    const topic = randomUUID();
    const deadLetterTopic = randomUUID();
    const deadLetter = jest.fn();
    await subscribe(deadLetterTopic, deadLetter);
    await subscribe(topic, async () => DaprPubSubStatusEnum.RETRY, { deadLetterTopic });
    await client.pubsub.publish("pubsub", topic, { failed: true });
    await waitFor(() => deadLetter.mock.calls.length > 0, "dead-letter delivery");
    expect(deadLetter).toHaveBeenCalledWith({ failed: true }, expect.objectContaining({ topic: deadLetterTopic }));
    await expectAcknowledged(topic);
    await expectAcknowledged(deadLetterTopic);
  }, 20_000);

  it("keeps concurrent subscriptions independent when one is closed and can subscribe again", async () => {
    const firstTopic = randomUUID();
    const secondTopic = randomUUID();
    const first = jest.fn();
    const second = jest.fn();
    const [firstSubscription] = await Promise.all([subscribe(firstTopic, first), subscribe(secondTopic, second)]);
    await Promise.all([
      client.pubsub.publish("pubsub", firstTopic, "first"),
      client.pubsub.publish("pubsub", secondTopic, "second"),
    ]);
    await waitFor(() => first.mock.calls.length === 1 && second.mock.calls.length === 1, "both subscriptions");
    await expectAcknowledged(firstTopic);
    await expectAcknowledged(secondTopic);
    await firstSubscription.close();
    await firstSubscription.closed;
    await client.pubsub.publish("pubsub", secondTopic, "still open");
    await waitFor(() => second.mock.calls.length === 2, "independent subscription");
    await expectAcknowledged(secondTopic);
    const replacement = jest.fn();
    await subscribe(firstTopic, replacement);
    await client.pubsub.publish("pubsub", firstTopic, "replacement");
    await waitFor(() => replacement.mock.calls.length === 1, "replacement subscription");
    expect(first).toHaveBeenCalledTimes(1);
    expect(replacement).toHaveBeenCalledWith("replacement", expect.any(Object));
    await expectAcknowledged(firstTopic);
  }, 20_000);

  it("leaves an in-flight event unacknowledged on close for a replacement subscription", async () => {
    const topic = randomUUID();
    let finish!: () => void;
    const blocked = new Promise<void>((resolve) => (finish = resolve));
    const first = jest.fn(async () => blocked);
    const subscription = await subscribe(topic, first);
    try {
      await client.pubsub.publish("pubsub", topic, { unfinished: true });
      await waitFor(() => first.mock.calls.length === 1, "in-flight callback");
      await subscription.close();
    } finally {
      finish();
    }
    await subscription.closed;
    const replacement = jest.fn();
    await subscribe(topic, replacement);
    await waitFor(() => replacement.mock.calls.length >= 1, "unacknowledged event redelivery");
    expect(replacement).toHaveBeenCalledWith({ unfinished: true }, expect.any(Object));
    await expectAcknowledged(topic);
  }, 20_000);

  it("cancels an idle stream through AbortSignal", async () => {
    const controller = new AbortController();
    const subscription = await subscribe(randomUUID(), jest.fn(), { signal: controller.signal });
    controller.abort();
    await expect(subscription.closed).resolves.toBeUndefined();
    await subscription.close();
  });

  it("processes a burst sequentially and acknowledges every event", async () => {
    const topic = randomUUID();
    const received: number[] = [];
    let active = 0;
    let maxActive = 0;
    await subscribe(topic, async (data: { index: number }) => {
      active++;
      maxActive = Math.max(active, maxActive);
      await delay(5);
      received.push(data.index);
      active--;
    });
    await Promise.all(Array.from({ length: 50 }, (_, index) => client.pubsub.publish("pubsub", topic, { index })));
    await waitFor(() => received.length >= 50, "all burst events");
    expect(received.sort((a, b) => a - b)).toEqual(Array.from({ length: 50 }, (_, i) => i));
    expect(maxActive).toBe(1);
    await expectAcknowledged(topic);
  }, 20_000);

  it("rejects nonexistent pub/sub components during setup", async () => {
    await expect(client.pubsub.subscribeStream("nonexistent", randomUUID(), jest.fn())).rejects.toBeDefined();
  });

  it("rejects unauthenticated streaming calls", async () => {
    const unauthorized = makeClient(undefined, "incorrect-token");
    // Bypass the health check so the rejection specifically exercises the streaming RPC.
    unauthorized.daprClient.setIsInitialized(true);
    try {
      await expect(unauthorized.pubsub.subscribeStream("pubsub", randomUUID(), jest.fn())).rejects.toMatchObject({
        code: Code.Unauthenticated,
      });
    } finally {
      await unauthorized.stop();
    }
  });

  it("surfaces sidecar shutdown through closed instead of silently ending or reconnecting", async () => {
    const subscription = await subscribe(randomUUID(), jest.fn());
    const rejection = expect(subscription.closed).rejects.toBeDefined();
    await sidecar?.stop();
    sidecar = undefined;
    await rejection;
    await subscription.close();
  }, 60_000);
});
