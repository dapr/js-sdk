import { PubSubSubscriptionType } from "./PubSubSubscription.type";

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
 * This defines the entire object containing pubsubNames
 */
export type PubSubSubscriptionsType = {
  // The key of a pubsubName
  [key: string]: PubSubSubscriptionType;
}