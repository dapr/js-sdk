import * as grpc from "@grpc/grpc-js";
import GRPCServerImpl from "./GRPCServerImpl";
import { AppCallbackService } from "../../../proto/dapr/proto/runtime/v1/appcallback_grpc_pb";
import IServer from "../../../interfaces/Server/IServer";
import { DaprClient } from "../../..";
import * as NodeJSUtils from "../../../utils/NodeJS.util";

// eslint-disable-next-line
export interface IServerType extends grpc.Server { }
// eslint-disable-next-line
export interface IServerImplType extends GRPCServerImpl { }

export default class GRPCServer implements IServer {
  isInitialized: boolean;
  serverHost: string;
  serverPort: string;
  server: IServerType;
  serverImpl: IServerImplType;
  serverCredentials: grpc.ServerCredentials;
  daprSidecarPollingDelayMs = 1000;
  client: DaprClient;

  constructor(client: DaprClient) {
    this.isInitialized = false;

    this.serverHost = "";
    this.serverPort = "";
    this.client = client;

    // Create Server
    this.server = new grpc.Server();
    this.serverCredentials = grpc.ServerCredentials.createInsecure();
    this.serverImpl = new GRPCServerImpl();

    // Add our implementation
    console.log("[Dapr-JS][gRPC] Adding Service Implementation - AppCallbackService")
    // @ts-ignore
    this.server.addService(AppCallbackService, this.serverImpl);
  }

  getServerAddress(): string {
    if (!this.isInitialized) {
      throw new Error(JSON.stringify({
        error: "GRPC_SERVER_NOT_INITIALIZED",
        error_message: "The gRPC server was not initialized, did you call `await GRPCServerSingleton.initialize()`?"
      }));
    }

    return `${this.serverHost}:${this.serverPort}`;
  }

  getServer(): IServerType {
    if (!this.isInitialized) {
      throw new Error(JSON.stringify({
        error: "GRPC_SERVER_NOT_INITIALIZED",
        error_message: "The gRPC server was not initialized, did you call `await GRPCServerSingleton.initialize()`?"
      }));
    }

    return this.server as IServerType;
  }

  // We allow this, since this will register the routes and handlers!
  getServerImpl(): IServerImplType {
    return this.serverImpl;
  }

  async start(host: string, port: string): Promise<void> {
    this.serverHost = host;
    this.serverPort = port;

    await this.initializeBind();
    this.server.start();

    // We need to call the Singleton to start listening on the port, else Dapr will not pick it up correctly
    // Dapr will probe every 50ms to see if we are listening on our port: https://github.com/dapr/dapr/blob/a43712c97ead550ca2f733e9f7e7769ecb195d8b/pkg/runtime/runtime.go#L1694
    // if we are using actors we will change this to 4s to let the placement tables update
    let isHealthy = false;
    let isHealthyRetryCount = 0;
    const isHealthyMaxRetryCount = 60; // 1s startup delay and we try max for 60s

    console.log(`[Dapr-JS] Letting Dapr pick-up the server (Maximum 60s wait time)`);
    while (!isHealthy) {
      console.log(`[Dapr-JS] - Waiting till Dapr Started (#${isHealthyRetryCount})`);
      await NodeJSUtils.sleep(this.daprSidecarPollingDelayMs);
      isHealthy = await this.client.health.isHealthy();
      isHealthyRetryCount++;

      if (isHealthyRetryCount > isHealthyMaxRetryCount) {
        throw new Error("DAPR_SIDECAR_COULD_NOT_BE_STARTED");
      }
    }

    // We are initialized
    this.isInitialized = true;
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {

      this.server.tryShutdown((err) => {
        if (err) {
          return reject(err);
        }

        this.isInitialized = false;
        return resolve();
      });
    });
  }

  private async initializeBind(): Promise<void> {
    console.log(`[Dapr-JS][gRPC] Starting to listen on ${this.serverHost}:${this.serverPort}`);
    return new Promise((resolve, reject) => {
      this.server.bindAsync(`${this.serverHost}:${this.serverPort}`, this.serverCredentials, (err, _port) => {
        if (err) {
          return reject(err);
        }

        console.log(`[Dapr-JS][gRPC] Listening on ${this.serverHost}:${this.serverPort}`);
        return resolve();
      });
    })
  }
}