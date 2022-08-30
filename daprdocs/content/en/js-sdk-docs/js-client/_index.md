---
type: docs
title: "JavaScript Client SDK"
linkTitle: "Client"
weight: 1000
description: JavaScript Client SDK for developing Dapr applications
---

## Introduction

The Dapr Client allows you to communicate with the Dapr Sidecar and get access to its client facing features such as  Publishing Events, Invoking Output Bindings, State Management, Secret Management, and much more.

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

```javascript
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

```javascript
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

```javascript
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

```javascript
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

```javascript
import { DaprClient, HttpMethod } from "@dapr/dapr"; 

const daprHost = "127.0.0.1"; 
const daprPort = "3500"; 

async function start() {
  const client = new DaprClient(daprHost, daprPort); 

  const serviceAppId = "my-app-id";
  const serviceMethod = "say-hello";
  
  // POST Request
  const response = await client.invoker.invoke(serviceAppId , serviceMethod , HttpMethod.POST, { hello: "world" });

  // GET Request
  const response = await client.invoker.invoke(serviceAppId , serviceMethod , HttpMethod.GET);
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

> For a full guide on service invocation visit [How-To: Invoke a service]({{< ref howto-invoke-discover-services.md >}}).


### State Management API

#### Save, Get and Delete application state

```javascript
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
      value: "hello"
    },
    {
      key: "second-key-name",
      value: "world"
    }
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
        value: "new-data"
      }
    },
    {
      operation: "delete",
      request: {
        key: "second-key-name"
      }
    }
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

```javascript
import { DaprClient } from "@dapr/dapr";

async function start() {
  const client = new DaprClient(daprHost, daprPort);

  const res = await client.state.query("state-mongodb", {
    filter: {
      OR: [
        {
          EQ: { "person.org": "Dev Ops" }
        },
        {
          "AND": [
            {
              "EQ": { "person.org": "Finance" }
            },
            {
              "IN": { "state": ["CA", "WA"] }
            }
          ]
        }
      ]
    },
    sort: [
      {
        key: "state",
        order: "DESC"
      }
    ],
    page: {
      limit: 10
    }
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

```javascript
import { DaprClient } from "@dapr/dapr"; 

const daprHost = "127.0.0.1"; 
const daprPort = "3500"; 

