// https://github.com/dapr/dapr/blob/master/pkg/apis/subscriptions/v2alpha1/types.go#L36
import { KeyValueType } from "../KeyValue.type";
import { DaprPubSubRouteType } from "./DaprPubSubRouteType.type";

export type DaprPubSubType = {
    pubsubname: string;
    topic: string;
    metadata?: KeyValueType;
    route?: string;
    routes?: DaprPubSubRouteType;
    deadLetterTopic?: string;
}

