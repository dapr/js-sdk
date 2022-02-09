---
type: docs
title: "JavaScript Client SDK"
linkTitle: "Client"
weight: 500
description: JavaScript Client SDK for developing Dapr applications
---

## Pre-requisites

- [Dapr CLI]({{< ref install-dapr-cli.md >}}) installed
- Initialized [Dapr environment]({{< ref install-dapr-selfhost.md >}})
- [Latest LTS version of Node or greater](https://nodejs.org/en/) 

## Installing and importing Dapr's JS SDK

Install the SDK with npm:

```bash
npm i dapr-client
```

Import the libraries:

```javascript
import { DaprClient, DaprServer, HttpMethod, CommunicationProtocolEnum } from "dapr-client";

const daprHost = "127.0.0.1"; // Dapr Sidecar Host
const daprPort = "3500"; // Dapr Sidecar Port of this Example Server
const serverHost = "127.0.0.1"; // App Host of this Example Server
const serverPort = "50051"; // App Port of this Example Server 

// HTTP
const server = new DaprServer(serverHost, serverPort, daprHost, daprPort); 
const client = new DaprClient(daprHost, daprPort);

// GRPC 
const server = new DaprServer(serverHost, serverPort, daprHost, daprPort, CommunicationProtocolEnum.GRPC);
const client = new DaprClient(daprHost, daprPort, CommunicationProtocolEnum.GRPC);
```

## Running using HTTP or gRPC

By default, the example uses HTTP. To run:

```bash
# Using dapr run
dapr run --app-id example-config --app-port 50051 --app-protocol http npm run start

# or, using npm script
npm run start:dapr-http
```

To use gRPC instead:

- Add `CommunicationProtocolEnum.GRPC` to the DaprClient object creation:

  ```javascript
  const client = new DaprClient(daprHost, process.env.DAPR_HTTP_PORT, CommunicationProtocolEnum.GRPC);
  ```

- To run:

  ```bash
  # Using dapr run
  dapr run --app-id example-config --app-port 50051 --app-protocol grpc npm run start

  # or, using npm script
  npm run start:dapr-grpc
  ```

### DaprClient Library
A library that provides methods for how an application communicates with the Dapr sidecar.

### DaprServer Library
A library for how an application registers bindings / routes with Dapr. The `start()` method is used to start the server and bind the routes.

## Building blocks

The JavaScript SDK allows you to interface with all of the [Dapr building blocks]({{< ref building-blocks >}}).

### Invoke a service

```javascript
import { DaprClient, HttpMethod } from "dapr-client"; 

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
```

- For a full guide on service invocation visit [How-To: Invoke a service]({{< ref howto-invoke-discover-services.md >}}).

### Save, get and delete application state

```javascript
import { DaprClient } from "dapr-client"; 

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
```

- For a full list of state operations visit [How-To: Get & save state]({{< ref howto-get-save-state.md >}}).

### Publish & subscribe to messages

##### Publish messages

```javascript
import { DaprClient } from "dapr-client"; 

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
```

##### Subscribe to messages

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
```

- For a full list of state operations visit [How-To: Publish & subscribe]({{< ref howto-publish-subscribe.md >}}).

### Interact with bindings

**Output Bindings**

```javascript
import { DaprClient } from "dapr-client"; 

const daprHost = "127.0.0.1"; 
const daprPort = "3500"; 

async function start() {
  const client = new DaprClient(daprHost, daprPort); 

  const bindingName = "my-binding-name";
  const bindingOperation = "create";
  const message = { hello: "world" };

  const response = await client.binding.send(bindingName, bindingOperation, message);
}
```

**Input Bindings**

```javascript
import { DaprServer } from "dapr-client";;

const daprHost = "127.0.0.1"; 
const daprPort = "3500"; 
const serverHost = "127.0.0.1";
const serverPort = "5051";

async function start() {
  const server = new DaprServer(serverHost, serverPort, daprHost, daprPort);;

  const bindingName = "my-binding-name";

  const response = await server.binding.receive(bindingName, async (data: any) => console.log(`Got Data: ${JSON.stringify(data)}`));

  await server.start();
}
```

- For a full guide on output bindings visit [How-To: Use bindings]({{< ref howto-bindings.md >}}).

### Retrieve secrets

```javascript
import { DaprClient } from "dapr-client"; 

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
```

- For a full guide on secrets visit [How-To: Retrieve secrets]({{< ref howto-secrets.md >}}).

### Get configuration keys

```javascript
import { DaprClient } from "dapr-client";

const daprHost = "127.0.0.1";
const daprAppId = "example-config";

async function start() {

  const client = new DaprClient(
    daprHost,
    process.env.DAPR_HTTP_PORT
  );

  const config = await client.configuration.get('config-store', ['key1', 'key2']);
  console.log(config); 

  console.log(JSON.stringify(config));
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

## Related links

- [JavaScript SDK examples](https://github.com/dapr/js-sdk/tree/master/examples)