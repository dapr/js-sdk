import { DaprPubSubType } from "./DaprPubSub.type";
import { PubSubSubscriptionTopicRoutesType } from "./PubSubSubscriptionTopicRoutes.type";

export type PubSubSubscriptionTopicType = {
  routes: PubSubSubscriptionTopicRoutesType

  // dapr is configured on topic level
  dapr: DaprPubSubType;
}