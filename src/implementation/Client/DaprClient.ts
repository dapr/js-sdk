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

import IClient from "../../interfaces/Client/IClient";
import IClientActorBuilder from "../../interfaces/Client/IClientActorBuilder";
import IClientBinding from "../../interfaces/Client/IClientBinding";
import IClientConfiguration from "../../interfaces/Client/IClientConfiguration";
import IClientCrypto from "../../interfaces/Client/IClientCrypto";
import IClientHealth from "../../interfaces/Client/IClientHealth";
import IClientInvoker from "../../interfaces/Client/IClientInvoker";
import IClientLock from "../../interfaces/Client/IClientLock";
import IClientMetadata from "../../interfaces/Client/IClientMetadata";
import IClientProxy from "../../interfaces/Client/IClientProxy";
import IClientPubSub from "../../interfaces/Client/IClientPubSub";
import IClientSecret from "../../interfaces/Client/IClientSecret";
import IClientSidecar from "../../interfaces/Client/IClientSidecar";
import IClientState from "../../interfaces/Client/IClientState";
import IClientWorkflow from "../../interfaces/Client/IClientWorkflow";

import GRPCClient from "./GRPCClient/GRPCClient";
import GRPCClientActor from "./GRPCClient/actor";
import GRPCClientBinding from "./GRPCClient/binding";
import GRPCClientConfiguration from "./GRPCClient/configuration";
import GRPCClientCrypto from "./GRPCClient/crypto";
import GRPCClientHealth from "./GRPCClient/health";
import GRPCClientInvoker from "./GRPCClient/invoker";
import GRPCClientLock from "./GRPCClient/lock";
import GRPCClientMetadata from "./GRPCClient/metadata";
import GRPCClientPubSub from "./GRPCClient/pubsub";
import GRPCClientSecret from "./GRPCClient/secret";
import GRPCClientSidecar from "./GRPCClient/sidecar";
import GRPCClientState from "./GRPCClient/state";
import GRPCClientWorkflow from "./GRPCClient/workflow";

import HTTPClient from "./HTTPClient/HTTPClient";
import HTTPClientActor from "./HTTPClient/actor";
import HTTPClientBinding from "./HTTPClient/binding";
import HTTPClientConfiguration from "./HTTPClient/configuration";
import HTTPClientCrypto from "./HTTPClient/crypto";
import HTTPClientHealth from "./HTTPClient/health";
import HTTPClientInvoker from "./HTTPClient/invoker";
import HTTPClientLock from "./HTTPClient/lock";
import HTTPClientMetadata from "./HTTPClient/metadata";
import HTTPClientProxy from "./HTTPClient/proxy";
import HTTPClientPubSub from "./HTTPClient/pubsub";
import HTTPClientSecret from "./HTTPClient/secret";
import HTTPClientSidecar from "./HTTPClient/sidecar";
import HTTPClientState from "./HTTPClient/state";
import HTTPClientWorkflow from "./HTTPClient/workflow";

import CommunicationProtocolEnum from "../../enum/CommunicationProtocol.enum";
import { DaprClientOptions } from "../../types/DaprClientOptions";
import { Settings } from "../../utils/Settings.util";
import { Logger } from "../../logger/Logger";
import GRPCClientProxy from "./GRPCClient/proxy";
import * as NodeJSUtils from "../../utils/NodeJS.util";
import { getClientOptions } from "../../utils/Client.util";

/**
 * Main client for interacting with Dapr runtime capabilities.
 *
 * DaprClient provides a unified interface for accessing all Dapr building blocks including
 * state management, pub/sub messaging, service invocation, secrets, actors, and more.
 * The client automatically selects the appropriate communication protocol (HTTP or gRPC)
 * based on configuration and manages the underlying protocol-specific implementation.
 *
 * @see {@link https://dapr.io/docs/developing-applications/building-blocks/ | Dapr Building Blocks}
 *
 * @example
 * ```typescript
 * import { DaprClient } from "@dapr/dapr";
 *
 * // Create client with default configuration (HTTP to localhost:3500)
 * const client = new DaprClient();
 *
 * // State management
 * await client.state.save("statestore", [
 *   { key: "user-1", value: { name: "Alice" } }
 * ]);
 * const user = await client.state.get("statestore", "user-1");
 *
 * // Pub/Sub
 * await client.pubsub.publish("pubsub", "orders", { orderId: "123" });
 *
 * // Service invocation
 * const result = await client.invoker.invoke("payment-service", "ProcessPayment", {
 *   body: { amount: 99.99 }
 * });
 *
 * // Secrets
 * const apiKey = await client.secret.get("vault", "api-key");
 *
 * // Clean up
 * await client.stop();
 * ```
 */
