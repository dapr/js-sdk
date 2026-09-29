/*
Copyright 2022 The Dapr Authors
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { StateConsistencyEnum } from "../../enum/StateConsistency.enum";
import { StateConcurrencyEnum } from "../../enum/StateConcurrency.enum";

/**
 * Configuration options for state operations controlling consistency and concurrency semantics.
 *
 * Determines how the Dapr state store handles concurrent updates and consistency guarantees:
 * - Consistency: Whether to read the most recent value or accept eventual consistency
 * - Concurrency: Whether to require ETags for updates (first-write-wins) or allow last-write-wins
 *
 * @see {@link https://dapr.io/docs/developing-applications/building-blocks/state-management/state-management-overview/#state-consistency | Dapr State Consistency}
 * @see {@link https://dapr.io/docs/developing-applications/building-blocks/state-management/state-management-overview/#concurrency | Dapr Concurrency}
 *
 * @example
 * ```typescript
 * // Strong consistency with first-write-wins (ETag required)
 * const options: IStateOptions = {
 *   consistency: StateConsistencyEnum.Strong,
 *   concurrency: StateConcurrencyEnum.FirstWrite
 * };
 *
 * // Eventual consistency with last-write-wins (no ETag needed)
 * const options: IStateOptions = {
 *   consistency: StateConsistencyEnum.Eventual,
 *   concurrency: StateConcurrencyEnum.LastWrite
 * };
 * ```
 */
export type IStateOptions = {
  /**
   * Concurrency control strategy for state updates.
   * - FirstWrite: Requires ETag match; prevents concurrent modifications (pessimistic locking)
   * - LastWrite: No ETag check; last write always wins (optimistic, potential lost updates)
   *
   * @see {@link https://dapr.io/docs/developing-applications/building-blocks/state-management/state-management-overview/#concurrency | Concurrency Semantics}
   */
  concurrency: StateConcurrencyEnum;

  /**
   * Consistency model for state reads.
   * - Strong: Always read the most up-to-date value (higher latency/cost)
   * - Eventual: May read stale values but lower latency (suitable for non-critical reads)
   *
   * @see {@link https://dapr.io/docs/developing-applications/building-blocks/state-management/state-management-overview/#state-consistency | Consistency Semantics}
   */
  consistency: StateConsistencyEnum;
};
