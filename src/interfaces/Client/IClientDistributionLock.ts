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

import { TryLockResponse } from "../../types/distributedlock/TryLockResponse";
import { UnlockResponse } from "../../types/distributedlock/UnLockResponse";

export default interface IClientDistributionLock {
  tryLock(storeName: string, resourceId: string, lockOwner: string, expiryInSeconds: number): Promise<TryLockResponse>;
  unLock(storeName: string, resourceId: string, lockOwner: string): Promise<UnlockResponse>;
}