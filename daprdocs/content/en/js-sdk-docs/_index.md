---
type: docs
title: "Dapr JavaScript SDK"
linkTitle: "JavaScript"
weight: 1000
description: JavaScript SDK packages for developing Dapr applications
---

## Pre-requisites

- [Dapr CLI]({{< ref install-dapr-cli.md >}}) installed
- Initialized [Dapr environment]({{< ref install-dapr-selfhost.md >}})
- [Latest LTS version of Node or greater](https://nodejs.org/en/) 

## Installing and importing Dapr's JS SDK

Install the SDK with npm:
```
npm i @dapr/js-sdk
```

Import the libraries for the the given protocol:  

```javascript
const daprHost = "127.0.0.1"; // Dapr Sidecar Host
const daprPort = "50050"; // Dapr Sidecar Port of this Example Server
const daprPortActor = "10002"; // Dapr Sidecar Port of the Actor Server
const serverHost = "127.0.0.1"; // App Host of this Example Server
const serverPort = "50051"; // App Port of this Example Server 

import { DaprClient, DaprServer, CommunicationProtocolEnum } from "@dapr/js-sdk";

// HTTP
const server = new DaprServer(serverHost, serverPort, daprHost, daprPort); 
const client = new DaprClient(daprHost, daprPort);

// GRPC 
const server = new DaprServer(serverHost, serverPort, daprHost, daprPort, CommunicationProtocolEnum.GRPC); 
const client = new DaprClient(daprHost, daprPort, CommunicationProtocolEnum.GRPC);
```

## Building blocks

The JavaScript SDK allows you to interface with all of the [Dapr building blocks]({{< ref building-blocks >}}).

### Invoke a service

```javascript
import { DaprClient, DaprServer } from "@dapr/js-sdk"; 

const daprHost = "127.0.0.1"; 
const daprPort = "50050"; 
const serverHost = "127.0.0.1";
const serverPort = "50051";

async function start() {
  const server = new DaprServer(serverHost, serverPort); 

  //POST listener
  await server.invoker.listen("hello-world", async (data: any) => {
    return { hello: "world received from POST" };
  }, { method: HttpMethod.POST });

  //GET listener
  await server.invoker.listen("hello-world", async () => {
    return { hello: "world received from GET" };
  }, { method: HttpMethod.GET });

  // Start server after instantiating listeners
  await server.startServer();

  const client = new DaprClient(daprHost, daprPort); 

  const serviceAppId = "my-dapr-app-id";
  const serviceMethod = "say-hello";
  
  //POST Request
  const response = await client.invoker.invoke(serviceAppId , serviceMethod , HttpMethod.POST, { hello: "world" });

  //GET Request
  const response = await client.invoker.invoke(serviceAppId , serviceMethod , HttpMethod.GET);
}
```
- For a full guide on service invocation visit [How-To: Invoke a service]({{< ref howto-invoke-discover-services.md >}}).

### Save & get application state

```javascript
import { DaprClient } from "@dapr/js-sdk"; 

const daprHost = "127.0.0.1"; 
const daprPort = "50050"; 

async function start() {
  const client = new DaprClient(daprHost, daprPort); 

  const serviceStoreName = "my-dapr-state-store";

  //Save state
  const response = await client.state.save(serviceStoreName, [
    {
      key: "first-key-name",
      value: "Hello"
    },
    {
      key: "second-key-name",
      value: "World!"
    }
  ]);

  //Get State
  const response = await client.state.get(serviceStoreName, "first-key-name");

  //Get Bulk State
  const response = await client.state.getBulk(serviceStoreName, ["first-key-name", "second-key-name"]);

  //Delete State
  const response = await client.state.delete(serviceStoreName, "first-key-name");
}
```
- For a full list of state operations visit [How-To: Get & save state]({{< ref howto-get-save-state.md >}}).

### Publish & subscribe to messages

##### Publish messages

```javascript
import { DaprClient } from "@dapr/js-sdk"; 

const daprHost = "127.0.0.1"; 
const daprPort = "50050"; 

async function start() {
  const client = new DaprClient(daprHost, daprPort);

  const pubSubName = "my-dapr-pubsub";
  const topic = "topic-a";
  const message = { hello: "world" }

  const response = await client.pubsub.publish(pubSubName-redis, topic, message);
}
```

##### Subscribe to messages

```javascript
import { DaprServer } from "@dapr/js-sdk";

const serverHost = "127.0.0.1";
const serverPort = "50051"

async function start() {
  const server = new DaprServer(serverHost, serverPort);

  const pubSubName = "my-dapr-pubsub";
  const topic = "topic-a";

  await server.pubsub.subscribe(pubSubName, topic, async (data: any) => console.log(`Got Data: ${JSON.stringify(data)}`));

  await server.startServer();
}
```

- For a full list of state operations visit [How-To: Publish & subscribe]({{< ref howto-publish-subscribe.md >}}).

### Interact with bindings

**Output Bindings**
```javascript
import { DaprClient } from "@dapr/js-sdk"; 

const daprHost = "127.0.0.1"; 
const daprPort = "50050"; 

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
import { DaprServer } from "@dapr/js-sdk";;

const serverHost = "127.0.0.1";
const serverPort = "50051";

async function start() {
  const server = new DaprServer(serverHost, serverPort);

  const bindingName = "my-binding-name";

  const response = await server.binding.receive(bindingName, async (data: any) => console.log(`Got Data: ${JSON.stringify(data)}`));

  await server.startServer();
}
```

- For a full guide on output bindings visit [How-To: Use bindings]({{< ref howto-bindings.md >}}).

### Retrieve secrets

```javascript
import { DaprClient } from "@dapr/js-sdk"; 

const daprHost = "127.0.0.1"; 
const daprPort = "50050"; 

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

### Actors
An actor is an isolated, independent unit of compute and state with single-threaded execution. Dapr provides an actor implementation based on the [Virtual Actor pattern](https://www.microsoft.com/en-us/research/project/orleans-virtual-actors/), which provides a single-threaded programming model and where actors are garbage collected when not in use. With Dapr's implementaiton, you write your Dapr actors according to the Actor model, and Dapr leverages the scalability and reliability that the underlying platform provides. 

```javascript
```

- For a full guide on actors visit [How-To: Use virtual actors in Dapr]({{< ref howto-actors.md >}}).

## Related links
- [JavaScript SDK examples](https://github.com/dapr/js-sdk/tree/master/examples)