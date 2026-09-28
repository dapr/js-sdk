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

import IServer from "../../interfaces/Server/IServer";
import IServerPubSub from "../../interfaces/Server/IServerPubSub";
import IServerBinding from "../../interfaces/Server/IServerBinding";
import IServerInvoker from "../../interfaces/Server/IServerInvoker";
import IServerActor from "../../interfaces/Server/IServerActor";

import CommunicationProtocolEnum from "../../enum/CommunicationProtocol.enum";
import GRPCServer from "./GRPCServer/GRPCServer";
import GRPCServerPubSub from "./GRPCServer/pubsub";
import GRPCServerBinding from "./GRPCServer/binding";
import GRPCServerInvoker from "./GRPCServer/invoker";
import GRPCServerActor from "./GRPCServer/actor";

import HTTPServer from "./HTTPServer/HTTPServer";
import HTTPServerPubSub from "./HTTPServer/pubsub";
import HTTPServerBinding from "./HTTPServer/binding";
import HTTPServerInvoker from "./HTTPServer/invoker";
import HTTPServerActor from "./HTTPServer/actor";
import { Settings } from "../../utils/Settings.util";
import { DaprServerOptions } from "../../types/DaprServerOptions";
import DaprClient from "../Client/DaprClient";
import { getClientOptions } from "../../utils/Client.util";

/**
 * Dapr server for receiving messages and requests from the Dapr sidecar.
 *
 * DaprServer hosts an HTTP or gRPC server that receives pub/sub messages, input bindings,
 * service invocation requests, and actor method calls from the Dapr sidecar. It automatically
 * selects the appropriate protocol based on configuration and manages both the server
 * (for receiving) and an embedded client (for sending to sidecar).
 *
 * @see {@link https://dapr.io/docs/developing-applications/building-blocks/ | Dapr Building Blocks}
 *
 * @example
 * ```typescript
 * import { DaprServer, HttpMethod } from "@dapr/dapr";
 *
 * const server = new DaprServer();
 *
 * // Handle Pub/Sub messages
 * await server.pubsub.subscribe("pubsub-name", "topic-name", async (data: any) => {
 *   console.log("Received message:", data);
 * });
 *
 * // Handle input bindings
 * await server.binding.subscribe("kafka-binding", async (data: any) => {
 *   console.log("Received binding data:", data);
 * });
 *
 * // Register service invocation handler
 * server.invoker.handle("MyMethod", async (data: any) => {
 *   return { result: "success", data };
 * });
 *
 * // Start server (listens on localhost:3001 by default)
 * await server.start();
 *
 * // Graceful shutdown
 * await server.stop();
 * ```
 */
export default class DaprServer {
  /**
   * Server configuration (host, port, protocol, etc.).
   *
   * @internal
   */
  private readonly serverOptions: DaprServerOptions;

  /**
   * Underlying protocol-specific server (HTTP or gRPC).
   * Typically accessed indirectly through the building block properties.
   *
   * @internal
   */
  readonly daprServer: IServer;

  /**
   * Pub/Sub topic subscription handler.
   * Register handlers for receiving pub/sub messages from topics.
   *
   * @see {@link https://dapr.io/docs/developing-applications/building-blocks/pubsub/ | Dapr Pub/Sub}
   */
  readonly pubsub: IServerPubSub;

  /**
   * Input bindings handler.
   * Register handlers for receiving events from input bindings.
   *
   * @see {@link https://dapr.io/docs/developing-applications/building-blocks/bindings/ | Dapr Bindings}
   */
  readonly binding: IServerBinding;

  /**
   * Service invocation handler.
   * Register handlers for methods that other services can call.
   *
   * @see {@link https://dapr.io/docs/developing-applications/building-blocks/service-invocation/ | Dapr Service Invocation}
   */
  readonly invoker: IServerInvoker;

  /**
   * Actor method handler.
   * Register handlers for actor state and methods.
   *
   * @see {@link https://dapr.io/docs/developing-applications/building-blocks/actors/ | Dapr Actors}
   */
  readonly actor: IServerActor;

  /**
   * Dapr client for making calls to the sidecar.
   * Embedded within the server for accessing state, pub/sub, invocation, etc.
   *
   * @see {@link DaprClient}
   */
  readonly client: DaprClient;

