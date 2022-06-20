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

import GRPCClient from './GRPCClient';
import { TryLockResponse as TryLockResponseResult } from '../../../types/lock/TryLockResponse';
import { UnlockResponse as UnLockResponseResult, LockStatus } from '../../../types/lock/UnlockResponse';
import { TryLockRequest, TryLockResponse, UnlockRequest, UnlockResponse } from '../../../proto/dapr/proto/runtime/v1/dapr_pb';
import IClientLock from '../../../interfaces/Client/IClientLock';

export default class GRPCClientLock implements IClientLock {
    client: GRPCClient;

    constructor(client: GRPCClient) {
        this.client = client;
    }

    async tryLock(storeName: string, resourceId: string, lockOwner: string, expiryInSeconds: number): Promise<TryLockResponseResult> {
        const request = new TryLockRequest();
        request.setStoreName(storeName);
        request.setResourceId(resourceId);
        request.setLockOwner(lockOwner);
        request.setExpiryinseconds(expiryInSeconds);

        return new Promise((resolve, reject) => {
          const client = this.client.getClient();
          client.tryLockAlpha1(request, (err, res: TryLockResponse) => {
            if (err) {
              return reject(err);
            }
    
            const wrapped: TryLockResponseResult = {
                success: res.getSuccess()
            }
    
            return resolve(wrapped);
          });
        });
      }


    async unlock(storeName: string, resourceId: string, lockOwner: string): Promise<UnLockResponseResult> {
        const request = new UnlockRequest();
        request.setStoreName(storeName);
        request.setResourceId(resourceId);
        request.setLockOwner(lockOwner);

        return new Promise((resolve, reject) => {
          const client = this.client.getClient();
          client.unlockAlpha1(request, (err, res: UnlockResponse) => {
            if (err) {
              return reject(err);
            }

            const wrapped: UnLockResponseResult = {
                status: this.getUnlockResponse(res)
            }
    
            return resolve(wrapped);
          });
        });
      }

      getUnlockResponse(res: UnlockResponse) {
        switch(res.getStatus()) {
            case UnlockResponse.Status.SUCCESS:
                return LockStatus.Success;
            case UnlockResponse.Status.LOCK_UNEXIST:
                return LockStatus.LockUnexist;
            case UnlockResponse.Status.LOCK_BELONG_TO_OTHERS:
                return LockStatus.LockBelongToOthers;
            default:
                return LockStatus.InternalError;

        }
    }
}