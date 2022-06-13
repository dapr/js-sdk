# Example - Distributed Lock APIs

This example demonstrates the Distributed Lock APIs in Dapr.
It demonstrates the following APIs:
- **Distributed Lock**: Try Lock
- **Distributed Lock**: Unlock

> **Note:** Make sure to use the latest proto bindings by running scripts/fetch-proto.sh file.
## Prerequisites

- [Dapr CLI](https://docs.dapr.io/getting-started/install-dapr-cli/)
- [Dapr JS SDK](https://docs.dapr.io/developing-applications/sdks/js/)
- Initialize Dapr environment by pulling the code from master branch of [Dapr](https://github.com/dapr/dapr)

## Overview
This example shows the usage of two different Distributed Lock APIs, TryLock call and Unlock call.

#### TryLock Example
```javascript
const tryLockResponse = await client.distributedLock.tryLock(storeName, resourceId, lockOwner, expiryInSeconds);
```

#### Unlock Example
```javascript
const unLockResponse = await client.distributedLock.unlock(storeName, resourceId, lockOwner);
```

### Start the DistributedLock TryLockApplication.

Change directory to this folder:

```bash
cd examples/Client/DistributedLockApi/TryLockApplication
npm install
```

To run the `TryLockApplication`, execute the following command:

```bash
dapr run --app-id distributedLock --app-protocol grpc --components-path ./components npm run start
```

You should see the following output from the application:

```
== APP == Acquiring lock on redislock, resourceId as owner: owner1
== APP == { success: true }
== APP == Unlocking on redislock, resourceId as owner: owner1
== APP == Unlock API response: Success
== APP == Unlocking on redislock, resourceId as owner: owner1
== APP == Unlock API response when lock is not acquired: LockUnexist
== APP == Acquiring lock on redislock, resourceId as owner: owner1
== APP == Acquired Lock? true
```

### Start the DistributedLock UnLockApplication.

Run `UnLockApplication` after `TryLockApplication` is ran.

Change directory to this folder:

```bash
cd examples/Client/DistributedLockApi/UnLockApplication
npm install
```

To run the `UnLockApplication`, execute the following command:

```bash
dapr run --app-id distributedLock --app-protocol grpc --components-path ./components npm run start
```

You should see the following output from the application:

```
== APP == Acquiring lock on redislock, resourceId as owner: owner2
== APP == Acquired Lock? false
== APP == Lock cannot be acquired as it belongs to the other process
== APP == Unlocking on redislock, resourceId as owner: owner2
== APP == Unlock API response when lock is acquired by a different process: LockBelongToOthers
== APP == Acquiring lock on redislock, resourceId as owner: owner2
== APP == Acquired lock after the lock from the other process expired? true
== APP == Unlocking on redislock, resourceId as owner: owner2
== APP == Unlock API response when lock is released after the expiry time: Success
== APP == Unlocking on redislock, resourceId as owner: owner2
== APP == Unlock API response when lock is released after the expiry time and lock does not exist: LockUnexist
```