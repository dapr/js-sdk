import { PubSubSubscriptionTopicType } from "./PubSubSubscriptionTopic.type";

/**
 * Internally we create an hierarchy of:
 * {
 *   pubsubName: {
 *     topicName: {
 *       routes: {
 *         routeName: {
 *           eventHandlers: [],
 *           path: ""
 *         }
 *       },
 *       dapr: {}
 *     }
 *   }
 * }
 * 
 * This defines the pubsubName object
 */
export type PubSubSubscriptionType = {
  // Key of the topic
  [key: string]: PubSubSubscriptionTopicType;
}