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

import { GenericContainer, StartedTestContainer, StartedNetwork, Wait } from "testcontainers";
import { Component, DaprContainer, DAPR_VERSION } from "@dapr/testcontainer-node";

// ------------------------------------------------------------------
// Version resolution
//
// Set the DAPR_RUNTIME_VER environment variable to test against a specific
// Dapr version (e.g. an RC or N-1 stable).  When unset, the version pinned
// in @dapr/testcontainer-node is used.
//
// All three images (daprd, placement, scheduler) always use the same version
// so that the sidecar and its supporting services are always in sync.
//
// Example:
//   DAPR_RUNTIME_VER=1.15.0 npm run test:e2e:all
// ------------------------------------------------------------------

const DAPR_TEST_VERSION = process.env.DAPR_RUNTIME_VER || DAPR_VERSION;

/** daprd image at the configured test version. */
export const DAPR_TEST_RUNTIME_IMAGE = `daprio/daprd:${DAPR_TEST_VERSION}`;

/** placement image – always matches the runtime version. */
export const DAPR_TEST_PLACEMENT_IMAGE = `daprio/placement:${DAPR_TEST_VERSION}`;

/** scheduler image – always matches the runtime version. */
export const DAPR_TEST_SCHEDULER_IMAGE = `daprio/scheduler:${DAPR_TEST_VERSION}`;

// ------------------------------------------------------------------
// Container starters
// ------------------------------------------------------------------

/**
 * Starts a Redis container on the given network with the alias "redis".
 */
export async function startRedisContainer(network: StartedNetwork): Promise<StartedTestContainer> {
  return new GenericContainer("redis:7")
    .withNetwork(network)
    .withNetworkAliases("redis")
    .withExposedPorts(6379)
    .withWaitStrategy(Wait.forLogMessage(/Ready to accept connections/))
    .withStartupTimeout(60_000)
    .start();
}

/**
 * Starts a MongoDB container on the given network with the alias "mongodb".
 */
export async function startMongoDbContainer(network: StartedNetwork): Promise<StartedTestContainer> {
  return new GenericContainer("mongo:7")
    .withNetwork(network)
    .withNetworkAliases("mongodb")
    .withExposedPorts(27017)
    .withWaitStrategy(Wait.forLogMessage(/Waiting for connections/))
    .withStartupTimeout(60_000)
    .start();
}

/**
 * Starts an EMQX MQTT broker on the given network with the alias "mqtt".
 */
export async function startMqttContainer(network: StartedNetwork): Promise<StartedTestContainer> {
  return new GenericContainer("emqx/emqx:5.10.3")
    .withNetwork(network)
    .withNetworkAliases("mqtt")
    .withExposedPorts(1883, 18083)
    .withWaitStrategy(Wait.forLogMessage(/EMQX.*is running now/))
    .withStartupTimeout(120_000)
    .start();
}

// ------------------------------------------------------------------
// Component builders (all hosts use Docker network aliases)
// ------------------------------------------------------------------

/** state.redis component backed by the "redis" network alias. */
export function buildStateRedisComponent(actorStateStore = false): Component {
  return new Component("state-redis", "state.redis", "v1", [
    { name: "redisHost", value: "redis:6379" },
    { name: "redisPassword", value: "" },
    { name: "enableTLS", value: "false" },
    { name: "failover", value: "false" },
    { name: "actorStateStore", value: actorStateStore ? "true" : "false" },
  ]);
}

/** pubsub.redis component backed by the "redis" network alias. */
export function buildPubSubRedisComponent(): Component {
  return new Component("pubsub-redis", "pubsub.redis", "v1", [
    { name: "redisHost", value: "redis:6379" },
    { name: "redisPassword", value: "" },
    { name: "enableTLS", value: "false" },
  ]);
}

/** configuration.redis component backed by the "redis" network alias. */
export function buildConfigRedisComponent(): Component {
  return new Component("config-redis", "configuration.redis", "v1", [
    { name: "redisHost", value: "redis:6379" },
    { name: "redisPassword", value: "" },
  ]);
}

/** lock.redis component backed by the "redis" network alias. */
export function buildLockRedisComponent(): Component {
  return new Component("redislock", "lock.redis", "v1", [
    { name: "redisHost", value: "redis:6379" },
    { name: "redisPassword", value: "" },
  ]);
}

/** bindings.redis component backed by the "redis" network alias. */
export function buildBindingRedisComponent(): Component {
  return new Component("binding-redis", "bindings.redis", "v1", [
    { name: "redisHost", value: "redis:6379" },
    { name: "redisPassword", value: "" },
  ]);
}

/** state.mongodb component backed by the "mongodb" network alias. */
export function buildStateMongoDbComponent(): Component {
  return new Component("state-mongodb", "state.mongodb", "v1", [{ name: "host", value: "mongodb:27017" }]);
}

/**
 * bindings.mqtt3 component backed by the "mqtt" network alias.
 * Uses the default EMQX credentials (admin/public).
 */
