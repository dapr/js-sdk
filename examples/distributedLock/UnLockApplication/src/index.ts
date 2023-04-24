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

import { CommunicationProtocolEnum, DaprClient } from "@dapr/dapr";
import { LockStatus } from "@dapr/dapr/types/lock/UnlockResponse";

const daprHost = "127.0.0.1";
const daprPortDefault = "3500";

async function start() {
  const client = new DaprClient({
    daprHost,
    daprPort: process.env.DAPR_GRPC_PORT ?? daprPortDefault,
    communicationProtocol: CommunicationProtocolEnum.GRPC,
  });

  const storeName = "redislock";
  const resourceId = "resourceId";
  const lockOwner = "owner2";
  const expiryInSeconds = 25;

  // Trying to acquire the lock which is being used by the other process(LockApplication)
  console.log(`Acquiring lock on ${storeName}, ${resourceId} as owner: ${lockOwner}`);
  let lockResponse = await client.lock.lock(storeName, resourceId, lockOwner, expiryInSeconds);
  console.log("Acquired Lock? " + lockResponse.success);
  console.log("Lock cannot be acquired as it belongs to the other process");

  console.log(`Unlocking on ${storeName}, ${resourceId} as owner: ${lockOwner}`);
  let unLockResponse = await client.lock.unlock(storeName, resourceId, lockOwner);
  console.log(
    "Unlock API response when lock is acquired by a different process: " + getResponseStatus(unLockResponse.status),
  );

  await new Promise((resolve) => setTimeout(resolve, 25000));

  // Trying to acquire the lock after the other process lock is expired
  console.log(`Acquiring lock on ${storeName}, ${resourceId} as owner: ${lockOwner}`);
  lockResponse = await client.lock.lock(storeName, resourceId, lockOwner, expiryInSeconds);
  console.log("Acquired lock after the lock from the other process expired? " + lockResponse.success);

  console.log(`Unlocking on ${storeName}, ${resourceId} as owner: ${lockOwner}`);
  unLockResponse = await client.lock.unlock(storeName, resourceId, lockOwner);
  console.log(
    "Unlock API response when lock is released after the expiry time: " + getResponseStatus(unLockResponse.status),
  );

  await new Promise((resolve) => setTimeout(resolve, 25000));

  // Trying to unlock the lock after the lock used by this process(UnLockApplication) is expired
  console.log(`Unlocking on ${storeName}, ${resourceId} as owner: ${lockOwner}`);
  unLockResponse = await client.lock.unlock(storeName, resourceId, lockOwner);
  console.log(
    "Unlock API response when lock is released after the expiry time and lock does not exist: " +
      getResponseStatus(unLockResponse.status),
  );
}

function getResponseStatus(status: LockStatus) {
  switch (status) {
    case LockStatus.Success:
      return "Success";
    case LockStatus.LockDoesNotExist:
      return "LockDoesNotExist";
    case LockStatus.LockBelongsToOthers:
      return "LockBelongsToOthers";
    default:
      return "InternalError";
  }
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