async function start() {
  const client = new DaprClient(daprHost, daprPort); 

  const pubSubName = "my-pubsub-name";
  const topic = "topic-a";
  const message = { hello: "world" }

  // Publish Message to Topic
  const response = await client.pubsub.publish(pubSubName, topic, message);
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

#### Subscribe to messages

Subscribing to messages can be done in several ways to offer flexibility of receiving messages on your topics:

* Direct subscribtion through the `subscribe` method
* Direct susbcription with options through the `subscribeWithOptions` method
* Subscription afterwards through the `susbcribeOnEvent` method

> Dapr requires subscriptions to be set up on startup, but in the JS SDK we allow event handlers to be added afterwards as well, providing you the flexibility of programming.

An example is provided below

```javascript
import { DaprServer } from "@dapr/dapr";

const daprHost = "127.0.0.1"; // Dapr Sidecar Host
const daprPort = "3500"; // Dapr Sidecar Port of this Example Server
const serverHost = "127.0.0.1"; // App Host of this Example Server
const serverPort = "50051"; // App Port of this Example Server "

async function start() {
  const server = new DaprServer(serverHost, serverPort, daprHost, daprPort);

  const pubSubName = "my-pubsub-name";
  const topic = "topic-a";

  // Configure Subscriber for a Topic
  // Method 1: Direct subscribtion through the `subscribe` method
  await server.pubsub.subscribe(pubSubName, topic, async (data: any) => console.log(`Received Data: ${JSON.stringify(data)}`));

  // Method 2: Direct susbcription with options through the `subscribeWithOptions` method
  await server.pubsub.subscribeWithOptions(pubSubName, topic, { 
    callback: async (data: any) => console.log(`Received Data: ${JSON.stringify(data)}`) 
  });

  // Method 3: Subscription afterwards through the `susbcribeOnEvent` method
  await server.pubsub.subscribeWithOptions('pubsub-redis', 'topic-options-1', {});
  server.pubsub.subscribeOnEvent("pubsub-redis", "topic-options-1", "default", async (data) => { console.log(`Received Data: ${JSON.stringify(data)}`) });

  // Start the server
  await server.start();
}
```

> For a full list of state operations visit [How-To: Publish & subscribe]({{< ref howto-publish-subscribe.md >}}).

#### Subscribe to messages rule based

Dapr [supports routing messages](https://docs.dapr.io/developing-applications/building-blocks/pubsub/howto-route-messages/
) to different handlers (routes) based on rules. 

> E.g., think of that you are writing an application that needs to handle messages depending on their "type" with Dapr you can then route it to `handlerType1` and `handlerType2` with a default being `handlerDefault`

```javascript
import { DaprServer } from "@dapr/dapr";

const daprHost = "127.0.0.1"; // Dapr Sidecar Host
const daprPort = "3500"; // Dapr Sidecar Port of this Example Server
const serverHost = "127.0.0.1"; // App Host of this Example Server
const serverPort = "50051"; // App Port of this Example Server "

async function start() {
  const server = new DaprServer(serverHost, serverPort, daprHost, daprPort);

  const pubSubName = "my-pubsub-name";
  const topic = "topic-a";

  // Configure Subscriber for a Topic with rule set
  await server.pubsub.subscribe('pubsub-redis', 'topic-1', {
    default: "/default",
    rules: [
      {
        match: `event.type == "my-type-1"`,
        path: "/type-1"
      },
      {
        match: `event.type == "my-type-2"`,
        path: "/type-2"
      }
    ]
  });

  // Add handlers for each route
  server.pubsub.subscribeOnEvent("pubsub-redis", "topic-1", "default", async (data) => { console.log(`Handling Default`) });
  server.pubsub.subscribeOnEvent("pubsub-redis", "topic-1", "type-1", async (data) => { console.log(`Handling Type 1`) });
  server.pubsub.subscribeOnEvent("pubsub-redis", "topic-1", "type-2", async (data) => { console.log(`Handling Type 2`) });

  // Start the server
  await server.start();
}
```

#### DeadLetter support

As per https://docs.dapr.io/developing-applications/building-blocks/pubsub/pubsub-deadletter/ Dapr supports deadletter messages. This means that when a message fails to be processed, it gets sent to a deadletter portion of the queue. E.g., when a message fails to be handled on `/my-queue` it will be sent to `/my-queue-failed`.

In the Javascript SDK we implement this through the `subscribeWithOptions` call that allows you to specify options to the subscribe method. For deadletter, we offer:
* `deadletterTopic`: Specify a deadletter topic name (note: if none is provided we create one named `deadletter`)
* `deadletterCallback`: The method to trigger as handler for our deadletter

Implementing Deadletter support in the JS SDK can be done by either
* Passing the `deadletterCallback` as an option 
* By subscribing to route manually with `subscribeOnEvent`

An example is provided below

```javascript
import { DaprServer } from "@dapr/dapr";

const daprHost = "127.0.0.1"; // Dapr Sidecar Host
const daprPort = "3500"; // Dapr Sidecar Port of this Example Server
const serverHost = "127.0.0.1"; // App Host of this Example Server
const serverPort = "50051"; // App Port of this Example Server "

async function start() {
  const server = new DaprServer(serverHost, serverPort, daprHost, daprPort);

  const pubSubName = "my-pubsub-name";

  // Method 1 (direct subscribing through subscribeWithOptions)
  await server.pubsub.subscribeWithOptions('pubsub-redis', 'topic-options-5', { 
    callback: async (data: any) => { throw new Error("Triggering Deadletter") }, 
    deadLetterCallback: async (data: any) => { console.log("Handling Deadletter message") } 
  });

  // Method 2 (subscribe afterwards)
  await server.pubsub.subscribeWithOptions('pubsub-redis', 'topic-options-1', { deadletterTopic: "my-deadletter-topic" });
  server.pubsub.subscribeOnEvent("pubsub-redis", "topic-options-1", "default", async () => { throw new Error("Triggering Deadletter") });
  server.pubsub.subscribeOnEvent("pubsub-redis", "topic-options-1", "my-deadletter-topic", async () => { console.log("Handling Deadletter message") });

  // Start server
  await server.start();
}
```

### Bindings API

#### Invoke Output Binding

**Output Bindings**

```javascript
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

```javascript
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

```javascript
import { DaprClient } from "@dapr/dapr";

const daprHost = "127.0.0.1";
const daprAppId = "example-config";

async function start() {

  const client = new DaprClient(daprHost, process.env.DAPR_HTTP_PORT);

  const config = await client.configuration.get('config-store', ['key1', 'key2']);
  console.log(config);
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

## Related links

- [JavaScript SDK examples](https://github.com/dapr/js-sdk/tree/master/examples)