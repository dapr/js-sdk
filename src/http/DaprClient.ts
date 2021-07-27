import HTTPClientBindingStrategy from '../strategies/HTTPClient/binding';
import HTTPClientPubSubStrategy from '../strategies/HTTPClient/pubsub';
import HTTPClientStateStrategy from '../strategies/HTTPClient/state';
import HTTPClientInvokerStrategy from '../strategies/HTTPClient/invoker';
import HTTPClientSecretStrategy from '../strategies/HTTPClient/secret';
import HTTPClientActorStrategy from '../strategies/HTTPClient/actor';

import IClientBindingStrategy from '../strategies/IClientBindingStrategy';
import IClientPubSubStrategy from '../strategies/IClientPubSubStrategy';
import IClientStateStrategy from '../strategies/IClientStateStrategy';
import IClientInvokerStrategy from '../strategies/IClientInvokerStrategy';
import IClientSecretStrategy from '../strategies/IClientSecretStrategy';
import IClientActorStrategy from '../strategies/IClientActorStrategy';

import HTTPClientStrategy from '../strategies/HTTPClient/HTTPClient';

import ADaprClient from '../abstract/ADaprClient';

export default class DaprClient extends ADaprClient {
  daprClient: HTTPClientStrategy;

  pubsub: IClientPubSubStrategy;
  state: IClientStateStrategy;
  binding: IClientBindingStrategy;
  invoker: IClientInvokerStrategy;
  secret: IClientSecretStrategy;
  actor: IClientActorStrategy;

  constructor(daprHost: string, daprPort: string) {
    super(daprHost, daprPort);

    this.daprClient = new HTTPClientStrategy(daprHost, daprPort);

    this.state = new HTTPClientStateStrategy(this.daprClient);
    this.pubsub = new HTTPClientPubSubStrategy(this.daprClient);
    this.binding = new HTTPClientBindingStrategy(this.daprClient);
    this.invoker = new HTTPClientInvokerStrategy(this.daprClient);
    this.secret = new HTTPClientSecretStrategy(this.daprClient);
    this.actor = new HTTPClientActorStrategy(this.daprClient);
  }
}