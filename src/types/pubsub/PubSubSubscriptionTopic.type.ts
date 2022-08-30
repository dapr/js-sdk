import { DaprPubSubType } from "./DaprPubSub.type";
import { PubSubSubscriptionTopicRoutesType } from "./PubSubSubscriptionTopicRoutes.type";
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
 * This defines the topicName object
 */
export type PubSubSubscriptionTopicType = {
  // The routes defined in a topic
  routes: PubSubSubscriptionTopicRoutesType

  // dapr is configured on topic level
  dapr: DaprPubSubType;
}