  /**
   * Creates a new Dapr server instance.
   *
   * Initializes the appropriate protocol-specific server (HTTP or gRPC) and embeds
   * a DaprClient for sidecar communication. The server will listen on the specified
   * host/port and automatically wire up all building block handlers.
   *
   * @param serverOptions - Optional server configuration
   * @param serverOptions.serverHost - Server listen address (default: localhost, env: DAPR_HOST)
   * @param serverOptions.serverPort - Server listen port (default: 3001 for HTTP, 50000 for gRPC, env: DAPR_SERVER_PORT)
   * @param serverOptions.communicationProtocol - HTTP or gRPC (default: HTTP, env: DAPR_PROTOCOL)
   * @param serverOptions.maxBodySizeMb - Maximum request body size (default: 4)
   * @param serverOptions.serverHttp - Additional Express/HTTP server options
   * @param serverOptions.clientOptions - Options for embedded client (host, port, etc.)
   * @param serverOptions.logger - Custom logger instance
   *
   * @throws {Error} When serverPort or client daprPort is invalid
   *
   * @example
   * ```typescript
   * // Use defaults (HTTP, listen on localhost:3001, connect to localhost:3500)
   * const server = new DaprServer();
   *
   * // Use gRPC with custom port
   * const server = new DaprServer({
   *   communicationProtocol: CommunicationProtocolEnum.GRPC,
   *   serverPort: "50000",
   *   clientOptions: {
   *     daprPort: "50001"
   *   }
   * });
   * ```
   */
  constructor(serverOptions: Partial<DaprServerOptions> = {}) {
    const communicationProtocol = serverOptions.communicationProtocol ?? Settings.getDefaultCommunicationProtocol();
    const clientOptions = getClientOptions(serverOptions.clientOptions, communicationProtocol, serverOptions?.logger);

    // Legacy validation on port
    // URI validation is done later, when we instantiate the HttpEndpoint or GrpcEndpoint
    // object in the HttpClient or GrpcClient constructor, but we need to
    // keep this additional check for backward compatibility
    // TODO: Remove this validation in the next major version
    if (clientOptions?.daprPort && !/^[0-9]+$/.test(clientOptions?.daprPort)) {
      throw new Error("DAPR_INCORRECT_SIDECAR_PORT");
    }

    this.client = new DaprClient(clientOptions);

    this.serverOptions = {
      serverHost: serverOptions.serverHost ?? Settings.getDefaultHost(),
      serverPort: serverOptions.serverPort ?? Settings.getDefaultAppPort(communicationProtocol),
      communicationProtocol: communicationProtocol,
      maxBodySizeMb: serverOptions.maxBodySizeMb,
      serverHttp: serverOptions.serverHttp,
      clientOptions: this.client.options,
      logger: serverOptions.logger,
    };
    // Create a client to interface with the sidecar from the server side

    // If DAPR_SERVER_PORT was not set, we set it
    process.env.DAPR_SERVER_PORT = this.serverOptions.serverPort;
    process.env.DAPR_CLIENT_PORT = this.client.options.daprPort;

    // Validation on port
    if (!/^[0-9]+$/.test(this.serverOptions.serverPort)) {
      throw new Error("DAPR_INCORRECT_SERVER_PORT");
    }

    // Builder
    switch (serverOptions.communicationProtocol) {
      case CommunicationProtocolEnum.GRPC: {
        const server = new GRPCServer(this.client, this.serverOptions);
        this.daprServer = server;

        this.pubsub = new GRPCServerPubSub(server);
        this.binding = new GRPCServerBinding(server);
        this.invoker = new GRPCServerInvoker(server);
        this.actor = new GRPCServerActor(server);
        break;
      }
      case CommunicationProtocolEnum.HTTP:
      default: {
        const server = new HTTPServer(this.client, this.serverOptions);
        this.daprServer = server;

        this.pubsub = new HTTPServerPubSub(server);
        this.binding = new HTTPServerBinding(server);
        this.invoker = new HTTPServerInvoker(server);
        this.actor = new HTTPServerActor(server, this.client);
        break;
      }
    }
  }

  /**
   * Starts the Dapr server and client.
   *
   * Initializes and starts the HTTP or gRPC server on the configured host/port,
   * then starts the embedded client to connect to the Dapr sidecar. Must be called
   * before the server can receive messages from the sidecar or send API calls to it.
   *
   * @returns Promise that resolves when both server and client are started
   *
   * @throws {Error} If server or client startup fails
   *
   * @example
   * ```typescript
   * const server = new DaprServer();
   * await server.start();
   * console.log("Server listening...");
   * ```
   */
  async start(): Promise<void> {
    // First start the server as we need to initialize routes for PubSub, Bindings, ...
    await this.daprServer.start(this.serverOptions.serverHost, this.serverOptions.serverPort.toString());

    // Ensure our sidecar starts and the client is ready
    await this.client.start();
  }

  /**
   * Stops the Dapr server.
   *
   * Gracefully shuts down the HTTP or gRPC server, stopping it from receiving
   * messages from the sidecar. The embedded client remains available for use
   * if needed after server shutdown.
   *
   * @returns Promise that resolves when the server is stopped
   *
   * @example
   * ```typescript
   * const server = new DaprServer();
   * await server.start();
   * // ... handle requests ...
   * await server.stop();
   * ```
   */
  async stop(): Promise<void> {
    await this.daprServer.stop();
  }

  /**
   * Returns the underlying protocol-specific server instance.
   *
   * Provides access to low-level server details. Most applications should use
   * the building block properties (pubsub, binding, invoker, actor) instead.
   *
   * @returns The IServer implementation (HTTP or gRPC)
   *
   * @internal
   */
  getDaprClient(): IServer {
    return this.daprServer;
  }
}
