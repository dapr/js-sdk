---
type: docs
title: "JavaScript SDK for Actors"
linkTitle: "Actors"
weight: 1000
description: How to get up and running with Actors using the Dapr JavaScript SDK
---

The Dapr actors package allows you to interact with Dapr virtual actors from a JavaScript application. The examples below demonstrate how to use the JavaScript SDK for interacting with virtual actors.

For a more in-depth overview of Dapr actors, visit the [actors overview page]({{< ref actors-overview >}}).

## Pre-requisites
- [Dapr CLI]({{< ref install-dapr-cli.md >}}) installed
- Initialized [Dapr environment]({{< ref install-dapr-selfhost.md >}})
- [Latest LTS version of Node or greater](https://nodejs.org/en/) d
- [JavaScript NPM package installed](https://www.npmjs.com/package/dapr-client)

## Scenario
The below code examples loosely describe the scenario of a Parking Garage Spot Monitoring System, which can be seen in this [video] by Mark Russinovich(https://www.youtube.com/watch?v=eJCu6a-x9uo&t=3785). 

A parking garage consists of hundreds of parking spaces, where each parking space includes a sensor that provides updates to a centralized monitoring system. The parking space sensors (our actors) detect if a parking space is occupied, or available.

To jump in and run this example yourself, clone the source code, which can be found in the [JavaScript SDK examples directory](https://github.com/dapr/js-sdk/tree/master/examples/http/actor-parking-sensor).

## Actor Interface 
The actor interface defines the contract that is shared between the actor implementation and the clients calling the actor. In the example below, we have created an interace for a parking garage sensor. Each sensor has 2 methods: `carEnter` and `carLeave`, which defines the state of the parking space:

```javascript
export default interface ParkingSensorInterface {
  carEnter(): Promise<void>;
  carLeave(): Promise<void>;
}
```

## Actor Implementation
An actor implementation defines a class by extending the base type `AbstractActor` and implements the actor interface. The following code describes what an actor implmentation consists of by implementing the methods defined in the `ParkingSensorInterface`. It also defines a few extra helper methods:

```javascript
import { AbstractActor } from "dapr-client";
import ParkingSensorInterface from "./ParkingSensorInterface";

export default class ParkingSensorImpl extends AbstractActor implements ParkingSensorInterface {
  async carEnter(): Promise<void> {
    // Implementation that updates state that this parking spaces is occupied.
  }

  async carLeave(): Promise<void> {
    // Implementation that updates state that this parking spaces is available.
  }

  async getParkingSpaceUpdate(): Promise<object> {
    // Implementation of requesting an update from the parking space sensor.
  }

  async onActivate(): Promise<void> {
    // Initialization logic called by AbstractActor.
  }
}
```

## Registering Actors
Initialize and register your actors by using the DaprServer package:

```javascript
import { DaprServer } from "dapr-server";
import ParkingSensorImpl from "./ParkingSensorImpl";

async function start() {
  const server = new DaprServer(`server-host`, `server-port`, `dapr-host`, `dapr-port`);

  await server.actor.init(); // Let the server know we need actors
  server.actor.registerActor(ParkingSensorImpl); // Register the actor
  await server.startServer(); // Start the server
}
```                                              

## Invoking Actors
After Actors are registered, use the DaprClient to invoke methods on an actor. The client will call the actor methods defined in the actor interface.

```javascript
import { DaprClient, DaprServer } from "dapr-client";
import ParkingSensorImpl from "./ParkingSensorImpl";

async function start() {
  const server = new DaprServer(`server-host`, `server-port`, `dapr-host`, `dapr-port`);
  const client = new DaprClient(`dapr-host`, `dapr-port`);

  await server.actor.init(); 
  server.actor.registerActor(ParkingSensorImpl); 
  await server.startServer();


  await client.actor.invoke("PUT", ParkingSensorImpl.name, `actor-id`, "carEnter"); // Invoke the ParkingSensor Actor by calling the carEnter function
}
```

## Saving and Getting State 

```javascript
import { DaprClient, DaprServer } from "dapr-client";
import ParkingSensorImpl from "./ParkingSensorImpl";

async function start() {
  const server = new DaprServer(`server-host`, `server-port`, `dapr-host`, `dapr-port`);
  const client = new DaprClient(`dapr-host`, `dapr-port`);

  await server.actor.init(); 
  server.actor.registerActor(ParkingSensorImpl); 
  await server.startServer();

  // Perform state transaction
  await client.actor.stateTransaction("ParkingSensorImpl", `actor-id`, [
    {
      operation: "upsert",
      request: {
        key: "parking-sensor-location-lat",
        value: "location-x"
      }
    },
    {
      operation: "upsert",
      request: {
        key: "parking-sensor-location-lang",
        value: "location-y"
      }
    }
  ]);

  // GET state from an actor
  await client.actor.stateGet("ParkingSensorImpl", `actor-id`, `parking-sensor-location-lat`)
  await client.actor.stateGet("ParkingSensorImpl", `actor-id`, `parking-sensor-location-lang`)
}
...
```

## Actor Timers and Reminders
The JS SDK supports actors that can schedule periodic work on themselves by registering either timers or reminders. The main difference between timers and reminders is that the Dapr actor runtime is not retaining any information about timers after deactivation, while persisting the information about reminders using the Dapr actor state provider.

This distintcion allows users to trade off between light-weight but stateless timers vs. more resource-demanding but stateful reminders.

The scheduling interface of timers and reminders is identical. For an more in-depth look at the scheduling configurations see the [actors timers and reminders docs]({{< ref "howto-actors.md#actor-timers-and-reminders" >}}).

### Actor Timers
```javascript
import { DaprClient, DaprServer } from "dapr-client";
import ParkingSensorImpl from "./ParkingSensorImpl";

async function start() 
  const server = new DaprServer(`server-host`, `server-port`, `dapr-host`, `dapr-port`);
  const client = new DaprClient(`dapr-host`, `dapr-port`);

  await server.actor.init(); 
  server.actor.registerActor(ParkingSensorImpl); 
  await server.startServer();

  // Register a timer
  await client.actor.timerCreate(ParkingSensorImpl.name, `actor-id`, `timer-id`, {
    callback: "method-to-excute-on-actor",
    dueTime: Temporal.Duration.from({ seconds: 2 }),
    period: Temporal.Duration.from({ seconds: 1 })
  });

  // Delete the timer
  await client.actor.timerDelete(ParkingSensorImpl.name, `actor-id`, `timer-id`);
}
```

### Actor Reminders
```javascript
import { DaprClient, DaprServer } from "dapr-client";
import ParkingSensorImpl from "./ParkingSensorImpl";

async function start() 
  const server = new DaprServer(`server-host`, `server-port`, `dapr-host`, `dapr-port`);
  const client = new DaprClient(`dapr-host`, `dapr-port`);

  await server.actor.init(); 
  server.actor.registerActor(ParkingSensorImpl); 
  await server.startServer();


  // Register a reminder, it has a default callback
  await client.actor.reminderCreate(DemoActorImpl.name, `actor-id`, `timer-id`, {
    dueTime: Temporal.Duration.from({ seconds: 2 }),
    period: Temporal.Duration.from({ seconds: 1 }),
    data: 100
  });

  // Delete the reminder
  await client.actor.reminderDelete(DemoActorImpl.name, `actor-id`, `timer-id`);
}
```

- For a full guide on actors visit [How-To: Use virtual actors in Dapr]({{< ref howto-actors.md >}}).