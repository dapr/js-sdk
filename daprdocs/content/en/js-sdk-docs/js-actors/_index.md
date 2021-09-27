---
type: docs
title: "JavaScript SDK for Actors"
linkTitle: "Actors"
weight: 1000
description: How to get up and running with Actors using the Dapr JavaScript SDK
---

The Dapr actor package allows you to interact with Dapr virtual actors from a Python application. The below examples demonstarte how to use virtual actors through the Python SDK. 

For a more indepth overview of Dapr actors and  supported scenarios, visit the [actors overview]({{< ref actors-overview >}}) page.

## Pre-requisites
- [Dapr CLI]({{< ref install-dapr-cli.md >}}) installed
- Initialized [Dapr environment]({{< ref install-dapr-selfhost.md >}})
- [Latest LTS version of Node or greater](https://nodejs.org/en/) d
- [JavaScript NPM package installed](https://www.npmjs.com/package/dapr-client)

## Actor Interface 
The actor interface defines the contract that is shared between the actor implementation and the clients calling the actor.

```javascript
export default interface ActorSayInterface {
    sayString(msg: string): string;
}
```

## Actor Implementation
An actor service hosts the virtual actor. It defines a class by extending the base type Actor and implements the interfaces defined in the actor interface.

```javascript
import { AbstractActor } from "dapr-client";
import ActorSayMsgInterface from "./ActorSayMsgInterface";

export default class ActorSayMsgImp extends AbstractActor implements ActorSayMsgInterface {
    say(msg: string): string {
        return `Actor said: "${msg}"`;
    }
}
```

## Invoking Actors
An actor client contains the implementation of the actor client which calls the actor methods defined in the actor interface.

```javascript
import { DaprServer, DaprClient, HttpMethod } from "dapr-client";
import ActorSayMsgImp from "./actor/ActorSayMsgImp";

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
  server.actor.registerActor(ActorSayMsgImp);

  const actorId = "actor-id";
  const timerId = "actor-timer-id";

  await server.startServer();

  // Invoke method 'say' with msg 'Hello World'");
  const resActorInvokeSay = await client.actor.invoke("PUT", ActorSayMsgImp.name, actorId, "method-to-invoke", "Hello World");
}
```

## Actor Timers and Reminders
The JS SDK supports actors that can schedule periodic work on themselves by registering either timers or reminders..

The scheduling interface of timers and reminders is identical. 

### Actor Timers
```javascript
import { DaprServer, DaprClient } from "dapr-client";
import ActorTimerImpl from "./actor/ActorTimerImpl";

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
  server.actor.registerActor(ActorTimerImpl);
  await server.startServer();

  const actorId = "actor-id";
  const timerId = "actor-timer-id";

  // Activate actor
  await client.actor.invoke("PUT", ActorTimerImpl.name, actorId, "init");

  // Register a timer
  await client.actor.timerCreate(ActorTimerImpl.name, actorId, timerId, {
    callback: "method-to-excute-on-actor", 
    dueTime: Temporal.Duration.from({ seconds: 2 }),
    period: Temporal.Duration.from({ seconds: 1 })
  });

  // Stop the timer
  await client.actor.timerDelete(ActorTimerImpl.name, actorId, timerId);
}
```

### Actor Reminders
```javascript
import { DaprServer, DaprClient } from "dapr-client";
import ActorTimerImpl from "./actor/ActorSayImpl";

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
  server.actor.registerActor(ActorCounterImpl);
  await server.startServer();

  const actorId = "actor-id";
  const timerId = "actor-timer-id";

  // Activate our actor
  await client.actor.invoke("PUT", ActorReminderImpl.name, actorId, "init");

  // Register a reminder, it has a default callback
  await client.actor.reminderCreate(ActorReminderImpl.name, actorId, reminderId, {
    dueTime: Temporal.Duration.from({ seconds: 2 }),
    period: Temporal.Duration.from({ seconds: 1 }),
    data: 100
  });

  const res0 = await client.actor.invoke("PUT", ActorReminderImpl.name, actorId, "getCounter");
  await client.actor.reminderDelete(ActorReminderImpl.name, actorId, reminderId);
```

- For a full guide on actors visit [How-To: Use virtual actors in Dapr]({{< ref howto-actors.md >}}).