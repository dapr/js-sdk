import { KeyValueType } from "../KeyValue.type";
import { DaprPubSubSubscriptionRouteType } from "./DaprPubSubSubscriptionRouteType.type";

export type PubSubSubscriptionOptionsType = {
    metadata?: KeyValueType;
    deadLetterTopic?: string;

    // https://github.com/dapr/dapr/blob/master/pkg/runtime/pubsub/subscriptions.go#L47
    route?: string; // Single route from v1alpha1
    routes?: DaprPubSubSubscriptionRouteType[]; // Multiple routes from v2alpha1
}

