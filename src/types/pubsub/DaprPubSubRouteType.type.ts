// https://github.com/dapr/dapr/blob/master/pkg/apis/subscriptions/v2alpha1/types.go#L51
import { DaprPubSubRuleType } from "./DaprPubSubRuleType.type";

/**
 * DaprPubSubRouteType Defines the rules for a route
 */
export type DaprPubSubRouteType = {
  // The rule
  rules?: DaprPubSubRuleType[];

  // The default path to use if no rule was matched
  default?: string;
}

