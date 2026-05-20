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

import { createClient, type Client, type Interceptor } from "@connectrpc/connect";
import { createGrpcTransport } from "@connectrpc/connect-node";
import { Dapr } from "../../../proto/dapr/proto/runtime/v1/dapr_pb";
import IClient from "../../../interfaces/Client/IClient";
import { DaprClientOptions } from "../../../types/DaprClientOptions";
import { Settings } from "../../../utils/Settings.util";
import { Logger } from "../../../logger/Logger";
import GRPCClientSidecar from "./sidecar";
import DaprClient from "../DaprClient";
import communicationProtocolEnum from "../../../enum/CommunicationProtocol.enum";
import { GrpcEndpoint } from "../../../network/GrpcEndpoint";

/**
 * gRPC-based Dapr client implementation.
 *
 * Provides low-level gRPC communication with the Dapr sidecar using ConnectRPC transport.
 * This is the protocol implementation layer; most applications should use DaprClient instead.
 *
 * Uses ConnectRPC for efficient binary serialization and streaming support.
 * Automatically configures connection pooling, max message sizes, and TLS based on configuration.
 *
 * @implements {IClient}
 * @see {@link DaprClient} for the public-facing unified client
 * @see {@link https://connectrpc.com | ConnectRPC Documentation}
 *
 * @internal
 */
export default class GRPCClient implements IClient {
  /**
   * Resolved gRPC client configuration (host, port, protocol, etc.).
   */
  readonly options: DaprClientOptions;

  /**
   * Initialization status flag.
   *
   * @private
   */
  private isInitialized: boolean;

  /**
   * ConnectRPC gRPC client for making RPC calls.
   *
   * @private
   */
  private readonly client: Client<typeof Dapr>;

  /**
   * Logger instance for debug/info/error messages.
   *
   * @private
   */
  private readonly logger: Logger;

  /**
   * Resolved gRPC endpoint (hostname:port with TLS info).
   *
   * @private
   */
  private daprEndpoint: GrpcEndpoint;

  /**
   * Creates a new gRPC Dapr client instance.
   *
   * Initializes the ConnectRPC transport with configured endpoint, interceptors for API tokens,
   * and message size limits. Does not establish connection until start() is called.
   *
   * @param options - gRPC client configuration
   * @param options.daprHost - Sidecar hostname (default: localhost, env: DAPR_HOST)
   * @param options.daprPort - Sidecar gRPC port (default: 50001, env: DAPR_PORT)
   * @param options.daprApiToken - API token for authentication (env: DAPR_API_TOKEN)
   * @param options.isKeepAlive - Enable connection keep-alive (default: true)
   * @param options.maxBodySizeMb - Max message size in MB (default: 4)
   * @param options.logger - Custom logger instance
   * @param options.actor - Actor configuration
   *
   * @example
   * ```typescript
   * const client = new GRPCClient({
   *   daprHost: "localhost",
   *   daprPort: "50001",
   *   daprApiToken: "secret-token"
   * });
   * await client.start();
   * const grpcClient = await client.getClient();
   * ```
   */
  constructor(options: Partial<DaprClientOptions>) {
    this.daprEndpoint = this.generateEndpoint(options);

    this.options = {
      daprHost: this.daprEndpoint.hostname,
      daprPort: this.daprEndpoint.port,
      communicationProtocol: communicationProtocolEnum.GRPC,
      isKeepAlive: options?.isKeepAlive,
      logger: options?.logger,
      actor: options?.actor,
      daprApiToken: options?.daprApiToken,
      maxBodySizeMb: options?.maxBodySizeMb,
    };

    this.logger = new Logger("GRPCClient", "GRPCClient", options.logger);
    this.isInitialized = false;

    const maxBytes = (this.options.maxBodySizeMb ?? 4) * 1024 * 1024;
    const interceptors: Interceptor[] = [];

    if (this.options.daprApiToken) {
      interceptors.push(this.generateInterceptor());
    }

    const baseUrl = `${this.daprEndpoint.tls ? "https" : "http"}://${this.daprEndpoint.hostname}:${this.daprEndpoint.port}`;
    this.logger.info(`Opening connection to ${this.options.daprHost}:${this.options.daprPort}`);

    const transport = createGrpcTransport({
      baseUrl,
      interceptors,
      readMaxBytes: maxBytes,
      writeMaxBytes: maxBytes,
    });

    this.client = createClient(Dapr, transport);
  }

