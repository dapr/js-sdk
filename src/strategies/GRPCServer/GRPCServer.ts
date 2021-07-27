import * as grpc from "@grpc/grpc-js";
import http from "http";
import GRPCServerImpl from "./GRPCServerImpl";
import { AppCallbackService } from "../../proto/dapr/proto/runtime/v1/appcallback_grpc_pb";
import IServerStrategy from "../IServerStrategy";

// tslint:disable-next-line
export interface IServerType extends grpc.Server { };
// tslint:disable-next-line
export interface IServerImplType extends GRPCServerImpl { };

export default class GRPCServer implements IServerStrategy {
    isInitialized: boolean;
    serverHost: string;
    serverPort: string;
    server: IServerType;
    serverImpl: IServerImplType;
    serverCredentials: grpc.ServerCredentials;

    constructor() {
        this.isInitialized = false;

        this.serverHost = "";
        this.serverPort = "";

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

    async close(): Promise<void> {
        if (!this.isInitialized) {
            throw new Error(JSON.stringify({
                error: "GRPC_SERVER_NOT_INITIALIZED",
                error_message: "The gRPC server was not initialized, did you call `await GRPCServerSingleton.initialize()`?"
            }));
        }

        return new Promise((resolve, reject) => {
            this.server.tryShutdown((err) => {
                if (err) {
                    return reject(err);
                }

                console.log(`[Dapr-JS][gRPC] Closed Server`);
                this.isInitialized = false;

                return resolve();
            })
        })
    }

    async startServer(host: string, port: string): Promise<void> {
        this.serverHost = host;
        this.serverPort = port;

        await this.initializeBind();
        this.server.start();

        // We need to call the Singleton to start listening on the port, else Dapr will not pick it up correctly
        // Dapr will probe every 50ms to see if we are listening on our port: https://github.com/dapr/dapr/blob/a43712c97ead550ca2f733e9f7e7769ecb195d8b/pkg/runtime/runtime.go#L1694
        console.log("[Dapr-JS][gRPC] Letting Dapr pick-up the server");
        const delayMs = 100;
        await (new Promise((resolve) => setTimeout(resolve, delayMs)));

        // We are initialized
        this.isInitialized = true;
    }

    private async initializeBind(): Promise<void> {
        console.log(`[Dapr-JS][gRPC] Starting to listen on ${this.serverHost}:${this.serverPort}`);
        return new Promise((resolve, reject) => {
            this.server.bindAsync(`${this.serverHost}:${this.serverPort}`, this.serverCredentials, (err, port) => {
                if (err) {
                    return reject(err);
                }

                console.log(`[Dapr-JS][gRPC] Listening on ${this.serverHost}:${this.serverPort}`);
                return resolve();
            });
        })
    }
}