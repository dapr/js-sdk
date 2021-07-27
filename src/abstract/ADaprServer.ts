import IServerBindingStrategy from "../strategies/IServerBindingStrategy";
import IServerInvokerStrategy from "../strategies/IServerInvokerStrategy";
import IServerPubSubStrategy from "../strategies/IServerPubSubStrategy";
import IServerStrategy from "../strategies/IServerStrategy";

export default abstract class ADaprServer {
  daprHost: string;
  daprPort: string;
  daprPortApp: string; // The port for our app server (e.g. dapr binding receives, pubsub receive, ...)

  // These should be set by the implementation
  abstract daprServer: IServerStrategy;
  abstract pubsub: IServerPubSubStrategy;
  abstract binding: IServerBindingStrategy;
  abstract invoker: IServerInvokerStrategy;

  constructor(daprHost: string, daprPort: string, daprPortApp?: string) {
    this.daprHost = daprHost || '127.0.0.1';
    this.daprPort = daprPort || "5005";
    this.daprPortApp = process.env.DAPR_INTERNAL_SERVER_PORT || daprPortApp || "";
  }

  abstract startServer(): Promise<void>;
}