// https://github.com/dapr/dapr/blob/master/pkg/apis/subscriptions/v2alpha1/types.go#L36
import { KeyValueType } from "../KeyValue.type";
import { DaprPubSubRouteType } from "./DaprPubSubRouteType.type";

/**
 * DaprPubSubType is the Type used by the Dapr API to interface with its PubSub component
 */
export type DaprPubSubType = {
  // The pubsub component name
  pubsubname: string;

  // The topic name
  topic: string;

  // Metadata 
  metadata?: KeyValueType;

  // A singular route to send the event to
  route?: string;

  // A rule based route to send the event to
  routes?: DaprPubSubRouteType;

  // The path to send unprocessable events to
  deadLetterTopic?: string;
}