  /**
   * Gets the underlying ConnectRPC client for making RPC calls.
   *
   * Ensures the client is initialized before returning it. If requiresInitialization is true
   * and the client is not initialized, calls start() to initialize.
   *
   * @param requiresInitialization - Whether to auto-initialize if needed (default: true)
   * @returns Promise resolving to the initialized ConnectRPC client
   *
   * @throws {Error} If initialization fails
   *
   * @internal
   */
  async getClient(requiresInitialization = true): Promise<Client<typeof Dapr>> {
    if (!this.isInitialized && requiresInitialization) {
      await this.start();
    }
    return this.client;
  }

  /**
   * Generates gRPC endpoint from configuration.
   *
   * Resolves the sidecar endpoint using provided options, environment variables,
   * and defaults. Validates endpoint URI format for gRPC connectivity.
   *
   * @param options - Client configuration with daprHost/daprPort
   * @returns Parsed GrpcEndpoint with hostname, port, and TLS info
   *
   * @private
   */
  private generateEndpoint(options: Partial<DaprClientOptions>): GrpcEndpoint {
    const host = options?.daprHost ?? Settings.getDefaultHost();
    const port = options?.daprPort ?? Settings.getDefaultGrpcPort();
    let uri = `${host}:${port}`;

    if (!(options?.daprHost || options?.daprPort)) {
      const endpoint = Settings.getDefaultGrpcEndpoint();
      if (endpoint != "") {
        uri = endpoint;
      }
    }

    return new GrpcEndpoint(uri);
  }

  /**
   * Generates ConnectRPC interceptor for API token authentication.
   *
   * Adds the "dapr-api-token" header to all outgoing gRPC requests if a token is configured.
   *
   * @returns ConnectRPC interceptor function
   *
   * @private
   */
  private generateInterceptor(): Interceptor {
    const token = this.options.daprApiToken as string;
    return (next) => async (req) => {
      if (!req.header.has("dapr-api-token")) {
        req.header.set("dapr-api-token", token);
      }
      return await next(req);
    };
  }

  /**
   * Sets the initialization status flag.
   *
   * @param isInitialized - Whether the client is initialized
   *
   * @internal
   */
  setIsInitialized(isInitialized: boolean): void {
    this.isInitialized = isInitialized;
  }

  /**
   * Gets the current initialization status.
   *
   * @returns true if client is initialized, false otherwise
   *
   * @internal
   */
  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Closes the gRPC connection (no-op with ConnectRPC transport).
   *
   * ConnectRPC manages connections automatically, so explicit closure is not needed.
   *
   * @returns Empty promise
   *
   * @internal
   */
  async stop(): Promise<void> {
    // No explicit connection to close with ConnectRPC transport
  }

  /**
   * Waits for the ConnectRPC client to be ready (no-op with ConnectRPC).
   *
   * ConnectRPC establishes connections lazily on first request, so explicit wait is not needed.
   *
   * @returns Empty promise
   *
   * @internal
   */
  async _startWaitForClientReady(): Promise<void> {
    // Not needed with ConnectRPC - connection is established on first request
  }

  /**
   * Waits for the Dapr sidecar to become available.
   *
   * Polls the sidecar health status until it's ready or timeout is exceeded.
   * This ensures the sidecar is available before making API calls.
   *
   * @returns Promise that resolves when sidecar is ready
   *
   * @throws {Error} If sidecar doesn't become ready within timeout
   *
   * @internal
   */
  async _startAwaitSidecarStarted(): Promise<void> {
    await DaprClient.awaitSidecarStarted(async () => await GRPCClientSidecar.isStarted(this), this.logger);
  }

  /**
   * Initializes the gRPC client for use.
   *
   * Waits for the sidecar to become available and ensures client readiness.
   * Sets the initialized flag after successful startup.
   *
   * @returns Promise that resolves when client is initialized
   *
   * @throws {Error} If initialization fails
   *
   * @internal
   */
  async start(): Promise<void> {
    await this._startAwaitSidecarStarted();
    await this._startWaitForClientReady();
    this.isInitialized = true;
  }
}
