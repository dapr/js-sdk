---
type: docs
title: "JavaScript Server SDK"
linkTitle: "Server"
weight: 2000
description: JavaScript Server SDK for developing Dapr applications
---

## Introduction

The Dapr Server will allow you to receive communication from the Dapr Sidecar and get access to its server facing features such as: Subscribing to Events, Receiving Input Bindings, and much more.

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

```typescript
import { DaprServer, CommunicationProtocolEnum } from "@dapr/dapr";

const daprHost = "127.0.0.1"; // Dapr Sidecar Host
const daprPort = "3500"; // Dapr Sidecar Port of this Example Server
const serverHost = "127.0.0.1"; // App Host of this Example Server
const serverPort = "50051"; // App Port of this Example Server

// HTTP Example
const server = new DaprServer(serverHost, serverPort, daprHost, daprPort);

// GRPC Example
const server = new DaprServer(serverHost, serverPort, daprHost, daprPort, CommunicationProtocolEnum.GRPC);
```

## Running

To run the examples, you can use two different protocols to interact with the Dapr sidecar: HTTP (default) or gRPC.

### Using HTTP (built-in express webserver)

```typescript
import { DaprServer } from "@dapr/dapr";

const server = new DaprServer(appHost, appPort, daprHost, daprPort);
// initialize subscribtions, ... before server start
// the dapr sidecar relies on these
await server.start();
```

```bash
# Using dapr run
dapr run --app-id example-sdk --app-port 50051 --app-protocol http -- npm run start

# or, using npm script
npm run start:dapr-http
```

> ℹ️ **Note:** The `app-port` is required here, as this is where our server will need to bind to. Dapr will check for the application to bind to this port, before finishing start-up.

### Using HTTP (bring your own express webserver)

Instead of using the built-in web server for Dapr sidecar to application communication, you can also bring your own instance. This is helpful in scenarios like when you are building a REST API back-end and want to integrate Dapr directly in it.