export default class DaprClient {
  /**
   * Resolved client configuration after initialization.
   * Includes defaults and environment variable overrides.
   */
  readonly options: DaprClientOptions;

  /**
   * Underlying protocol-specific client (HTTP or gRPC).
   * Typically accessed indirectly through the building block properties.
   *
   * @internal
   */
  readonly daprClient: IClient;

  /**
   * Actor building block client.
   * Provides access to actor runtime, methods, reminders, and timers.
   *
   * @see {@link https://dapr.io/docs/developing-applications/building-blocks/actors/ | Dapr Actors}
   */
  readonly actor: IClientActorBuilder;

  /**
   * Output bindings client.
   * Sends events to external systems via configured output bindings.
   *
   * @see {@link https://dapr.io/docs/developing-applications/building-blocks/bindings/ | Dapr Bindings}
   */
  readonly binding: IClientBinding;

  /**
   * Configuration store client.
   * Retrieves and watches application configuration values.
   *
   * @see {@link https://dapr.io/docs/developing-applications/building-blocks/configuration/ | Dapr Configuration}
   */
  readonly configuration: IClientConfiguration;

  /**
   * Cryptographic operations client.
   * Encrypts and decrypts data using configured crypto providers.
   *
   * @see {@link https://dapr.io/docs/developing-applications/building-blocks/cryptography/ | Dapr Cryptography}
   */
  readonly crypto: IClientCrypto;

  /**
   * Health check client.
   * Probes the Dapr sidecar and application readiness.
   */
  readonly health: IClientHealth;

  /**
   * Service invocation client.
   * Calls methods on other services via Dapr service invocation.
   *
   * @see {@link https://dapr.io/docs/developing-applications/building-blocks/service-invocation/ | Dapr Service Invocation}
   */
  readonly invoker: IClientInvoker;

  /**
   * Distributed lock client.
   * Acquires and releases locks for coordinated access to resources.
   *
   * @see {@link https://dapr.io/docs/developing-applications/building-blocks/distributed-lock/ | Dapr Locks}
   */
  readonly lock: IClientLock;

  /**
   * Metadata client.
   * Retrieves runtime metadata and active subscriptions.
   */
  readonly metadata: IClientMetadata;

  /**
   * Typed service proxy client.
   * Creates type-safe proxies for service-to-service invocation.
   *
   * @see {@link https://dapr.io/docs/developing-applications/building-blocks/service-invocation/ | Dapr Service Invocation}
   */
  readonly proxy: IClientProxy;

  /**
   * Pub/Sub client.
   * Publishes messages to topics and subscribes to topic handlers.
   *
   * @see {@link https://dapr.io/docs/developing-applications/building-blocks/pubsub/ | Dapr Pub/Sub}
   */
  readonly pubsub: IClientPubSub;

  /**
   * Secrets client.
   * Retrieves secrets from configured secret stores.
   *
   * @see {@link https://dapr.io/docs/developing-applications/building-blocks/secrets/ | Dapr Secrets}
   */
  readonly secret: IClientSecret;

  /**
   * Sidecar client.
   * Manages the Dapr sidecar lifecycle (shutdown, etc.).
   */
  readonly sidecar: IClientSidecar;

  /**
   * State management client.
   * Manages durable state storage with transactions and querying.
   *
   * @see {@link https://dapr.io/docs/developing-applications/building-blocks/state-management/ | Dapr State Management}
   */
  readonly state: IClientState;

  /**
   * Workflow client.
   * Manages workflow instances and job scheduling.
   *
   * @see {@link https://dapr.io/docs/developing-applications/building-blocks/workflow/ | Dapr Workflows}
   */
  readonly workflow: IClientWorkflow;

  private readonly logger: Logger;

