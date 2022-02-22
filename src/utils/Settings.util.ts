import CommunicationProtocolEnum from "../enum/CommunicationProtocol.enum";

export class Settings {
    private static readonly defaultHost: string = "127.0.0.1";
    private static readonly defaultHttpAppPort: string = "3000";
    private static readonly defaultHttpPort: string = "3500";
    private static readonly defaultGrpcAppPort: string = "50000";
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

    /**
     * Gets the default port that the Dapr sidecar is listening to.
     * @param communicationProtocolEnum communication protocol
     * @returns port number
     */
    static getDefaultPort(communicationProtocolEnum: CommunicationProtocolEnum): string {
        switch (communicationProtocolEnum) {
            case CommunicationProtocolEnum.GRPC:
                return this.getDefaultGrpcPort();
            default:
                return this.getDefaultHttpPort();
        }
    }

    static getDefaultHttpAppPort(): string {
        return process.env.APP_PORT ?? Settings.defaultHttpAppPort;
    }

    static getDefaultGrpcAppPort(): string {
        return process.env.APP_PORT ?? Settings.defaultGrpcAppPort;
    }

    /**
     * Gets the default port that the application is listening on.
     * @param communicationProtocolEnum communication protocol
     * @returns port number
     */
    static getDefaultAppPort(communicationProtocolEnum: CommunicationProtocolEnum): string {
        switch (communicationProtocolEnum) {
            case CommunicationProtocolEnum.GRPC:
                return this.getDefaultGrpcAppPort();        
            default:
                return this.getDefaultHttpAppPort();
        }
    }
}