---
type: docs
title: "JavaScript SDK for Actors"
linkTitle: "Actors"
weight: 1000
description: How to get up and running with Actors using the Dapr JavaScript SDK
---

The Dapr actors package allows you to interact with Dapr virtual actors from a JavaScript application. The examples below demonstrate how to use the JavaScript SDK for interacting with virtual actors.

For a more in-depth overview of Dapr actors and supported scenarios, visit the [actors overview page]({{< ref actors-overview >}}).

## Pre-requisites
- [Dapr CLI]({{< ref install-dapr-cli.md >}}) installed
- Initialized [Dapr environment]({{< ref install-dapr-selfhost.md >}})
- [Latest LTS version of Node or greater](https://nodejs.org/en/) d
- [JavaScript NPM package installed](https://www.npmjs.com/package/dapr-client)

## Code Scenario
The below code examples loosely describe the scenario of a Parking Garage Spot Monitoring System, which can be explained in detail by Mark Russinovich in [this video](https://www.youtube.com/watch?v=eJCu6a-x9uo&t=3785). The parking garage consists of hundreds of parking spots, where each parking spot includes a sensor that provides updates to a centralized monitoring system. The parking space sensors (our actors) detect if a parking space is occupied, or available.

To run this example, source code can be found [here](https://github.com/XavierGeerinck/js-sdk/tree/23e1f0ee2bd4c60a4906e38427547c4b3840f89e/examples/http/actor-parking-sensor).

## Actor Interface 
The actor interface defines the contract that is shared between the actor implementation and the clients calling the actor. In the example below, we have created an interace for a parking garage sensor. Each sensor has 2 methods: carEnter and carLeave, which defines the state of the sensor:

```javascript
export default interface ParkingSensorInterface {
  carEnter(): Promise<void>;
  carLeave(): Promise<void>;
}
```

## Actor Implementation
An actor implementation defines a class by extending the base type `AbstractActor` and implements the interfaces defined in the actor interface. The example below implements the methods defined in the `ParkingSensorInterface`, but also adds extra helper methods:

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
Use the DaprServer package to create your actors bindings, which will initalize and register your actors. 

```javascript
import { DaprServer, DaprClient } from "dapr-client";
import ParkingSensorImpl from "./ParkingSensorImpl";

const daprHost = "127.0.0.1";
const daprPort = "50000"; // Dapr Sidecar Port of this Example Server
const serverHost = "127.0.0.1"; // App Host of this Example Server
const serverPort = "50001"; // App Port of this Example Server

async function start() {
  const server = new DaprServer(serverHost, serverPort, daprHost, daprPort);

  await server.actor.init(); // Let the server know we need actors
  server.actor.registerActor(ParkingSensorImpl); // Register the actor
  await server.startServer(); // Start the server
```                                              

## Invoking Actors
After Actors are registered, use the DaprClient to invoke methods on an actor. The client will call the actor methods defined in the actor interface.

```javascript
  ...
  // Initialize Dapr client
  const client = new DaprClient(daprHost, daprPort);

  await client.actor.invoke("PUT", ParkingSensorImpl.name, `actor-id`, "carEnter");
  ...
```

## Saving and Getting State 

```javascript
  ...
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


  await client.actor.stateGet("ParkingSensorImpl", `actor-id`, `parking-sensor-location-lat`)
  await client.actor.stateGet("ParkingSensorImpl", `actor-id`, `parking-sensor-location-lang`)
  ...
```

## Actor Timers and Reminders
The JS SDK supports actors that can schedule periodic work on themselves by registering either timers or reminders. The main difference between timers and reminders is that the Dapr actor runtime is not retaining any information about timers after deactivation, while persisting the information about reminders using the Dapr actor state provider.

This distintcion allows users to trade off between light-weight but stateless timers vs. more resource-demanding but stateful reminders.

The scheduling interface of timers and reminders is identical. For an more in-depth look at the scheduling configurations see the [actors timers and reminders docs]({{< ref "howto-actors.md#actor-timers-and-reminders" >}}).

### Actor Timers
```javascript
...
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
// Register a reminder, it has a default callback
await client.actor.reminderCreate(DemoActorImpl.name, `actor-id`, `timer-id`, {
  dueTime: Temporal.Duration.from({ seconds: 2 }),
  period: Temporal.Duration.from({ seconds: 1 }),
  data: 100
});

// Delete the reminder
await client.actor.reminderDelete(DemoActorImpl.name, `actor-id`, `timer-id`);
```

- For a full guide on actors visit [How-To: Use virtual actors in Dapr]({{< ref howto-actors.md >}}).