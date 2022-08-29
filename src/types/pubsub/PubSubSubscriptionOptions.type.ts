import { KeyValueType } from "../KeyValue.type";
import { DaprPubSubRouteType } from "./DaprPubSubRouteType.type";

export type PubSubSubscriptionOptionsType = {
    metadata?: KeyValueType;
    deadLetterTopic?: string;

    route?: string | DaprPubSubRouteType;

    // https://github.com/dapr/dapr/blob/master/pkg/runtime/pubsub/subscriptions.go#L47
    // route?: string; // Single route from v1alpha1
    // routes?: DaprPubSubRouteType[]; // Multiple routes from v2alpha1
}

