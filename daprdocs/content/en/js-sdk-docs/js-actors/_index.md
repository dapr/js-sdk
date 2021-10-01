---
type: docs
title: "JavaScript SDK for Actors"
linkTitle: "Actors"
weight: 1000
description: How to get up and running with Actors using the Dapr JavaScript SDK
---

The Dapr actors package allows you to interact with Dapr virtual actors from a JavaScript application. The below examples demonstarte how to use the JavaScript SDK for interacting with virtual actors.

For a more in-depth overview of Dapr actors and supported scenarios, visit the [actors overview page]({{< ref actors-overview >}}).

## Pre-requisites
- [Dapr CLI]({{< ref install-dapr-cli.md >}}) installed
- Initialized [Dapr environment]({{< ref install-dapr-selfhost.md >}})
- [Latest LTS version of Node or greater](https://nodejs.org/en/) d
- [JavaScript NPM package installed](https://www.npmjs.com/package/dapr-client)

## Actor Interface 
The actor interface defines the contract that is shared between the actor implementation and the clients calling the actor.

```javascript
export default interface ActorSayInterface {
    say(msg: string): string;
}
```

## Actor Implementation
An actor implementation defines a class by extending the base type `AbstractActor` and implements the interfaces defined in the actor interface.

```javascript
import { AbstractActor } from "dapr-client";
import ActorSayInterface from "./ActorSayInterface";

export default class ActorSayImp extends AbstractActor implements ActorSayInterface {
    say(msg: string): string {
        return `Actor said: "${msg}"`;
    }
}
```

## Invoking Actors
Use the DaprServer package to create your actors bindings, which will initalize and register your actors. After Actors are registered, use the DaprClient to invoke methods on an actor. The will client call the actor methods defined in the actor interface.

```javascript
import { DaprServer, DaprClient } from "dapr-client";
import ActorSayImp from "./actor/ActorSayImp";

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
  server.actor.registerActor(ActorSayImp);

  const actorId = "actor-id";
  const timerId = "actor-timer-id";

  await server.startServer();

  // Invoke method 'say' with msg 'Hello World'");
  const resActorInvokeSay = await client.actor.invoke("PUT", ActorSayImp.name, actorId, "method-to-invoke", "Hello World");
}
```

## Saving and Getting State 

```javascript
import { DaprServer, DaprClient } from "dapr-client";
import DemoActor from "./actor/DemoActor";

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
  server.actor.registerActor(DemoActor);
  await server.startServer();

  const actorId = "actor-id";

  await client.actor.stateTransaction("DemoActor", actorId, [
    {
      operation: "upsert",
      request: {
        key: "key-1",
        value: "my-new-data-1"
      }
    },
    {
      operation: "upsert",
      request: {
        key: "key-to-delete",
        value: "my-new-data-1"
      }
    },
    {
      operation: "delete",
      request: {
        key: "key-to-delete"
      }
    }
  ]);

  const ActorStateGet = await client.actor.stateGet("DemoActor", actorId, "key-to-delete");
}
```

## Actor Timers and Reminders
The JS SDK supports actors that can schedule periodic work on themselves by registering either timers or reminders. The main difference between timers and reminders is that the Dapr actor runtime is not retaining any information about timers after deactivation, while persisting the information about reminders using the Dapr actor state provider.

This distintcion allows users to trade off between light-weight but stateless timers vs. more resource-demanding but stateful reminders.

The scheduling interface of timers and reminders is identical. For an more in-depth look at the scheduling configurations see the [actors timers and reminders docs]({{< ref "howto-actors.md#actor-timers-and-reminders" >}}).

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
import ActorReminderImpl from "./actor/ActorReminderImpl";

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
  server.actor.registerActor(ActorReminderImpl);
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