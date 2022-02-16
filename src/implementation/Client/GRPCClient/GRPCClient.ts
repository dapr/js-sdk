import * as grpc from "@grpc/grpc-js";
import { ChannelCredentials } from "@grpc/grpc-js";
import { DaprClient } from "../../../proto/dapr/proto/runtime/v1/dapr_grpc_pb"
import IClient from "../../../interfaces/Client/IClient";
import CommunicationProtocolEnum from "../../../enum/CommunicationProtocol.enum";
import { DaprClientOptions } from "../../../types/DaprClientOptions";
import { Settings } from '../../../utils/Settings.util';

export default class GRPCClient implements IClient {
  private readonly client: DaprClient;
  private readonly clientCredentials: grpc.ChannelCredentials;
  private readonly clientHost: string;
  private readonly clientPort: string;
  private readonly options: DaprClientOptions;

  constructor(
    host = Settings.getDefaultHost()
    , port = Settings.getDefaultGrpcPort()
    , options: DaprClientOptions = {
      isKeepAlive: true
    }
  ) {
    this.clientHost = host ?? Settings.getDefaultHost();
    this.clientPort = port ?? Settings.getDefaultGrpcPort();
    this.clientCredentials = ChannelCredentials.createInsecure();
    this.options = options;

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

  getOptions(): DaprClientOptions {
    return this.options;
  }

  async stop(): Promise<void> {
    this.client.close();
  }
}