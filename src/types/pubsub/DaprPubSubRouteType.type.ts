// https://github.com/dapr/dapr/blob/master/pkg/apis/subscriptions/v2alpha1/types.go#L51
import { DaprPubSubRuleType } from "./DaprPubSubRuleType.type";

export type DaprPubSubRouteType = {
    rules?: DaprPubSubRuleType[];
    default?: string;
}

