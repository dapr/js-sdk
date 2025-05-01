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

export default interface IClientLock {
  /**
   *
   * @param storeName storage to store lock information.
   * @param resourceId id of a resource that gets locked.
   * @param lockOwner owner owning the lock.
   * @param expiryInSeconds the expiry time for the lock.
   */
  lock(storeName: string, resourceId: string, lockOwner: string, expiryInSeconds: number): Promise<LockResponse>;

  /**
   *
   * @param storeName storage to store lock information.
   * @param resourceId id of a resource that gets locked.
   * @param lockOwner owner owning the lock.
   */
  unlock(storeName: string, resourceId: string, lockOwner: string): Promise<UnlockResponse>;
}
