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
import { LockStatus } from "@dapr/dapr/types/lock/UnLockResponse";

const daprHost = "127.0.0.1";
const daprPortDefault = "3500";

async function start() {
  const client = new DaprClient(
    daprHost,
    process.env.DAPR_GRPC_PORT ?? daprPortDefault,
    CommunicationProtocolEnum.GRPC
  );

  const storeName = "redislock";
  let resourceId = "resourceId";
  let lockOwner = "owner1";
  let expiryInSeconds = 1000;

  const tryLockResponse = await client.lock.tryLock(storeName, resourceId, lockOwner, expiryInSeconds);
  console.log(tryLockResponse);

  const unLockResponse = await client.lock.unLock(storeName, resourceId, lockOwner);
  console.log("Unlock API response: " + getResponseStatus(unLockResponse.status));

  //Checking if the lock exists.
  const lockUnexistResponse = await client.lock.unLock(storeName, resourceId, lockOwner);
  console.log("Unlock API response when lock is not acquired: " + getResponseStatus(lockUnexistResponse.status));

  resourceId = "resourceId";
  lockOwner = "owner1";
  expiryInSeconds = 25;
  const tryLockResponse1 = await client.lock.tryLock(storeName, resourceId, lockOwner, expiryInSeconds);
  console.log("Acquired Lock? " + tryLockResponse1.success);

  await new Promise(resolve => setTimeout(resolve, 20000));

}

function getResponseStatus(status: LockStatus) {
  switch(status) {
    case 0:
      return "Success";
    case 1: 
      return "LockUnexist";
    case 2:
      return "LockBelongToOthers";
    default:
      return "InternalError";
  }
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});