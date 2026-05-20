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

import fetch, { RequestInit } from "node-fetch";
import { DaprClient } from "../../..";
import IClient from "../../../interfaces/Client/IClient";
import http from "http";
import https from "https";
import { DaprClientOptions } from "../../../types/DaprClientOptions";
import { Settings } from "../../../utils/Settings.util";
import { THTTPExecuteParams } from "../../../types/http/THTTPExecuteParams.type";
import { Logger } from "../../../logger/Logger";
import HTTPClientSidecar from "./sidecar";
import { SDK_VERSION } from "../../../version";
import * as SerializerUtil from "../../../utils/Serializer.util";
import communicationProtocolEnum from "../../../enum/CommunicationProtocol.enum";
import { HttpEndpoint } from "../../../network/HttpEndpoint";

/**
 * HTTP-based Dapr client implementation.
 *
 * Provides HTTP/HTTPS communication with the Dapr sidecar using node-fetch.
 * This is the protocol implementation layer; most applications should use DaprClient instead.
 *
 * Uses HTTP connection pooling and keep-alive for efficient resource usage.
 * Automatically adds User-Agent and API token headers to requests.
 *
 * @implements {IClient}
 * @see {@link DaprClient} for the public-facing unified client
 *
 * @internal
 */
export default class HTTPClient implements IClient {
  /**
   * Resolved HTTP client configuration (host, port, protocol, etc.).
   */
  readonly options: DaprClientOptions;

  /**
   * Initialization status flag.
   *
   * @private
   */
  private isInitialized: boolean;

  /**
   * Singleton HTTP client (node-fetch) shared across instances.
   *
   * @static
   * @private
   */
  private static client: typeof fetch;

  /**
   * Base URL for Dapr API v1.0 endpoint (http(s)://host:port/v1.0).
   *
   * @private
   */
  private readonly clientUrl: string;

  /**
   * Logger instance for debug/info/error messages.
   *
   * @private
   */
  private readonly logger: Logger;

  /**
   * HTTP connection agent for keep-alive pooling.
   *
   * @static
   * @private
   */
  private static httpAgent: http.Agent;

  /**
   * HTTPS connection agent for keep-alive pooling.
   *
   * @static
   * @private
   */
  private static httpsAgent: https.Agent;

  /**
   * Resolved HTTP endpoint (host:port with protocol info).
   *
   * @private
   */
  private daprEndpoint: HttpEndpoint;

  /**
   * Creates a new HTTP Dapr client instance.
   *
   * Initializes the node-fetch HTTP client with connection pooling, keep-alive configuration,
   * and maximum message sizes. Sets up HTTP/HTTPS agents for connection reuse.
   *
   * @param options - HTTP client configuration
   * @param options.daprHost - Sidecar hostname (default: localhost, env: DAPR_HOST)
   * @param options.daprPort - Sidecar HTTP port (default: 3500, env: DAPR_PORT)
   * @param options.daprApiToken - API token for authentication (env: DAPR_API_TOKEN)
   * @param options.isKeepAlive - Enable connection pooling (default: true)
   * @param options.maxBodySizeMb - Max request body size in MB (default: 4)
   * @param options.logger - Custom logger instance
   * @param options.actor - Actor configuration
   *
   * @example
   * ```typescript
   * const client = new HTTPClient({
   *   daprHost: "localhost",
   *   daprPort: "3500",
   *   daprApiToken: "secret-token"
   * });
   * await client.start();
   * const fetchClient = await client.getClient();
   * ```
   */
  constructor(options: Partial<DaprClientOptions>) {
    this.daprEndpoint = this.generateEndpoint(options);

    this.options = {
      daprHost: this.daprEndpoint.hostname,
      daprPort: this.daprEndpoint.port,
      communicationProtocol: communicationProtocolEnum.HTTP,
      isKeepAlive: options?.isKeepAlive,
      logger: options?.logger,
      actor: options?.actor,
      daprApiToken: options?.daprApiToken,
      maxBodySizeMb: options?.maxBodySizeMb,
    };

    this.logger = new Logger("HTTPClient", "HTTPClient", this.options.logger);
    this.isInitialized = false;
    this.clientUrl = `${this.daprEndpoint.endpoint}/v1.0`;

    if (!HTTPClient.client) {
      HTTPClient.client = fetch;
    }

    // Add a custom agent so we can decide if we want to reuse connections or not
    // we use an agent so we can reuse an open connection, limiting handshake requirements
    // Note: when using an agent, we will encounter TCPWRAP since the connection doesn't get destroyed
    const keepAlive = this.options.isKeepAlive ?? Settings.getDefaultKeepAlive();
    const keepAliveMsecs = 30 * 1000; // it is applicable only when keepAlive is set to true

    if (!HTTPClient.httpAgent) {
      HTTPClient.httpAgent = new http.Agent({ keepAlive: keepAlive, keepAliveMsecs: keepAliveMsecs });
    }
    if (!HTTPClient.httpsAgent) {
      HTTPClient.httpsAgent = new https.Agent({ keepAlive: keepAlive, keepAliveMsecs: keepAliveMsecs });
    }
  }

