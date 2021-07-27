import * as grpc from "@grpc/grpc-js";
import { ChannelCredentials } from "@grpc/grpc-js";
import { DaprClient } from "../../proto/dapr/proto/runtime/v1/dapr_grpc_pb"
import IClientStrategy from "../IClientStrategy";

export default class GRPCClient implements IClientStrategy {
    isInitialized: boolean;
    client: DaprClient;
    clientCredentials: grpc.ChannelCredentials;
    clientHost: string;
    clientPort: string;

    constructor(host: string = "127.0.0.1", port: string = "50050") {
        this.isInitialized = true;
        this.clientHost = host;
        this.clientPort = port;
        this.clientCredentials = ChannelCredentials.createInsecure();

        console.log(`[Dapr-JS][gRPC] Opening connection to ${this.clientHost}:${this.clientPort}`);
        this.client = new DaprClient(`${this.clientHost}:${this.clientPort}`, this.clientCredentials);
    }

    getClient(): DaprClient {
        return this.client;
    }
}