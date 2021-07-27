import GRPCClientBindingStrategy from '../strategies/GRPCClient/binding';
import GRPCClientPubSubStrategy from '../strategies/GRPCClient/pubsub';
import GRPCClientStateStrategy from '../strategies/GRPCClient/state';
import GRPCClientInvokerStrategy from '../strategies/GRPCClient/invoker';
import GRPCClientSecretStrategy from '../strategies/GRPCClient/secret';
import GRPCClientActorStrategy from '../strategies/GRPCClient/actor';

import IClientBindingStrategy from '../strategies/IClientBindingStrategy';
import IClientPubSubStrategy from '../strategies/IClientPubSubStrategy';
import IClientStateStrategy from '../strategies/IClientStateStrategy';
import IClientInvokerStrategy from '../strategies/IClientInvokerStrategy';
import IClientSecretStrategy from '../strategies/IClientSecretStrategy';
import IClientActorStrategy from '../strategies/IClientActorStrategy';

import GRPCClientStrategy from '../strategies/GRPCClient/GRPCClient';

import ADaprClient from '../abstract/ADaprClient';

export default class DaprClient extends ADaprClient {
  daprClient: GRPCClientStrategy;

  pubsub: IClientPubSubStrategy;
  state: IClientStateStrategy;
  binding: IClientBindingStrategy;
  invoker: IClientInvokerStrategy;
  secret: IClientSecretStrategy;
  actor: IClientActorStrategy;

  constructor(daprHost: string, daprPort: string) {
    super(daprHost, daprPort);

    this.daprClient = new GRPCClientStrategy(daprHost, daprPort);

    this.state = new GRPCClientStateStrategy(this.daprClient);
    this.pubsub = new GRPCClientPubSubStrategy(this.daprClient);
    this.binding = new GRPCClientBindingStrategy(this.daprClient);
    this.invoker = new GRPCClientInvokerStrategy(this.daprClient);
    this.secret = new GRPCClientSecretStrategy(this.daprClient);
    this.actor = new GRPCClientActorStrategy(this.daprClient);
  }
}