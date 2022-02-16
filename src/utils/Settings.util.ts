import CommunicationProtocolEnum from "../enum/CommunicationProtocol.enum";

export class Settings {
    private static readonly defaultHost: string = "127.0.0.1";
    private static readonly defaultHttpPort: string = "3500";
    private static readonly defaultGrpcPort: string = "50001";

    static getDefaultHost(): string {
        return Settings.defaultHost;
    }

    static getDefaultHttpPort(): string {
        return process.env.DAPR_HTTP_PORT ?? Settings.defaultHttpPort;
    }

    static getDefaultGrpcPort(): string {
        return process.env.DAPR_GRPC_PORT ?? Settings.defaultGrpcPort;
    }

    static getDefaultPort(communicationProtocolEnum: CommunicationProtocolEnum): string {
        switch (communicationProtocolEnum) {
            case CommunicationProtocolEnum.GRPC:
                return this.getDefaultGrpcPort();
            default:
                return this.getDefaultHttpPort();
        }
    }
}