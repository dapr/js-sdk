// https://github.com/dapr/dapr/blob/master/pkg/apis/subscriptions/v2alpha1/types.go#L62

/**
 * DaprPubSubRuleType defines a rule set
 */
export type DaprPubSubRuleType = {
  // Match rule (e.g. event.type == "hello")
  match: string;

  // The path to send the event towards if it matches
  path: string;
}

