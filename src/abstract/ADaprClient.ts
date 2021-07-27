import IClientStrategy from "../strategies/IClientStrategy";
import IClientPubSubStrategy from "../strategies/IClientPubSubStrategy";
import IClientStateStrategy from "../strategies/IClientStateStrategy";
import IClientBindingStrategy from "../strategies/IClientBindingStrategy";
import IClientInvokerStrategy from "../strategies/IClientInvokerStrategy";
import IClientSecretStrategy from "../strategies/IClientSecretStrategy";
import IClientActorStrategy from "../strategies/IClientActorStrategy";

export default abstract class ADaprClient {
  daprHost: string;
  daprPort: string;

  abstract daprClient: IClientStrategy;

  abstract pubsub: IClientPubSubStrategy;
  abstract state: IClientStateStrategy;
  abstract binding: IClientBindingStrategy;
  abstract invoker: IClientInvokerStrategy;
  abstract secret: IClientSecretStrategy;
  abstract actor: IClientActorStrategy;

  constructor(daprHost: string, daprPort: string) {
    this.daprHost = daprHost || '127.0.0.1';
    this.daprPort = daprPort || "5005";
  }
}