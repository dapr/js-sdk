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
- [Node version 15 or greater](https://nodejs.org/en/) 

## Installing and importing Dapr's JS SDK


Install the SDK with npm:
```
npm i @roadwork/dapr-js-sdk
```

Import the libraries for the the given protocol you're using:  

```javascript
import { DaprClient, DaprServer } from "@roadwork/dapr-js-sdk/http";
// OR (depending on the protocol)
import { DaprClient, DaprServer } from "@roadwork/dapr-js-sdk/grpc";
```

## Building blocks

The JavaScript SDK allows you to interface with all of the [Dapr building blocks]({{< ref building-blocks >}}).

### Invoke a service

```javascript
import { DaprClient, HttpMethod } from "@roadwork/dapr-js-sdk/http";

const daprHost = "127.0.0.1";
const daprPort = "50050"; 

async function start() {
  const client = new DaprClient(daprHost, daprPort);

  //POST Request
  const response = await client.invoker.invoke(SERVICE_TO_INVOKE, METHOD_TO_INVOKE, HttpMethod.POST, {
    name: "World!"
  });

  //GET Request
  const response = await client.invoker.invoke(SERVICE_TO_INVOKE, METHOD_TO_INVOKE, HttpMethod.GET);
}
```
- For a full guide on service invocation visit [How-To: Invoke a service]({{< ref howto-invoke-discover-services.md >}}).

### Save & get application state

```javascript
import { DaprClient } from "@roadwork/dapr-js-sdk/http";

const daprHost = "127.0.0.1";
const daprPort = "50050"; 

async function start() {
  const client = new DaprClient(daprHost, daprPort);

  //Save state
  const response = await client.state.save(STATE_STORE_NAME, [
    {
      key: FIRST_KEY_NAME 
      value: FIRST_VALUE
    },
    {
      key: SECOND_KEY_NAME,
      value: SECOND_VALUE
    },
    {
      key: THIRD_KEY_NAME
      value: THIRD_VALUE
    }
  ]);

  //Get State
  const response = await client.state.get(STATE_STORE_NAME, FIRST_KEY_NAME);

  //Get Bulk State
  const response = await client.state.getBulk(STATE_STORE_NAME, [ FIRST_KEY_NAME, SECOND_KEY_NAME ]);

  //Delete State
  const response = await client.state.delete(STATE_STORE_NAME, FIRST_KEY_NAME);
}
```
- For a full list of state operations visit [How-To: Get & save state]({{< ref howto-get-save-state.md >}}).

### Publish & subscribe to messages

##### Publish messages

```javascript
import { DaprClient } from "@roadwork/dapr-js-sdk/http";

const daprHost = "127.0.0.1";
const daprPort = "50050"; 

async function start() {
  const client = new DaprClient(daprHost, daprPort);

  const response = await client.pubsub.publish(PUBSUB_NAME, TOPIC_NAME, { messsage });
}
```

##### Subscribe to messages

```javascript
import { DaprClient } from "@roadwork/dapr-js-sdk/http";

const daprHost = "127.0.0.1";
const daprPort = "50050"; 

async function start() {
  const client = new DaprClient(daprHost, daprPort);

  const response = await server.pubsub.subscribe(PUBSUB_NAME, TOPIC_NAME, async (data) => console.log(`Got Data: ${JSON.stringify(data)}`));
}
```

- For a full list of state operations visit [How-To: Publish & subscribe]({{< ref howto-publish-subscribe.md >}}).

### Interact with bindings

**Output Bindings**
```javascript
import { DaprClient } from "@roadwork/dapr-js-sdk/http";

const daprHost = "127.0.0.1";
const daprPort = "50050"; 

async function start() {
  const client = new DaprClient(daprHost, daprPort);

  const response = await client.binding.send(BINDING_NAME, BINDING_OPERATION, { message });
}
```

**Input Bindings**
```javascript
import { DaprServer } from "@roadwork/dapr-js-sdk/http";

const daprHost = "127.0.0.1";
const daprPort = "50050"; 
const daprInternalServerPort = "50051"; // App Port of this Example Server

async function start() {
  const server = new DaprServer(daprHost, daprPort, daprInternalServerPort);

  const response = await server.binding.receive(BINDING_NAME, async (data) => console.log(`Got Data: ${JSON.stringify(data)}`));
}
```

- For a full guide on output bindings visit [How-To: Use bindings]({{< ref howto-bindings.md >}}).

### Retrieve secrets

```javascript
import { DaprClient } from "@roadwork/dapr-js-sdk/http";

const daprHost = "127.0.0.1";
const daprPort = "50050"; 

async function start() {
  const client = new DaprClient(daprHost, daprPort);

  //Retrieve a single secret from secret store
  const response = await client.secret.get(SECRET_STORE_NAME, secretKey);

  // Retrieve all secrets from secret store
  const response = await client.secret.getBulk(SECRET_STORE_NAME);
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