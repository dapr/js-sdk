import { TypeDaprPubSubCallback } from "../../types/DaprPubSubCallback.type";
import IServerPubSubStrategy from "../IServerPubSubStrategy";
import GRPCServer from "./GRPCServer";

// https://docs.dapr.io/reference/api/pubsub_api/
export default class DaprPubSub implements IServerPubSubStrategy {
  server: GRPCServer;

  constructor(server: GRPCServer) {
      this.server = server;
  }
  
  async subscribe(pubSubName: string, topic: string, cb: TypeDaprPubSubCallback): Promise<void> {
    console.log(`Registering onTopicEvent Handler: PubSub = ${pubSubName}; Topic = ${topic}`);
    this.server.getServerImpl().registerPubSubSubscriptionHandler(pubSubName, topic, cb);
  }
}
