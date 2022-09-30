---
type: docs
title: "JavaScript Client SDK"
linkTitle: "Client"
weight: 1000
description: JavaScript Client SDK for developing Dapr applications
---

## Introduction

The Dapr Client allows you to communicate with the Dapr Sidecar and get access to its client facing features such as Publishing Events, Invoking Output Bindings, State Management, Secret Management, and much more.

## Pre-requisites

- [Dapr CLI]({{< ref install-dapr-cli.md >}}) installed
- Initialized [Dapr environment]({{< ref install-dapr-selfhost.md >}})
- [Latest LTS version of Node or greater](https://nodejs.org/en/)

## Installing and importing Dapr's JS SDK

1. Install the SDK with `npm`:

```bash
npm i @dapr/dapr --save
```

2. Import the libraries:

```ts
import { DaprClient, DaprServer, HttpMethod, CommunicationProtocolEnum } from "@dapr/dapr";

const daprHost = "127.0.0.1"; // Dapr Sidecar Host
const daprPort = "3500"; // Dapr Sidecar Port of this Example Server
const serverHost = "127.0.0.1"; // App Host of this Example Server
const serverPort = "50051"; // App Port of this Example Server

// HTTP Example
const client = new DaprClient(daprHost, daprPort);

// GRPC Example
const client = new DaprClient(daprHost, daprPort, CommunicationProtocolEnum.GRPC);
```

## Running

To run the examples, you can use two different protocols to interact with the Dapr sidecar: HTTP (default) or gRPC.

### Using HTTP (default)

```ts
import { DaprClient } from "@dapr/dapr";
const client = new DaprClient(daprHost, daprPort);
```

```bash
# Using dapr run
dapr run --app-id example-sdk --app-protocol http -- npm run start

# or, using npm script
npm run start:dapr-http
```

### Using gRPC

Since HTTP is the default, you will have to adapt the communication protocol to use gRPC. You can do this by passing an extra argument to the client or server constructor.

```ts
import { DaprClient, CommunicationProtocol } from "@dapr/dapr";
const client = new DaprClient(daprHost, daprPort, CommunicationProtocol.GRPC);
```

```bash
# Using dapr run
dapr run --app-id example-sdk --app-protocol grpc -- npm run start

# or, using npm script
npm run start:dapr-grpc
```

## Proxying Requests

By proxying requests, we can utilize the unique capabilities that Dapr brings with its sidecar architecture such as service discovery, logging, etc., enabling us to instantly "upgrade" our gRPC services. This feature of gRPC proxying was demonstrated in [community call 41](https://www.youtube.com/watch?v=B_vkXqptpXY&t=71s).

### Creating a Proxy

To perform gRPC proxying, simply create a proxy by calling the `client.proxy.create()` method:

```ts
// As always, create a client to our dapr sidecar
// this client takes care of making sure the sidecar is started, that we can communicate, ...
const clientSidecar = new DaprClient(daprHost, daprPort, CommunicationProtocolEnum.GRPC);

// Create a Proxy that allows us to use our gRPC code
const clientProxy = await clientSidecar.proxy.create<GreeterClient>(GreeterClient);
```

We can now call the methods as defined in our `GreeterClient` interface (which in this case is from the [Hello World example](https://github.com/grpc/grpc-go/blob/master/examples/helloworld/helloworld/helloworld.proto))

### Behind the Scenes (Technical Working)

![Architecture](assets/architecture.png)

1. The gRPC service gets started in Dapr. We tell Dapr which port this gRPC server is running on through `--app-port` and give it a unique Dapr app ID with `--app-id <APP_ID_HERE>`
2. We can now call the Dapr Sidecar through a client that will connect to the Sidecar
3. Whilst calling the Dapr Sidecar, we provide a metadata key named `dapr-app-id` with the value of our gRPC server booted in Dapr (e.g. `server` in our example)
4. Dapr will now forward the call to the gRPC server configured

## Building blocks

The JavaScript Client SDK allows you to interface with all of the [Dapr building blocks]({{< ref building-blocks >}}) focusing on Client to Sidecar features.

### Invocation API

#### Invoke a Service

```ts
import { DaprClient, HttpMethod } from "@dapr/dapr";

const daprHost = "127.0.0.1";
const daprPort = "3500";

async function start() {
  const client = new DaprClient(daprHost, daprPort);

  const serviceAppId = "my-app-id";
  const serviceMethod = "say-hello";

  // POST Request
  const response = await client.invoker.invoke(serviceAppId, serviceMethod, HttpMethod.POST, { hello: "world" });

  // GET Request
  const response = await client.invoker.invoke(serviceAppId, serviceMethod, HttpMethod.GET);
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

> For a full guide on service invocation visit [How-To: Invoke a service]({{< ref howto-invoke-discover-services.md >}}).

### State Management API

#### Save, Get and Delete application state

```ts
import { DaprClient } from "@dapr/dapr";

const daprHost = "127.0.0.1";
const daprPort = "3500";

async function start() {
  const client = new DaprClient(daprHost, daprPort);

  const serviceStoreName = "my-state-store-name";

  // Save State
  const response = await client.state.save(serviceStoreName, [
    {
      key: "first-key-name",
      value: "hello",
    },
    {
      key: "second-key-name",
      value: "world",
    },
  ]);

  // Get State
  const response = await client.state.get(serviceStoreName, "first-key-name");

  // Get Bulk State
  const response = await client.state.getBulk(serviceStoreName, ["first-key-name", "second-key-name"]);

  // State Transactions
  await client.state.transaction(serviceStoreName, [
    {
      operation: "upsert",
      request: {
        key: "first-key-name",
        value: "new-data",
      },
    },
    {
      operation: "delete",
      request: {
        key: "second-key-name",
      },
    },
  ]);

  // Delete State
  const response = await client.state.delete(serviceStoreName, "first-key-name");
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

> For a full list of state operations visit [How-To: Get & save state]({{< ref howto-get-save-state.md >}}).

#### Query State API

```ts
import { DaprClient } from "@dapr/dapr";

async function start() {
  const client = new DaprClient(daprHost, daprPort);

  const res = await client.state.query("state-mongodb", {
    filter: {
      OR: [
        {
          EQ: { "person.org": "Dev Ops" },
        },
        {
          AND: [
            {
              EQ: { "person.org": "Finance" },
            },
            {
              IN: { state: ["CA", "WA"] },
            },
          ],
        },
      ],
    },
    sort: [
      {
        key: "state",
        order: "DESC",
      },
    ],
    page: {
      limit: 10,
    },
  });

  console.log(res);
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

### PubSub API

#### Publish messages

```ts
import { DaprClient } from "@dapr/dapr";

const daprHost = "127.0.0.1";
const daprPort = "3500";

async function start() {
  const client = new DaprClient(daprHost, daprPort);

  const pubSubName = "my-pubsub-name";
  const topic = "topic-a";
  const message = { hello: "world" };

  // Publish Message to Topic
  const response = await client.pubsub.publish(pubSubName, topic, message);
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

### Bindings API

#### Invoke Output Binding

**Output Bindings**

```ts
import { DaprClient } from "@dapr/dapr";

const daprHost = "127.0.0.1";
const daprPort = "3500";

async function start() {
  const client = new DaprClient(daprHost, daprPort);

  const bindingName = "my-binding-name";
  const bindingOperation = "create";
  const message = { hello: "world" };

  const response = await client.binding.send(bindingName, bindingOperation, message);
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

> For a full guide on output bindings visit [How-To: Use bindings]({{< ref howto-bindings.md >}}).

### Secret API

#### Retrieve secrets

```ts
import { DaprClient } from "@dapr/dapr";

const daprHost = "127.0.0.1";
const daprPort = "3500";

async function start() {
  const client = new DaprClient(daprHost, daprPort);

  const secretStoreName = "my-secret-store";
  const secretKey = "secret-key";

  // Retrieve a single secret from secret store
  const response = await client.secret.get(secretStoreName, secretKey);

  // Retrieve all secrets from secret store
  const response = await client.secret.getBulk(secretStoreName);
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

> For a full guide on secrets visit [How-To: Retrieve secrets]({{< ref howto-secrets.md >}}).

### Configuration API

#### Get Configuration Keys

```ts
import { DaprClient } from "@dapr/dapr";

const daprHost = "127.0.0.1";
const daprAppId = "example-config";

async function start() {
  const client = new DaprClient(daprHost, process.env.DAPR_HTTP_PORT);

  const config = await client.configuration.get("config-store", ["key1", "key2"]);
  console.log(config);
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

### Distributed Lock API

#### Try Lock and Unlock APIs

```ts
import { CommunicationProtocolEnum, DaprClient } from "@dapr/dapr";
import { LockStatus } from "@dapr/dapr/types/lock/UnlockResponse";

const daprHost = "127.0.0.1";
const daprPortDefault = "3500";

async function start() {
  const client = new DaprClient(daprHost, daprPort);

  const storeName = "redislock";
  const resourceId = "resourceId";
  const lockOwner = "owner1";
  let expiryInSeconds = 1000;

  console.log(`Acquiring lock on ${storeName}, ${resourceId} as owner: ${lockOwner}`);
  const tryLockResponse = await client.lock.tryLock(storeName, resourceId, lockOwner, expiryInSeconds);
  console.log(tryLockResponse);

  console.log(`Unlocking on ${storeName}, ${resourceId} as owner: ${lockOwner}`);
  const unlockResponse = await client.lock.unlock(storeName, resourceId, lockOwner);
  console.log("Unlock API response: " + getResponseStatus(unlockResponse.status));
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
```

> For a full guide on distributed locks visit [How-To: Use Distributed Locks]({{< ref howto-use-distributed-lock.md >}}).

## Related links

- [JavaScript SDK examples](https://github.com/dapr/js-sdk/tree/master/examples)
