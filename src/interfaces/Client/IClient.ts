import CommunicationProtocolEnum from "../../enum/CommunicationProtocol.enum";

export default interface IClient {
    getClient(): any; // dependent on implementation
    getClientHost(): string;
    getClientPort(): string;
    getClientCommunicationProtocol(): CommunicationProtocolEnum;
}