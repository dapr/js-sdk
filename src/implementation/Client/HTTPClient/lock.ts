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

import HTTPClient from "./HTTPClient";
import { LockResponse } from "../../../types/lock/LockResponse";
import { UnlockResponse, LockStatus } from "../../../types/lock/UnlockResponse";
import IClientLock from "../../../interfaces/Client/IClientLock";
import { KeyValueType } from "../../../types/KeyValue.type";

export default class HTTPClientLock implements IClientLock {
  client: HTTPClient;

  constructor(client: HTTPClient) {
    this.client = client;
  }

  async lock(storeName: string, resourceId: string, lockOwner: string, expiryInSeconds: number): Promise<LockResponse> {
    const data = {
      resourceId,
      lockOwner,
      expiryInSeconds,
    };

    const result = await this.client.executeWithApiVersion("v1.0-alpha1", `/lock/${storeName}`, {
      method: "POST",
      body: data,
    });

    return {
      success: (result as KeyValueType)["success"],
    };
  }

  async unlock(storeName: string, resourceId: string, lockOwner: string): Promise<UnlockResponse> {
    const data = {
      resourceId,
      lockOwner,
    };

    const result = await this.client.executeWithApiVersion("v1.0-alpha1", `/unlock/${storeName}`, {
      method: "POST",
      body: data,
    });

    return {
      status: this._statusToLockStatus((result as KeyValueType)["status"]),
    };
  }

  _statusToLockStatus(status: number): LockStatus {
    switch (status) {
      case 0:
        return LockStatus.Success;
      case 1:
        return LockStatus.LockDoesNotExist;
      case 2:
        return LockStatus.LockBelongsToOthers;
      case 3:
      default:
        return LockStatus.InternalError;
    }
  }
}
