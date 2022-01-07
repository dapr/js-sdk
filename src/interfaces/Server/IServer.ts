export default interface IServer {
  getServerAddress(): string;
  getServer(): any; // this is dependent on the implementation
  getServerImpl(): any; // this is dependent on the implementation
  start(host: string, port: string): Promise<void>;
  stop(): Promise<void>;
}