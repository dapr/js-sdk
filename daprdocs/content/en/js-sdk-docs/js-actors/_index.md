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
- [Latest LTS version of Node or greater](https://nodejs.org/en/)
- [JavaScript NPM package installed](https://www.npmjs.com/package/dapr-client)

## Scenario
The below code examples loosely describe the scenario of a Parking Garage Spot Monitoring System, which can be seen in this [video](https://www.youtube.com/watch?v=eJCu6a-x9uo&t=3785) by Mark Russinovich. 

A parking garage consists of hundreds of parking spaces, where each parking space includes a sensor that provides updates to a centralized monitoring system. The parking space sensors (our actors) detect if a parking space is occupied or available.

To jump in and run this example yourself, clone the source code, which can be found in the [JavaScript SDK examples directory](https://github.com/dapr/js-sdk/tree/master/examples/http/actor-parking-sensor).

## Actor Interface 
The actor interface defines the contract that is shared between the actor implementation and the clients calling the actor. In the example below, we have created an interace for a parking garage sensor. Each sensor has 2 methods: `carEnter` and `carLeave`, which defines the state of the parking space:

```ts
export default interface ParkingSensorInterface {
  carEnter(): Promise<void>;
  carLeave(): Promise<void>;
}
```

## Actor Implementation
An actor implementation defines a class by extending the base type `AbstractActor` and implementing the actor interface (`ParkingSensorInterface` in this case). 

The following code describes an actor implementation along with a few helper methods.

```ts
import { AbstractActor } from "dapr-client";
import ParkingSensorInterface from "./ParkingSensorInterface";

export default class ParkingSensorImpl extends AbstractActor implements ParkingSensorInterface {
  async carEnter(): Promise<void> {
    // Implementation that updates state that this parking spaces is occupied.
  }

  async carLeave(): Promise<void> {
    // Implementation that updates state that this parking spaces is available.
  }

  private async getInfo(): Promise<object> {
    // Implementation of requesting an update from the parking space sensor.
  }

  /**
   * @override
   */
  async onActivate(): Promise<void> {
    // Initialization logic called by AbstractActor.
  }
}
```

## Registering Actors
Initialize and register your actors by using the `DaprServer` package:

```javascript
import { DaprServer } from "dapr-server";
import ParkingSensorImpl from "./ParkingSensorImpl";

const daprHost = "127.0.0.1";
const daprPort = "50000";
const serverHost = "127.0.0.1";
const serverPort = "50001";

const server = new DaprServer(serverHost, serverPort, daprHost, daprPort);

await server.actor.init(); // Let the server know we need actors
server.actor.registerActor(ParkingSensorImpl); // Register the actor
await server.start(); // Start the server

// To get the registered actors, you can invoke `getRegisteredActors`:
const resRegisteredActors = await server.actor.getRegisteredActors();
console.log(`Registered Actors: ${JSON.stringify(resRegisteredActors)}`);
```                                              

## Invoking Actor Methods
After Actors are registered, use the `DaprClient` to invoke methods on an actor. The client will call the actor methods defined in the actor interface.

```javascript
import { DaprClient, ActorId } from "dapr-client";
import ParkingSensorImpl from "./ParkingSensorImpl";

const daprHost = "127.0.0.1";
const daprPort = "50000";

const client = new DaprClient(daprHost, daprPort);

// Create a new actor builder. It can be used to create multiple actors of a type.
const builder = new ActorProxyBuilder<ActorSayInterface>(ActorSayImpl, client);

// Create a new actor instance.
const actor = builder.build(new ActorId("my-actor"));
// Or alternatively, use a random ID
// const actor = builder.build(ActorId.createRandomId());

// Invoke the method.
await actor.carEnter();
```

## Using states with Actor

```ts
// ...

const PARKING_SENSOR_PARKED_STATE_NAME = "parking-sensor-parked"

const actor = builder.build(new ActorId("my-actor")) 

// SET state
await actor.getStateManager().setState(PARKING_SENSOR_PARKED_STATE_NAME, true);

// GET state
const value = await actor.getStateManager().getState(PARKING_SENSOR_PARKED_STATE_NAME);
if (value !== null) {
  console.log(`Received: ${value}!`);
}

// DELETE state
await actor.removeState(PARKING_SENSOR_PARKED_STATE_NAME);
...
```

## Actor Timers and Reminders
The JS SDK supports actors that can schedule periodic work on themselves by registering either timers or reminders. The main difference between timers and reminders is that the Dapr actor runtime does not retain any information about timers after deactivation, but persists reminders information using the Dapr actor state provider.

This distinction allows users to trade off between light-weight but stateless timers versus more resource-demanding but stateful reminders.

The scheduling interface of timers and reminders is identical. For an more in-depth look at the scheduling configurations see the [actors timers and reminders docs]({{< ref "howto-actors.md#actor-timers-and-reminders" >}}).

### Actor Timers
```javascript
// ...

const actor = builder.build(new ActorId("my-actor"));

// Register a timer
await actor.registerActorTimer(
  "timer-id", // Unique name of the timer.
  "cb-method", // Callback method to execute when timer is fired.
  Temporal.Duration.from({ seconds: 2 }), // DueTime
  Temporal.Duration.from({ seconds: 1 }), // Period
  Temporal.Duration.from({ seconds: 1 }), // TTL
  50 // State to be sent to timer callback.
);

// Delete the timer
await actor.unregisterActorTimer("timer-id");
```

### Actor Reminders
```javascript
// ...

const actor = builder.build(new ActorId("my-actor"));

// Register a reminder, it has a default callback: `receiveReminder`
await actor.registerActorReminder(
  "reminder-id", // Unique name of the reminder.
  Temporal.Duration.from({ seconds: 2 }), // DueTime
  Temporal.Duration.from({ seconds: 1 }), // Period
  Temporal.Duration.from({ seconds: 1 }), // TTL
  100 // State to be sent to reminder callback.
);

// Delete the reminder
await actor.unregisterActorReminder("reminder-id");
```

To handle the callback, you need to override the default `receiveReminder` implementation in your actor. For example, from our original actor implementation:
```ts
export default class ParkingSensorImpl extends AbstractActor implements ParkingSensorInterface {
  // ...

  /**
   * @override
   */
  async receiveReminder(state: any): Promise<void> {
    // handle stuff here
  }

  // ...
}
```

For a full guide on actors, visit [How-To: Use virtual actors in Dapr]({{< ref howto-actors.md >}}).