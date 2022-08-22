// https://github.com/dapr/dapr/blob/master/pkg/apis/subscriptions/v2alpha1/types.go#L36
import { KeyValueType } from "../KeyValue.type";
import { DaprPubSubSubscriptionRouteType } from "./DaprPubSubSubscriptionRouteType.type";

export type DaprPubSubSubscriptionType = {
    pubsubName: string;
    topic: string;
    metadata?: KeyValueType;
    route?: string;
    routes?: DaprPubSubSubscriptionRouteType[];
    deadLetterTopic?: string;
}

