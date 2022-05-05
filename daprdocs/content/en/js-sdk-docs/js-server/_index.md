---
type: docs
title: "JavaScript Server SDK"
linkTitle: "Server"
weight: 500
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
npm i dapr-client --save
```

2. Import the libraries:

```javascript
import { DaprServer, CommunicationProtocolEnum } from "dapr-client";

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

### Using HTTP (default)

```javascript
import { DaprServer } from "dapr-client";

const server= new DaprServer(appHost, appPort, daprHost, daprPort);
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

### Using gRPC

Since HTTP is the default, you will have to adapt the communication protocol to use gRPC. You can do this by passing an extra argument to the client or server constructor.

```javascript
import { DaprServer, CommunicationProtocol } from "dapr-client";

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

```javascript
import { DaprServer } from "dapr-client";

const daprHost = "127.0.0.1"; // Dapr Sidecar Host
const daprPort = "3500"; // Dapr Sidecar Port of this Example Server
const serverHost = "127.0.0.1"; // App Host of this Example Server
const serverPort = "50051"; // App Port of this Example Server "

async function start() {
  const server = new DaprServer(serverHost, serverPort, daprHost, daprPort);

  await server.invoker.listen('hello-world', mock, { method: HttpMethod.GET });

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

```javascript
import { DaprServer } from "dapr-client";

const daprHost = "127.0.0.1"; // Dapr Sidecar Host
const daprPort = "3500"; // Dapr Sidecar Port of this Example Server
const serverHost = "127.0.0.1"; // App Host of this Example Server
const serverPort = "50051"; // App Port of this Example Server "

async function start() {
  const server = new DaprServer(serverHost, serverPort, daprHost, daprPort);

  const pubSubName = "my-pubsub-name";
  const topic = "topic-a";

  // Configure Subscriber for a Topic
  await server.pubsub.subscribe(pubSubName, topic, async (data: any) => console.log(`Got Data: ${JSON.stringify(data)}`));

  await server.start();
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

> For a full list of state operations visit [How-To: Publish & subscribe]({{< ref howto-publish-subscribe.md >}}).

### Bindings API

#### Receive an Input Binding

```javascript
import { DaprServer } from "dapr-client";

const daprHost = "127.0.0.1"; 
const daprPort = "3500"; 
const serverHost = "127.0.0.1";
const serverPort = "5051";

async function start() {
  const server = new DaprServer(serverHost, serverPort, daprHost, daprPort);

  const bindingName = "my-binding-name";

  const response = await server.binding.receive(bindingName, async (data: any) => console.log(`Got Data: ${JSON.stringify(data)}`));

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

```javascript
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

```javascript
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

- [JavaScript SDK examples](https://github.com/dapr/js-sdk/tree/master/examples)