export function buildBindingMqttComponent(): Component {
  return new Component("binding-mqtt", "bindings.mqtt3", "v1", [
    { name: "consumerID", value: "e2e" },
    { name: "url", value: "tcp://admin:public@mqtt:1883" },
    { name: "topic", value: "topic-testing" },
    { name: "retain", value: "false" },
    { name: "cleanSession", value: "false" },
  ]);
}

/**
 * pubsub.mqtt3 component backed by the "mqtt" network alias.
 * Uses the default EMQX credentials (admin/public).
 */
export function buildPubSubMqttComponent(): Component {
  return new Component("pubsub-mqtt", "pubsub.mqtt3", "v1", [
    { name: "url", value: "tcp://admin:public@mqtt:1883" },
    { name: "qos", value: "1" },
    { name: "cleanSession", value: "true" },
    { name: "backOffMaxRetries", value: "0" },
  ]);
}

/** secretstores.local.env component (reads env vars from the daprd process). */
export function buildSecretEnvvarsComponent(): Component {
  return new Component("secret-envvars", "secretstores.local.env", "v1", []);
}

/**
 * crypto.dapr.jwks component with an embedded symmetric key for testing.
 */
export function buildCryptoLocalComponent(): Component {
  return new Component("crypto-local", "crypto.dapr.jwks", "v1", [
    {
      name: "jwks",
      value: JSON.stringify({
        keys: [{ kid: "symmetric256", kty: "oct", k: "RjJPhQzsDB5dvjQZ-85l_D_SBXWCBFx7IVsesenVvts" }],
      }),
    },
  ]);
}

/** pubsub.in-memory component — used as a fallback so Dapr starts cleanly. */
export function buildInMemoryPubSubComponent(name = "pubsub"): Component {
  return new Component(name, "pubsub.in-memory", "v1", []);
}

/**
 * Runs a cleanup function while suppressing `AggregateError` rejections that
 * testcontainers/ssh2 emit when SubtleCrypto handles are abruptly terminated
 * during container teardown.  Without this wrapper, those empty AggregateErrors
 * become unhandled rejections that Jest's jasmine runner captures and reports as
 * "Test suite failed to run" — even though every individual test passed.
 *
 * Usage in `afterAll`:
 * ```ts
 * afterAll(() => runWithCleanupErrorSuppression(async () => {
 *   await server.stop();
 *   await daprContainer.stop();
 *   await network.stop();
 * }), 60_000);
 * ```
 */

/**
 * After all cleanup tasks complete, the event loop may still have pending
 * micro-tasks / timers from ssh2/testcontainers handle teardown.  We flush
 * for this duration to allow those tasks to run (and be suppressed by our
 * filtered handler) before we restore the original handlers.
 */
const CLEANUP_ERROR_FLUSH_TIMEOUT_MS = 300;

export async function runWithCleanupErrorSuppression(fn: () => Promise<void>): Promise<void> {
  // Capture existing handlers (including Jest's jasmine unhandledRejection tracker)
  // and replace them with a filtered proxy that swallows empty AggregateErrors.
  const handlers: NodeJS.UnhandledRejectionListener[] = process
    .rawListeners("unhandledRejection")
    .slice() as NodeJS.UnhandledRejectionListener[];
  process.removeAllListeners("unhandledRejection");

  process.on("unhandledRejection", (reason: unknown) => {
    // Suppress empty-message AggregateErrors — these are from ssh2 / testcontainers
    // SubtleCrypto handle GC and carry no meaningful diagnostic information.
    if (reason instanceof AggregateError && (!reason.message || reason.message === "")) {
      return;
    }
    // Forward all other rejections to Jest's (and any other) original handlers.
    for (const h of handlers) {
      try {
        if (typeof h === "function") {
          h(reason, Promise.resolve());
        }
      } catch (_) {
        // ignore errors thrown by handlers
      }
    }
  });

  try {
    await fn();
    // Flush pending micro-tasks so that any deferred cleanup errors can be
    // caught and suppressed by our handler before we restore the originals.
    await new Promise<void>((resolve) => setTimeout(resolve, CLEANUP_ERROR_FLUSH_TIMEOUT_MS));
  } finally {
    process.removeAllListeners("unhandledRejection");
    for (const h of handlers) {
      process.on("unhandledRejection", h);
    }
  }
}

/**
 * DaprContainer extension that appends `--dapr-http-max-request-size <mb>` to
 * the daprd command built by the base class.  Required for tests that send or
 * receive payloads larger than Dapr's default 4 MB HTTP body limit.
 */
export class DaprContainerWithLargeBody extends DaprContainer {
  private readonly maxRequestSizeMb: number;

  constructor(image: string, maxRequestSizeMb: number) {
    super(image);
    this.maxRequestSizeMb = maxRequestSizeMb;
  }

  protected override async beforeContainerCreated(): Promise<void> {
    await super.beforeContainerCreated();
    // createOpts.Cmd is set by DaprContainer.beforeContainerCreated(); append our flag.
    this.createOpts.Cmd = [
      ...(this.createOpts.Cmd ?? []),
      "--dapr-http-max-request-size",
      this.maxRequestSizeMb.toString(),
    ];
  }
}
