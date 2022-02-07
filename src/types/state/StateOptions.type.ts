import { EStateConsistency } from "../../enum/StateConsistency.enum";
import { EStateConcurrency } from "../../enum/StateConcurrency.enum";

export type IStateOptions = {
  concurrency: EStateConcurrency;
  consistency: EStateConsistency;
}