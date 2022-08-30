import { TypeDaprPubSubCallback } from "../DaprPubSubCallback.type";
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
 * This defines the routeName object
 */
export type PubSubSubscriptionTopicRouteType = {
  // Our event handlers
  eventHandlers: TypeDaprPubSubCallback[];

  // The path on the server (e.g. POST /my-path)
  path: string;
}