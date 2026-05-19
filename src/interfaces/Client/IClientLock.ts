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

import { LockResponse } from "../../types/lock/LockResponse";
import { UnlockResponse } from "../../types/lock/UnlockResponse";

/**
 * Dapr client interface for Distributed Locks.
 * Provides methods to acquire and release distributed locks across multiple services.
 *
 * @see https://docs.dapr.io/developing-applications/building-blocks/locks/
 */
export default interface IClientLock {
  /**
   * Acquires a distributed lock for a resource.
   * The lock is held by the specified owner for the duration specified by expiryInSeconds.
   *
   * @param storeName - The name of the lock store component.
   * @param resourceId - A unique identifier for the resource to lock.
   * Other clients must use the same resourceId to contend for the same lock.
   * @param lockOwner - A unique identifier for the owner acquiring the lock.
   * Used to prevent unauthorized lock release.
   * @param expiryInSeconds - The duration in seconds after which the lock automatically expires
   * if not explicitly released.
   * @returns A promise that resolves to a LockResponse indicating success and lock metadata.
   *
   * @example
   * ```ts
   * const response = await client.lock.lock(
   *   "myLockStore",
   *   "resource-123",
   *   "service-instance-1",
   *   30
   * );
   * ```
   *
   * @see https://docs.dapr.io/reference/api/lock_api/
   */
  lock(storeName: string, resourceId: string, lockOwner: string, expiryInSeconds: number): Promise<LockResponse>;

  /**
   * Releases a previously acquired distributed lock.
   *
   * @param storeName - The name of the lock store component.
   * @param resourceId - The resource identifier for the lock to release.
   * Must match the resourceId used when acquiring the lock.
   * @param lockOwner - The owner identifier used when acquiring the lock.
   * Must match for the unlock to succeed.
   * @returns A promise that resolves to an UnlockResponse indicating success.
   *
   * @example
   * ```ts
   * const response = await client.lock.unlock(
   *   "myLockStore",
   *   "resource-123",
   *   "service-instance-1"
   * );
   * ```
   *
   * @see https://docs.dapr.io/reference/api/lock_api/
   */
  unlock(storeName: string, resourceId: string, lockOwner: string): Promise<UnlockResponse>;
}
