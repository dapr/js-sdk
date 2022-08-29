import { TypeDaprPubSubCallback } from "../DaprPubSubCallback.type";

export type PubSubSubscriptionTopicRouteType = {
  eventHandlers: TypeDaprPubSubCallback[];
  path: string; // the path on the server (e.g. POST /my-path)
}