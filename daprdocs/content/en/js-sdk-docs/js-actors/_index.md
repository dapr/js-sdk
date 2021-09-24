---
type: docs
title: "JavaScript SDK for Actors"
linkTitle: "Actors"
weight: 1000
description: How to get up and running with Actors using the Dapr JavaScript SDK
---

The Dapr actor package allows you to interact with Dapr virtual actors from a Python application.

## Pre-requisites
- [Dapr CLI]({{< ref install-dapr-cli.md >}}) installed
- Initialized [Dapr environment]({{< ref install-dapr-selfhost.md >}})
- [Latest LTS version of Node or greater](https://nodejs.org/en/) d
- [JavaScript NPM package installed](https://www.npmjs.com/package/dapr-client)

## Actor Interface 
The interface defines the actor contract that is shared between the actor implementation and the clients calling the actor. Because a client may depend on it, it typically makes sense to define it in an assembly that is separate from the actor implementation.

```javascript
export default interface DemoActorSayInterface {
    sayString(msg: string): string;
}
```

## Actor Implementation
An actor service hosts the virtual actor. It defines a class by extending the base type Actor and implements the interfaces defined in the actor interface.

```javascript
import { AbstractActor } from "dapr-client";
import DemoActorSayInterface from "./DemoActorSayInterface";

export default class DemoActorSayImpl extends AbstractActor implements DemoActorSayInterface {
    say(msg: string): string {
        return `Actor said: "${msg}"`;
    }
}
```

## Invoking Actors
An actor client contains the implementation of the actor client which calls the actor methods defined in the actor interface.

```javascript
import { DaprServer, DaprClient, HttpMethod } from "dapr-client";
import DemoActorSayImpl from "./actor/DemoActorSayImpl";

const daprHost = "127.0.0.1";
const daprPort = "50000"; // Dapr Sidecar Port of this Example Server
const serverHost = "127.0.0.1"; // App Host of this Example Server
const serverPort = "50001"; // App Port of this Example Server
const daprAppId = "example-hello-world";

async function start() {
  const server = new DaprServer(serverHost, serverPort, daprHost, daprPort);
  const client = new DaprClient(daprHost, daprPort);

  // Creating actor bindings
  await server.actor.init();
  server.actor.registerActor(DemoActorCounterImpl);

  const actorId = "actor-id";
  const timerId = "actor-timer-id";

  await server.startServer();

  // Invoke method 'say' with msg 'Hello World'");
  const resActorInvokeSay = await client.actor.invoke("PUT", DemoActorSayImpl.name, actorId, "method-to-invoke", "Hello World");
}
```

## Actor Timers

```javascript
import { DaprServer, DaprClient } from "dapr-client";
import DemoActorTimerImpl from "./actor/DemoActorSayImpl";

const daprHost = "127.0.0.1";
const daprPort = "50000"; // Dapr Sidecar Port of this Example Server
const serverHost = "127.0.0.1"; // App Host of this Example Server
const serverPort = "50001"; // App Port of this Example Server
const daprAppId = "example-hello-world";

async function start() {
  const server = new DaprServer(serverHost, serverPort, daprHost, daprPort);
  const client = new DaprClient(daprHost, daprPort);

  // Creating actor bindings
  await server.actor.init();
  server.actor.registerActor(DemoActorCounterImpl);
  await server.startServer();

  const actorId = "actor-id";
  const timerId = "actor-timer-id";

  // Activate actor
  await client.actor.invoke("PUT", DemoActorTimerImpl.name, actorId, "init");

  // Register a timer
  await client.actor.timerCreate(DemoActorTimerImpl.name, actorId, timerId, {
    callback: "method-to-excute-on-actor", 
    dueTime: Temporal.Duration.from({ seconds: 2 }),
    period: Temporal.Duration.from({ seconds: 1 })
  });

  // Stop the timer
  await client.actor.timerDelete(DemoActorTimerImpl.name, actorId, timerId);
}
```

## Actor Reminders

- For a full guide on actors visit [How-To: Use virtual actors in Dapr]({{< ref howto-actors.md >}}).