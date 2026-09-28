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

import { create } from "@bufbuild/protobuf";
import GRPCClient from "./GRPCClient";
import { LockResponse as LockResponseResult } from "../../../types/lock/LockResponse";
import { UnlockResponse as UnLockResponseResult, LockStatus } from "../../../types/lock/UnlockResponse";
import {
  TryLockRequestSchema,
  UnlockRequestSchema,
  UnlockResponse_Status,
} from "../../../proto/dapr/proto/runtime/v1/dapr_pb";
import IClientLock from "../../../interfaces/Client/IClientLock";

/**
 * gRPC-based distributed locking building block implementation.
 *
 * Provides distributed mutex operations for coordinating access to shared resources.
 * Supports acquiring locks with expiration, checking lock ownership, and releasing locks.
 *
 * Locks are maintained across service instances and managed by the Dapr sidecar.
 *
 * @implements {IClientLock}
 * @see {@link https://docs.dapr.io/reference/api/lock_api/} Dapr Lock API
 * @see {@link DaprClient.lock} for unified API
 *
 * @internal
 */
export default class GRPCClientLock implements IClientLock {
  /**
   * Reference to the underlying gRPC client.
   */
  client: GRPCClient;

  /**
   * Creates a gRPC distributed locking building block.
   *
   * @param client - The gRPC client instance
   */
  constructor(client: GRPCClient) {
    this.client = client;
  }

  /**
   * Attempts to acquire a distributed lock.
   *
   * Tries to acquire a lock with the specified owner ID. The lock is automatically
   * released after expiryInSeconds. Multiple lock attempts fail if the lock is held by another owner.
   *
   * @param storeName - Name of the lock store component
   * @param resourceId - Unique identifier for the resource being locked
   * @param lockOwner - Owner identifier (typically app instance ID or request ID)
   * @param expiryInSeconds - Seconds until the lock automatically expires
   *
   * @returns Promise resolving to lock response with success flag
   *
   * @throws Rejects if lock store is unavailable or gRPC call fails
   *
   * @example
   * ```typescript
   * const response = await client.lock.lock(
   *   "lockstore",
   *   "resource-123",
   *   "app-instance-1",
   *   30 // 30 second expiration
   * );
   * if (response.success) {
   *   console.log("Lock acquired");
   *   // Use protected resource
   * }
   * ```
   *
   * @see {@link unlock}
   * @see {@link https://docs.dapr.io/reference/api/lock_api/#acquiring-a-lock}
   */
  async lock(
    storeName: string,
    resourceId: string,
    lockOwner: string,
    expiryInSeconds: number,
  ): Promise<LockResponseResult> {
    const client = await this.client.getClient();
    const res = await client.tryLockAlpha1(create(TryLockRequestSchema, {
      storeName,
      resourceId,
      lockOwner,
      expiryInSeconds,
    }));

    return { success: res.success };
  }

  /**
   * Releases a previously acquired distributed lock.
   *
   * Removes the lock on a resource, allowing other requesters to acquire it.
   * Only the lock owner can unlock; attempts by other owners fail.
   *
   * @param storeName - Name of the lock store component
   * @param resourceId - Unique identifier for the locked resource
   * @param lockOwner - Owner identifier (must match who acquired the lock)
   *
   * @returns Promise resolving to unlock response with status
   *
   * @throws Rejects if lock store is unavailable or gRPC call fails
   *
   * @example
   * ```typescript
   * const response = await client.lock.unlock(
   *   "lockstore",
   *   "resource-123",
   *   "app-instance-1"
   * );
   * switch (response.status) {
   *   case LockStatus.Success:
   *     console.log("Lock released");
   *     break;
   *   case LockStatus.LockDoesNotExist:
   *     console.log("Lock was already released or expired");
   *     break;
   *   case LockStatus.LockBelongsToOthers:
   *     console.log("Cannot unlock lock owned by another process");
   *     break;
   * }
   * ```
   *
   * @see {@link lock}
   * @see {@link https://docs.dapr.io/reference/api/lock_api/#releasing-a-lock}
   */
  async unlock(storeName: string, resourceId: string, lockOwner: string): Promise<UnLockResponseResult> {
    const client = await this.client.getClient();
    const res = await client.unlockAlpha1(create(UnlockRequestSchema, {
      storeName,
      resourceId,
      lockOwner,
    }));

    return { status: this.getUnlockResponse(res.status) };
  }

  /**
   * Maps gRPC unlock response status to SDK LockStatus enum.
   *
   * @private
   * @param status - gRPC UnlockResponse_Status value
   * @returns Corresponding LockStatus enum value
   *
   * @internal
   */
  getUnlockResponse(status: UnlockResponse_Status) {
    switch (status) {
      case UnlockResponse_Status.SUCCESS:
        return LockStatus.Success;
      case UnlockResponse_Status.LOCK_DOES_NOT_EXIST:
        return LockStatus.LockDoesNotExist;
      case UnlockResponse_Status.LOCK_BELONGS_TO_OTHERS:
        return LockStatus.LockBelongsToOthers;
      default:
        return LockStatus.InternalError;
    }
  }
}
