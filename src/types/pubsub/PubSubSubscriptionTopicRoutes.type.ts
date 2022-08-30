import { PubSubSubscriptionTopicRouteType } from "./PubSubSubscriptionTopicRoute.type";
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
 * This defines the routes object
 */
export type PubSubSubscriptionTopicRoutesType = {
  // The key of the route
  [key: string]: PubSubSubscriptionTopicRouteType
}