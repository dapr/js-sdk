import GRPCClientBinding from './GRPCClient/binding';
import GRPCClientPubSub from './GRPCClient/pubsub';
import GRPCClientState from './GRPCClient/state';
import GRPCClientInvoker from './GRPCClient/invoker';
import GRPCClientSecret from './GRPCClient/secret';
import GRPCClientActor from './GRPCClient/actor';

import GRPCClient from './GRPCClient/GRPCClient';


export default class DaprClient {
  daprClient: GRPCClient;
  pubsub: GRPCClientPubSub;
  state: GRPCClientState;
  binding: GRPCClientBinding;
  invoker: GRPCClientInvoker;
  secret: GRPCClientSecret;
  actor: GRPCClientActor;

  constructor(daprHost: string, daprPort: string) {
    this.daprClient = new GRPCClient(daprHost, daprPort);

    this.state = new GRPCClientState(this.daprClient);
    this.pubsub = new GRPCClientPubSub(this.daprClient);
    this.binding = new GRPCClientBinding(this.daprClient);
    this.invoker = new GRPCClientInvoker(this.daprClient);
    this.secret = new GRPCClientSecret(this.daprClient);
    this.actor = new GRPCClientActor(this.daprClient);
  }
}