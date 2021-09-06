import { Temporal } from "@js-temporal/polyfill";

export type ActorTimerType = {
  period: Temporal.Duration; // e.g. 0h0m9s0ms
  dueTime?: Temporal.Duration; // e.g. 1m or 0h0m0s0ms defaults to 0s
  data?: any; // the data to pass
  callback: string; // which method to execute as callback method
}