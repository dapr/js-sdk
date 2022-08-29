import { PubSubSubscriptionTopicType } from "./PubSubSubscriptionTopic.type";

export type PubSubSubscriptionType = {
  [key: string]: PubSubSubscriptionTopicType;
}