Note, this is currently available for [`express`](https://www.npmjs.com/package/express) only.

> 💡 Note: when using a custom web-server, the SDK will configure server properties like max body size, and add new routes to it. The routes are unique on their own to avoid any collisions with your application, but it's not guaranteed to not collide.

```typescript
import { DaprServer, CommunicationProtocolEnum } from "@dapr/dapr";
import express from "express";

const myApp = express();

myApp.get("/my-custom-endpoint", (req, res) => {
  res.send({ msg: "My own express app!" });
});

const daprServer = new DaprServer(
  "127.0.0.1", // App Host
  "50002", // App Port
  daprHost,
  daprPort,
  CommunicationProtocolEnum.HTTP,
  {},
  {
    serverHttp: myApp,
  },
);

// Initialize subscriptions before the server starts, the Dapr sidecar uses it.
// This will also initialize the app server itself (removing the need for `app.listen` to be called).
await daprServer.start();
```

After configuring the above, you can call your custom endpoint as you normally would:

```typescript
const res = await fetch(`http://127.0.0.1:50002/my-custom-endpoint`);
const json = await res.json();
```

### Using gRPC

Since HTTP is the default, you will have to adapt the communication protocol to use gRPC. You can do this by passing an extra argument to the client or server constructor.

```typescript
import { DaprServer, CommunicationProtocol } from "@dapr/dapr";

const server = new DaprServer(appHost, appPort, daprHost, daprPort, CommunicationProtocol.GRPC);
// initialize subscribtions, ... before server start
// the dapr sidecar relies on these
await server.start();
```

```bash
# Using dapr run
dapr run --app-id example-sdk --app-port 50051 --app-protocol grpc -- npm run start

# or, using npm script
npm run start:dapr-grpc
```

> ℹ️ **Note:** The `app-port` is required here, as this is where our server will need to bind to. Dapr will check for the application to bind to this port, before finishing start-up.

## Building blocks

The JavaScript Server SDK allows you to interface with all of the [Dapr building blocks]({{< ref building-blocks >}}) focusing on Sidecar to App features.

### Invocation API

#### Listen to an Invocation

```typescript
import { DaprServer, DaprInvokerCallbackContent } from "@dapr/dapr";

const daprHost = "127.0.0.1"; // Dapr Sidecar Host
const daprPort = "3500"; // Dapr Sidecar Port of this Example Server
const serverHost = "127.0.0.1"; // App Host of this Example Server
const serverPort = "50051"; // App Port of this Example Server "

async function start() {
  const server = new DaprServer(serverHost, serverPort, daprHost, daprPort);

  const callbackFunction = (data: DaprInvokerCallbackContent) => {
    console.log("Received body: ", data.body);
    console.log("Received metadata: ", data.metadata);
    console.log("Received query: ", data.query);
    console.log("Received headers: ", data.headers); // only available in HTTP
  };

  await server.invoker.listen("hello-world", callbackFunction, { method: HttpMethod.GET });

  // You can now invoke the service with your app id and method "hello-world"

  await server.start();
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

> For a full guide on service invocation visit [How-To: Invoke a service]({{< ref howto-invoke-discover-services.md >}}).

### PubSub API

#### Subscribe to messages

Subscribing to messages can be done in several ways to offer flexibility of receiving messages on your topics:

- Direct subscription through the `subscribe` method
- Direct susbcription with options through the `subscribeWithOptions` method
- Subscription afterwards through the `susbcribeOnEvent` method

Each time an event arrives, we pass its body as `data` and the headers as `headers`, which can contain properties of the event publisher (e.g., a device ID from IoT Hub)

> Dapr requires subscriptions to be set up on startup, but in the JS SDK we allow event handlers to be added afterwards as well, providing you the flexibility of programming.

An example is provided below

```typescript
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
  // Method 1: Direct subscription through the `subscribe` method
  await server.pubsub.subscribe(pubSubName, topic, async (data: any, headers: object) =>
    console.log(`Received Data: ${JSON.stringify(data)} with headers: ${JSON.stringify(headers)}`),
  );

  // Method 2: Direct susbcription with options through the `subscribeWithOptions` method
  await server.pubsub.subscribeWithOptions(pubSubName, topic, {
    callback: async (data: any, headers: object) =>
      console.log(`Received Data: ${JSON.stringify(data)} with headers: ${JSON.stringify(headers)}`),
  });

  // Method 3: Subscription afterwards through the `susbcribeOnEvent` method
  // Note: we use default, since if no route was passed (empty options) we utilize "default" as the route name
  await server.pubsub.subscribeWithOptions("pubsub-redis", "topic-options-1", {});
  server.pubsub.subscribeToRoute("pubsub-redis", "topic-options-1", "default", async (data: any, headers: object) => {
    console.log(`Received Data: ${JSON.stringify(data)} with headers: ${JSON.stringify(headers)}`);
  });

  // Start the server
  await server.start();
}
```

> For a full list of state operations visit [How-To: Publish & subscribe]({{< ref howto-publish-subscribe.md >}}).

#### Subscribe to messages rule based

Dapr [supports routing messages](https://docs.dapr.io/developing-applications/building-blocks/pubsub/howto-route-messages/) to different handlers (routes) based on rules.

> E.g., you are writing an application that needs to handle messages depending on their "type" with Dapr, you can send them to different routes `handlerType1` and `handlerType2` with the default route being `handlerDefault`

```typescript
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
  // Note: the default route and match patterns are optional
  await server.pubsub.subscribe("pubsub-redis", "topic-1", {
    default: "/default",
    rules: [
      {
        match: `event.type == "my-type-1"`,
        path: "/type-1",
      },
      {
        match: `event.type == "my-type-2"`,
        path: "/type-2",
      },
    ],
  });

  // Add handlers for each route
  server.pubsub.subscribeToRoute("pubsub-redis", "topic-1", "default", async (data) => {
    console.log(`Handling Default`);
  });
  server.pubsub.subscribeToRoute("pubsub-redis", "topic-1", "type-1", async (data) => {
    console.log(`Handling Type 1`);
  });
  server.pubsub.subscribeToRoute("pubsub-redis", "topic-1", "type-2", async (data) => {
    console.log(`Handling Type 2`);
  });

  // Start the server
  await server.start();
}
```

#### Dead Letter Topics

Dapr supports [dead letter topic](https://docs.dapr.io/developing-applications/building-blocks/pubsub/pubsub-deadletter/). This means that when a message fails to be processed, it gets sent to a dead letter queue. E.g., when a message fails to be handled on `/my-queue` it will be sent to `/my-queue-failed`.
E.g., when a message fails to be handled on `/my-queue` it will be sent to `/my-queue-failed`.

You can use the following options with `subscribeWithOptions` method:

- `deadletterTopic`: Specify a deadletter topic name (note: if none is provided we create one named `deadletter`)
- `deadletterCallback`: The method to trigger as handler for our deadletter

Implementing Deadletter support in the JS SDK can be done by either

- Passing the `deadletterCallback` as an option
- By subscribing to route manually with `subscribeToRoute`

An example is provided below

```typescript
import { DaprServer } from "@dapr/dapr";

const daprHost = "127.0.0.1"; // Dapr Sidecar Host
const daprPort = "3500"; // Dapr Sidecar Port of this Example Server
const serverHost = "127.0.0.1"; // App Host of this Example Server
const serverPort = "50051"; // App Port of this Example Server "

async function start() {
  const server = new DaprServer(serverHost, serverPort, daprHost, daprPort);

  const pubSubName = "my-pubsub-name";

  // Method 1 (direct subscribing through subscribeWithOptions)
  await server.pubsub.subscribeWithOptions("pubsub-redis", "topic-options-5", {
    callback: async (data: any) => {
      throw new Error("Triggering Deadletter");
    },
    deadLetterCallback: async (data: any) => {
      console.log("Handling Deadletter message");
    },
  });

  // Method 2 (subscribe afterwards)
  await server.pubsub.subscribeWithOptions("pubsub-redis", "topic-options-1", {
    deadletterTopic: "my-deadletter-topic",
  });
  server.pubsub.subscribeToRoute("pubsub-redis", "topic-options-1", "default", async () => {
    throw new Error("Triggering Deadletter");
  });
  server.pubsub.subscribeToRoute("pubsub-redis", "topic-options-1", "my-deadletter-topic", async () => {
    console.log("Handling Deadletter message");
  });

  // Start server
  await server.start();
}
```

### Bindings API

#### Receive an Input Binding

```typescript
import { DaprServer } from "@dapr/dapr";

const daprHost = "127.0.0.1";
const daprPort = "3500";
const serverHost = "127.0.0.1";
const serverPort = "5051";

async function start() {
  const server = new DaprServer(serverHost, serverPort, daprHost, daprPort);

  const bindingName = "my-binding-name";

  const response = await server.binding.receive(bindingName, async (data: any) =>
    console.log(`Got Data: ${JSON.stringify(data)}`),
  );

  await server.start();
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

> For a full guide on output bindings visit [How-To: Use bindings]({{< ref howto-bindings.md >}}).

### Configuration API

> 💡 The configuration API is currently only available through gRPC

#### Getting a configuration value

```typescript
import { DaprServer } from "dapr-client";

const daprHost = "127.0.0.1";
const daprPort = "3500";
const serverHost = "127.0.0.1";
const serverPort = "5051";

async function start() {
  const client = new DaprClient(daprHost, daprPort, CommunicationProtocolEnum.GRPC);
  const config = await client.configuration.get("config-redis", ["myconfigkey1", "myconfigkey2"]);
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

#### Subscribing to Key Changes

```typescript
import { DaprServer } from "dapr-client";

const daprHost = "127.0.0.1";
const daprPort = "3500";
const serverHost = "127.0.0.1";
const serverPort = "5051";

async function start() {
  const client = new DaprClient(daprHost, daprPort, CommunicationProtocolEnum.GRPC);
  const stream = await client.configuration.subscribeWithKeys("config-redis", ["myconfigkey1", "myconfigkey2"], () => {
    // Received a key update
  });

  // When you are ready to stop listening, call the following
  await stream.close();
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

## Related links

- [JavaScript SDK examples](https://github.com/dapr/js-sdk/tree/main/examples)
