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
import { TryLockResponse as TryLockResponseResult } from "../../../types/lock/TryLockResponse";
import { UnlockResponse as UnLockResponseResult } from "../../../types/lock/UnlockResponse";
import IClientLock from "../../../interfaces/Client/IClientLock";

export default class HTTPClientLock implements IClientLock {
  client: HTTPClient;

  constructor(client: HTTPClient) {
    this.client = client;
  }
  tryLock(
    _storeName: string,
    _resourceId: string,
    _lockOwner: string,
    _expiryInSeconds: number,
  ): Promise<TryLockResponseResult> {
    throw new Error("HTTP is currently not supported.");
  }
  unlock(_storeName: string, _resourceId: string, _lockOwner: string): Promise<UnLockResponseResult> {
    throw new Error("HTTP is currently not supported.");
  }
}