  /**
   * Resolves the HTTP endpoint URL from configuration or environment variables.
   *
   * Priority:
   * 1. Explicit host and port parameters
   * 2. Full endpoint URL from DAPR_HTTP_ENDPOINT environment variable
   * 3. Default host (localhost) and port (3500)
   *
   * @private
   * @param options - Dapr client configuration
   * @returns Parsed HttpEndpoint with host, port, and protocol
   *
   * @internal
   */
  private generateEndpoint(options: Partial<DaprClientOptions>): HttpEndpoint {
    const host = options?.daprHost ?? Settings.getDefaultHost();
    const port = options?.daprPort ?? Settings.getDefaultHttpPort();
    let uri = `${host}:${port}`;

    if (!(options?.daprHost || options?.daprPort)) {
      // If neither host nor port are specified, check the endpoint environment variable.
      const endpoint = Settings.getDefaultHttpEndpoint();
      if (endpoint != "") {
        uri = endpoint;
      }
    }

    return new HttpEndpoint(uri);
  }

  /**
   * Gets the HTTP client (node-fetch), initializing the sidecar if needed.
   *
   * If the client is not initialized and requiresInitialization is true,
   * automatically starts the sidecar before returning the client.
   *
   * @param requiresInitialization - If true, ensures sidecar is started (default: true)
   * @returns Promise resolving to the node-fetch client
   *
   * @throws Rejects if sidecar startup fails
   *
   * @internal
   */
  async getClient(requiresInitialization = true): Promise<typeof fetch> {
    // Ensure the sidecar has been started
    if (requiresInitialization && !this.isInitialized) {
      this.logger.verbose("Client is not initialized, starting sidecar and initializing");
      await this.start();
    }

    return HTTPClient.client;
  }

  /**
   * Sets the client initialization status.
   *
   * @private
   * @param isInitialized - Whether the client and sidecar have been initialized
   *
   * @internal
   */
  setIsInitialized(isInitialized: boolean): void {
    this.isInitialized = isInitialized;
  }

  /**
   * Gets the current client initialization status.
   *
   * @private
   * @returns True if the client and sidecar are initialized, false otherwise
   *
   * @internal
   */
  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Waits for the HTTP sidecar to be ready for accepting connections.
   *
   * Polls the sidecar's health endpoint until it responds successfully,
   * with exponential backoff and maximum retry timeout.
   *
   * @private
   * @returns Promise resolving once sidecar health check succeeds
   *
   * @throws Rejects if sidecar startup timeout is exceeded
   *
   * @internal
   */
  async _startAwaitSidecarStarted(): Promise<void> {
    await DaprClient.awaitSidecarStarted(async () => await HTTPClientSidecar.isStarted(this), this.logger);
  }

  /**
   * Stops the HTTP client and closes connection pools.
   *
   * Destroys the HTTP and HTTPS agents to release pooled connections
   * and clean up resources. Can be called multiple times safely.
   *
   * @returns Promise resolving when agents are destroyed
   *
   * @example
   * ```typescript
   * const client = new HTTPClient({ daprPort: "3500" });
   * await client.start();
   * // ... use client ...
   * await client.stop(); // Closes pooled connections
   * ```
   */
  async stop(): Promise<void> {
    HTTPClient.httpAgent.destroy();
    HTTPClient.httpsAgent.destroy();
  }

  /**
   * Initializes the HTTP client and waits for the sidecar to be ready.
   *
   * Performs health checks on the sidecar and sets the initialization flag
   * once communication is established. Subsequent calls after initialization
   * are safe but redundant.
   *
   * @returns Promise resolving once the sidecar is ready
   *
   * @throws Rejects if sidecar startup fails or timeout is exceeded
   *
   * @example
   * ```typescript
   * const client = new HTTPClient({ daprPort: "3500" });
   * await client.start(); // Wait for sidecar to be ready
   * // Now safe to make API calls
   * ```
   */
  async start(): Promise<void> {
    await this._startAwaitSidecarStarted();
    this.isInitialized = true;

    this.logger.info("Sidecar Started");

    return;
  }

