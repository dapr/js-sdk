// https://github.com/dapr/dapr/blob/master/pkg/apis/subscriptions/v2alpha1/types.go#L51
import { DaprPubSubSubscriptionRuleType } from "./DaprPubSubSubscriptionRuleType.type";

export type DaprPubSubSubscriptionRouteType = {
    rule?: DaprPubSubSubscriptionRuleType[];
    default?: string;
}

