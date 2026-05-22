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

/**
 * Base Dapr server interface for managing server lifecycle.
 * Handles server initialization and provides access to the underlying server implementation.
 *
 * @see https://docs.dapr.io/developing-applications/building-blocks/service-invocation/
 */
export default interface IServer {
  /**
   * Retrieves the server's address including host and port.
   *
   * @returns The server address as a string (e.g., "localhost:3000").
   */
  getServerAddress(): string;

  /**
   * Retrieves the underlying server instance.
   * The type depends on the implementation (Express app, gRPC server, etc.).
   *
   * @returns The internal server implementation instance.
   */
  getServer(): any; // this is dependent on the implementation

  /**
   * Retrieves the underlying server implementation object.
   * Similar to getServer() but may provide additional implementation-specific details.
   *
   * @returns The internal server implementation instance.
   */
  getServerImpl(): any; // this is dependent on the implementation

  /**
   * Starts the server and begins listening for incoming requests.
   *
   * @param host - The host address to bind to (e.g., "localhost", "0.0.0.0").
   * @param port - The port number to listen on (e.g., "3000", "50001" for gRPC).
   * @returns A promise that resolves when the server has started successfully.
   *
   * @see https://docs.dapr.io/concepts/dapr-services/sidecar/
   */
  start(host: string, port: string): Promise<void>;

  /**
   * Stops the server and closes all connections.
   * Allows the server to gracefully shut down before terminating.
   *
   * @returns A promise that resolves when the server has stopped.
   *
   * @see https://docs.dapr.io/concepts/dapr-services/sidecar/
   */
  stop(): Promise<void>;
}
