import * as grpc from "@grpc/grpc-js";
import { ChannelCredentials } from "@grpc/grpc-js";
import { DaprClient } from "../../../proto/dapr/proto/runtime/v1/dapr_grpc_pb"
import IClient from "../../../interfaces/Client/IClient";
import CommunicationProtocolEnum from "../../../enum/CommunicationProtocol.enum";

export default class GRPCClient implements IClient {
    private isInitialized: boolean;
    private readonly client: DaprClient;
    private readonly clientCredentials: grpc.ChannelCredentials;
    private readonly clientHost: string;
    private readonly clientPort: string;

    constructor(host: string = "127.0.0.1", port: string = "50050") {
        this.isInitialized = true;
        this.clientHost = host;
        this.clientPort = port;
        this.clientCredentials = ChannelCredentials.createInsecure();

        console.log(`[Dapr-JS][gRPC] Opening connection to ${this.clientHost}:${this.clientPort}`);
        this.client = new DaprClient(`${this.clientHost}:${this.clientPort}`, this.clientCredentials);
    }

    getClientHost(): string {
        return this.clientHost;
    }

    getClientPort(): string {
        return this.clientPort;
    }

    getClient(): DaprClient {
        return this.client;
    }

    getClientCommunicationProtocol(): CommunicationProtocolEnum {
        return CommunicationProtocolEnum.GRPC;
    }
}