  /**
   * Executes an HTTP request to a specific API version endpoint.
   *
   * Allows overriding the default v1.0 API version for calls to alternate endpoint versions.
   * Internally delegates to execute() with the replaced URL.
   *
   * @param apiVersion - API version identifier (e.g., "v1.0", "v2.0") (default: "v1.0")
   * @param url - Endpoint path relative to the version root (e.g., "/state/mystore")
   * @param params - HTTP request configuration (method, headers, body, etc.)
   * @returns Promise resolving to the parsed JSON response or raw text
   *
   * @throws Rejects if the HTTP request fails or returns an error status
   *
   * @internal
   */
  async executeWithApiVersion(apiVersion = "v1.0", url: string, params: any = {}): Promise<object | string> {
    const newClientUrl = this.clientUrl.replace("v1.0", apiVersion);
    return await this.execute(`${newClientUrl}${url}`, params);
  }

  /**
   * Executes an HTTP request to the Dapr sidecar API.
   *
   * Sends HTTP requests to the Dapr API with automatic header injection (API token, User-Agent),
   * connection pooling, request serialization, and response parsing.
   *
   * **Headers automatically added:**
   * - `dapr-api-token`: Set if API token is configured
   * - `user-agent`: SDK version and HTTP/1.1
   * - `Content-Type`: Inferred from request body if not explicitly provided
   *
   * **Connection Pooling:**
   * Uses HTTP/HTTPS agents with keep-alive to reuse connections,
   * reducing latency and improving throughput for repeated requests.
   *
   * @param url - Target URL (e.g., "http://localhost:3500/v1.0/state/mystore" or "/state/mystore")
   *              If relative, prepended with the configured sidecar URL
   * @param params - HTTP request configuration
   * @param params.method - HTTP method (GET, POST, PUT, DELETE, etc.)
   * @param params.body - Request body (string, object, or Buffer)
   * @param params.headers - Custom HTTP headers to include
   * @param requiresInitialization - If false, skips sidecar readiness check (default: true)
   *
   * @returns Promise resolving to the API response
   *           - If response Content-Type is JSON: parsed JavaScript object
   *           - Otherwise: raw text response
   *
   * @throws Rejects if:
   *   - HTTP status is not in 200-399 range (success/redirect)
   *   - Network error occurs
   *   - URL is malformed
   *   - Body serialization fails
   *
   * @example
   * ```typescript
   * // Save state
   * const response = await client.execute("/state/mystore", {
   *   method: "POST",
   *   body: { key: "mykey", value: "myvalue" }
   * });
   *
   * // Retrieve state
   * const state = await client.execute("/state/mystore/mykey", {
   *   method: "GET"
   * });
   *
   * // Publish to pub/sub
   * await client.execute("/publish/mypubsub/mytopic", {
   *   method: "POST",
   *   body: { message: "hello" }
   * });
   * ```
   *
   * @see {@link https://docs.dapr.io/reference/api/} for Dapr API reference
   *
   * @internal
   */
  async execute(
    url: string,
    params?: THTTPExecuteParams | undefined | null,
    requiresInitialization = true,
  ): Promise<object | string> {
    const clientOptions: RequestInit = {};

    // Set Method
    clientOptions.method = params?.method.toLocaleUpperCase() || (params?.body ? "POST" : "GET");

    // Set Headers
    clientOptions.headers = params?.headers ?? {};

    if (this.options.daprApiToken) {
      clientOptions.headers["dapr-api-token"] = this.options.daprApiToken;
    }

    clientOptions.headers["user-agent"] = `dapr-sdk-js/v${SDK_VERSION} http/1`;

    // Set Body and Content-Type Header
    if (params?.body) {
      // If content-type is already present, use that to serialize the data.
      const headerContentType = params?.headers?.["Content-Type"] ?? undefined;
      const { serializedData, contentType } = SerializerUtil.serializeHttp(params?.body, headerContentType);

      clientOptions.headers["Content-Type"] = contentType;
      clientOptions.body = serializedData;
    }

    const urlFull = url.startsWith("http") ? url : `${this.clientUrl}${url}`;
    const agent = urlFull.startsWith("https") ? HTTPClient.httpsAgent : HTTPClient.httpAgent;
    clientOptions.agent = agent;

    this.logger.debug(
      `Fetching ${clientOptions.method} ${urlFull} with (headers: ${JSON.stringify(
        clientOptions.headers,
      )}, body size: ${(clientOptions.body?.toString()?.length ?? 0) / 1024 / 1024} Mb)`,
    );

    const client = await this.getClient(requiresInitialization);
    const res = await client(urlFull, clientOptions);

    // Parse body
    const txt = await res.text();
    let txtParsed;

    try {
      txtParsed = JSON.parse(txt);
    } catch (e) {
      txtParsed = txt;
    }

    // 2XX -> OK; 3XX -> Redirects and Found
    if (res.status >= 200 && res.status <= 399) {
      return txtParsed;
    } else {
      throw new Error(
        JSON.stringify({
          error: res.statusText,
          error_msg: txt,
          status: res.status,
        }),
      );
    }
  }
}
