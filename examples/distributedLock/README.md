# Example - Distributed Lock APIs

This example demonstrates 2 features (Try Lock & Unlock) from the [Distributed lock API from Dapr](https://github.com/dapr/dapr/issues/3549) that helps developers to keep their data safe from race conditions. For more information, check out the documentation at

It demonstrates the **Distributed Lock** API's following methods:

- `Lock`
- `Unlock`

> **Note:** Make sure to use the latest proto bindings by running scripts/fetch-proto.sh file.

## Prerequisites

- [Dapr CLI](https://docs.dapr.io/getting-started/install-dapr-cli/)
- [Dapr JS SDK](https://docs.dapr.io/developing-applications/sdks/js/)
- Initialize Dapr environment by pulling the code from main branch of [Dapr](https://github.com/dapr/dapr)

## Overview

The Lock and Unlock calls are implemented under the client.lock attribute.

#### Lock Example

```typescript
const lockResponse = await client.lock.lock(storeName, resourceId, lockOwner, expiryInSeconds);
```

#### Unlock Example

```typescript
const unlockResponse = await client.lock.unlock(storeName, resourceId, lockOwner);
```

### Start the Lock application.

Execute the example under the folder `examples/distributedLock/LockApplication`

```bash
cd examples/distributedLock/LockApplication
npm install
```

To run the `Lock`, execute the following command:

```bash
dapr run --app-id lock --app-protocol grpc --components-path ./components npm run start
```

You should see the following output from the application:

```
== APP == Acquiring lock on redislock, resourceId as owner: owner1
== APP == { success: true }
== APP == Unlocking on redislock, resourceId as owner: owner1
== APP == Unlock API response: Success
== APP == Unlocking on redislock, resourceId as owner: owner1
== APP == Unlock API response when lock is not acquired: LockDoesNotExist
== APP == Acquiring lock on redislock, resourceId as owner: owner1
== APP == Acquired Lock? true
```

### Start the Unlock Example.

Run `UnlockApplication` after `LockApplication` is ran.

Navigate to examples/distributedLock/UnlockApplication.

```bash
cd examples/distributedLock/UnlockApplication
npm install
```

To run the `UnlockApplication`, execute the following command:

```bash
dapr run --app-id lock --app-protocol grpc --components-path ./components npm run start
```

You should see the following output from the application:

```
== APP == Acquiring lock on redislock, resourceId as owner: owner2
== APP == Acquired Lock? false
== APP == Lock cannot be acquired as it belongs to the other process
== APP == Unlocking on redislock, resourceId as owner: owner2
== APP == Unlock API response when lock is acquired by a different process: LockBelongsToOthers
== APP == Acquiring lock on redislock, resourceId as owner: owner2
== APP == Acquired lock after the lock from the other process expired? true
== APP == Unlocking on redislock, resourceId as owner: owner2
== APP == Unlock API response when lock is released after the expiry time: Success
== APP == Unlocking on redislock, resourceId as owner: owner2
== APP == Unlock API response when lock is released after the expiry time and lock does not exist: LockDoesNotExist
```
