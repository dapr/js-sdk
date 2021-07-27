export default interface IServerStrategy {
    getServerAddress(): string;
    getServer(): any; // this is dependent on the implementation
    getServerImpl(): any; // this is dependent on the implementation
    close(): Promise<void>;
    startServer(host: string, port: string): Promise<void>;
}