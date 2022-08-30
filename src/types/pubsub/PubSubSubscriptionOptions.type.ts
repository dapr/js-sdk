import { TypeDaprPubSubCallback } from "../DaprPubSubCallback.type";
import { KeyValueType } from "../KeyValue.type";
import { DaprPubSubRouteType } from "./DaprPubSubRouteType.type";

/**
 * PubSubSubscriptionOptionsType defines the options we can pass while subscribing
 */
export type PubSubSubscriptionOptionsType = {
  // Metadata
  metadata?: KeyValueType;

  // The deadletter topic path
  deadLetterTopic?: string;

  // The deadletter callback to call
  deadLetterCallback?: TypeDaprPubSubCallback;

  // The default callback
  callback?: TypeDaprPubSubCallback;

  // The route creation for a single route or DaprPubSubRouteType
  route?: string | DaprPubSubRouteType;
}