  /**
   * Creates a new Dapr client instance.
   *
   * Initializes the appropriate protocol-specific client (HTTP or gRPC) based on
   * configuration and wires up all building block implementations. Auto-selects
   * HTTP by default unless DAPR_PROTOCOL_ENVIRONMENT_VARIABLE is set.
   *
   * @param options - Optional client configuration
   * @param options.daprHost - Sidecar host (default: localhost, env: DAPR_HOST)
   * @param options.daprPort - Sidecar port (default: 3500 for HTTP, 50001 for gRPC, env: DAPR_PORT)
   * @param options.communicationProtocol - HTTP or gRPC (default: HTTP, env: DAPR_PROTOCOL)
   * @param options.daprApiToken - API token for sidecar auth (env: DAPR_API_TOKEN)
   * @param options.isKeepAlive - Enable keep-alive connections (default: true)
   * @param options.maxBodySizeMb - Maximum request body size (default: 4)
   * @param options.logger - Custom logger instance
   * @param options.actor - Actor configuration options
   *
   * @throws {Error} When daprPort is invalid or sidecar connection fails
   *
   * @example
   * ```typescript
   * // Use defaults (HTTP, localhost:3500)
   * const client = new DaprClient();
   *
   * // Use gRPC with custom host/port
   * const client = new DaprClient({
   *   communicationProtocol: CommunicationProtocolEnum.GRPC,
   *   daprHost: "dapr-sidecar.default.svc.cluster.local",
   *   daprPort: "50001"
   * });
   *
   * // With authentication
   * const client = new DaprClient({
   *   daprApiToken: "your-api-token"
   * });
   * ```
   */
  constructor(options: Partial<DaprClientOptions> = {}) {
    options = getClientOptions(options, Settings.getDefaultCommunicationProtocol(), undefined);
    this.logger = new Logger("DaprClient", "DaprClient", options.logger);

    // Legacy validation on port
    // URI validation is done later, when we instantiate the HttpEndpoint or GrpcEndpoint
    // object in the HttpClient or GrpcClient constructor, but we need to
    // keep this additional check for backward compatibility
    // TODO: Remove this validation in the next major version
    if (options?.daprPort && !/^[0-9]+$/.test(options?.daprPort)) {
      throw new Error("DAPR_INCORRECT_SIDECAR_PORT");
    }

    // Builder
    switch (options.communicationProtocol) {
      case CommunicationProtocolEnum.GRPC: {
        const client = new GRPCClient(options);
        this.daprClient = client;

        this.state = new GRPCClientState(client);
        this.pubsub = new GRPCClientPubSub(client);
        this.binding = new GRPCClientBinding(client);
        this.invoker = new GRPCClientInvoker(client);
        this.secret = new GRPCClientSecret(client);
        this.health = new GRPCClientHealth(client);
        this.metadata = new GRPCClientMetadata(client);
        this.sidecar = new GRPCClientSidecar(client);
        this.proxy = new GRPCClientProxy(client);
        this.configuration = new GRPCClientConfiguration(client);
        this.lock = new GRPCClientLock(client);
        this.crypto = new GRPCClientCrypto(client);
        this.actor = new GRPCClientActor(client); // we use an abstractor here since we interface through a builder with the Actor Runtime
        this.workflow = new GRPCClientWorkflow(client);
        break;
      }
      case CommunicationProtocolEnum.HTTP:
      default: {
        const client = new HTTPClient(options);
        this.daprClient = client;

        this.actor = new HTTPClientActor(client); // we use an abstractor here since we interface through a builder with the Actor Runtime
        this.binding = new HTTPClientBinding(client);
        this.configuration = new HTTPClientConfiguration(client);
        this.crypto = new HTTPClientCrypto(client);
        this.health = new HTTPClientHealth(client);
        this.invoker = new HTTPClientInvoker(client);
        this.lock = new HTTPClientLock(client);
        this.metadata = new HTTPClientMetadata(client);
        this.proxy = new HTTPClientProxy(client);
        this.pubsub = new HTTPClientPubSub(client);
        this.secret = new HTTPClientSecret(client);
        this.sidecar = new HTTPClientSidecar(client);
        this.state = new HTTPClientState(client);
        this.workflow = new HTTPClientWorkflow(client);
        break;
      }
    }

    this.options = {
      daprHost: this.daprClient.options.daprHost,
      daprPort: this.daprClient.options.daprPort,
      communicationProtocol: this.daprClient.options.communicationProtocol,
      isKeepAlive: options.isKeepAlive,
      logger: options.logger,
      actor: options.actor,
      daprApiToken: options.daprApiToken,
      maxBodySizeMb: options.maxBodySizeMb,
    };
  }

