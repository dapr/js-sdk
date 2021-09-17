---
type: docs
title: "JavaScript SDK for Actors"
linkTitle: "Actors"
weight: 1000
description: JavaScript SDK package for Actors
---

### Actors

```javascript
import { DaprServer, DaprClient, HttpMethod } from "dapr-client";
import DemoActorCounterImpl from "./actor/DemoActorCounterImpl";
import DemoActorReminderImpl from "./actor/DemoActorReminderImpl";
import DemoActorSayImpl from "./actor/DemoActorSayImpl";
import DemoActorTimerImpl from "./actor/DemoActorTimerImpl";

const daprHost = "127.0.0.1";
const daprPort = "50000"; // Dapr Sidecar Port of this Example Server
const serverHost = "127.0.0.1"; // App Host of this Example Server
const serverPort = "50001"; // App Port of this Example Server

async function start() {
  const server = new DaprServer(serverHost, serverPort, daprHost, daprPort);
  const client = new DaprClient(daprHost, daprPort);

  // Creating actor bindings
  await server.actor.init();
  server.actor.registerActor(DemoActorCounterImpl);
  server.actor.registerActor(DemoActorSayImpl);
  server.actor.registerActor(DemoActorTimerImpl);
  server.actor.registerActor(DemoActorReminderImpl);

  // We initialize after registering our listeners since these should be defined upfront
  // this is how Dapr works, it waits until we are listening on the port. Once that is detected
  // it will scan the binding list and pubsub subscriptions list to process
  await server.startServer();

  console.log("===============================================================");
  console.log("EXECUTING CLIENT - ACTORS");
  console.log("Note: we create new client for now since Actors are not supported internally!")
  console.log("===============================================================");


  const resRegisteredActors = await server.actor.getRegisteredActors();
  console.log(`Registered Actor Types: ${JSON.stringify(resRegisteredActors)}`);
```

- For a full guide on actors visit [How-To: Use virtual actors in Dapr]({{< ref howto-actors.md >}}).