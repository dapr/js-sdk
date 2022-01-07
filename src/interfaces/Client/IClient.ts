import CommunicationProtocolEnum from "../../enum/CommunicationProtocol.enum";
import { DaprClientOptions } from "../../types/DaprClientOptions";

export default interface IClient {
  getClient(): any; // dependent on implementation
  getClientHost(): string;
  getClientPort(): string;
  getClientCommunicationProtocol(): CommunicationProtocolEnum;
  getOptions(): DaprClientOptions;
  stop(): Promise<void>;
}