  /**
   * Creates a DaprClient from an existing IClient instance.
   *
   * Useful for wrapping a custom or pre-configured protocol-specific client.
   * The returned DaprClient shares the same underlying client instance.
   *
   * @param client - Configured IClient implementation (HTTP or gRPC)
   * @returns DaprClient wrapping the provided client
   *
   * @example
   * ```typescript
   * const grpcClient = new GRPCClient({ daprPort: "50001" });
   * const client = DaprClient.create(grpcClient);
   * ```
   */
  static create(client: IClient): DaprClient {
    return new DaprClient(client.options);
  }

  /**
   * Waits for the Dapr sidecar to become available and ready.
   *
   * Polls the sidecar health check endpoint at regular intervals (default 50ms)
   * until it responds successfully or the timeout (60 seconds) is exceeded.
   * Useful in startup sequences to ensure the sidecar is ready before making API calls.
   *
   * @param fnIsSidecarStarted - Async function that returns true when sidecar is ready
   * @param logger - Logger instance for status messages
   * @returns Promise that resolves when sidecar is ready
   *
   * @throws {Error} With code "DAPR_SIDECAR_COULD_NOT_BE_STARTED" if timeout exceeded
   *
   * @example
   * ```typescript
   * const client = new DaprClient();
   * await DaprClient.awaitSidecarStarted(
   *   () => client.health.isHealthy(),
   *   client["logger"]
   * );
   * // Now safe to make API calls
   * ```
   */
  static async awaitSidecarStarted(fnIsSidecarStarted: () => Promise<boolean>, logger: Logger): Promise<void> {
    // Dapr will probe every 50ms to see if we are listening on our port: https://github.com/dapr/dapr/blob/a43712c97ead550ca2f733e9f7e7769ecb195d8b/pkg/runtime/runtime.go#L1694
    // if we are using actors we will change this to 4s to let the placement tables update
    let isStarted = await fnIsSidecarStarted();
    let isStartedRetryCount = 0;
    const isStartedMaxRetryCount = 60; // 1s startup delay and we try max for 60s

    if (isStarted) {
      return;
    }

    logger.info(`Awaiting Sidecar to be Started`);
    while (!isStarted) {
      logger.verbose(`Waiting for the Dapr Sidecar to start, retry count: (#${isStartedRetryCount})`);
      await NodeJSUtils.sleep(Settings.getDaprSidecarPollingDelayMs());

      // Implement API call manually as we need to enable calling without initialization
      // everything routes through the `execute` method
      // to check health, we just ping the /metadata endpoint and see if we get a response
      isStarted = await fnIsSidecarStarted();

      // Finally, Handle the retry logic
      isStartedRetryCount++;

      if (isStartedRetryCount > isStartedMaxRetryCount) {
        throw new Error("DAPR_SIDECAR_COULD_NOT_BE_STARTED");
      }
    }
  }

  /**
   * Stops the client and closes connections to the Dapr sidecar.
   *
   * Gracefully shuts down the underlying HTTP or gRPC client connection.
   * Should be called when the client is no longer needed to free up resources.
   * After stopping, the client cannot be reused.
   *
   * @returns Promise that resolves when the client is stopped
   *
   * @example
   * ```typescript
   * const client = new DaprClient();
   * try {
   *   // Use client...
   * } finally {
   *   await client.stop();
   * }
   * ```
   */
  async stop(): Promise<void> {
    await this.daprClient.stop();
  }

  /**
   * Starts the client and establishes connection to the Dapr sidecar.
   *
   * Initializes the underlying HTTP or gRPC client connection.
   * Should be called before making any API calls. May be called automatically
   * by the SDK depending on configuration.
   *
   * @returns Promise that resolves when the client is started
   *
   * @throws {Error} If connection to sidecar cannot be established
   *
   * @example
   * ```typescript
   * const client = new DaprClient();
   * await client.start();
   * // Now safe to make API calls
   * ```
   */
  async start(): Promise<void> {
    await this.daprClient.start();
  }

  /**
   * Checks if the client is initialized and ready to use.
   *
   * Returns whether the underlying protocol-specific client has been successfully
   * initialized. Does not perform any network calls—just checks internal state.
   *
   * @returns true if client is initialized, false otherwise
   */
  getIsInitialized(): boolean {
    return this.daprClient.getIsInitialized();
  }
}
