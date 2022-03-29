import { DaprServer, DaprClient, HttpMethod } from "@dapr/dapr";
import DemoActorCounterImpl from "./actor/DemoActorCounterImpl";
import DemoActorReminderImpl from "./actor/DemoActorReminderImpl";
import DemoActorSayImpl from "./actor/DemoActorSayImpl";
import DemoActorTimerImpl from "./actor/DemoActorTimerImpl";

const daprHost = "127.0.0.1";
const daprPort = "50000"; // Dapr Sidecar Port of this Example Server
const serverHost = "127.0.0.1"; // App Host of this Example Server
const serverPort = "50001"; // App Port of this Example Server
const daprAppId = "example-hello-world";

async function start() {
  const server = new DaprServer(serverHost, serverPort, daprHost, daprPort);
  const client = new DaprClient(daprHost, daprPort);

  console.log("===============================================================");
  console.log("INITIALIZING")
  console.log("===============================================================");
  // Creating actor bindings
  await server.actor.init();
  server.actor.registerActor(DemoActorCounterImpl);
  server.actor.registerActor(DemoActorSayImpl);
  server.actor.registerActor(DemoActorTimerImpl);
  server.actor.registerActor(DemoActorReminderImpl);

  // We initialize after registering our listeners since these should be defined upfront
  // this is how Dapr works, it waits until we are listening on the port. Once that is detected
  // it will scan the binding list and pubsub subscriptions list to process
  await server.start();

  console.log("===============================================================");
  console.log("EXECUTING CLIENT - ACTORS");
  console.log("Note: we create new client for now since Actors are not supported internally!")
  console.log("===============================================================");
  const actorId = "MyActorId1";

  const resRegisteredActors = await server.actor.getRegisteredActors();
  console.log(`Registered Actor Types: ${JSON.stringify(resRegisteredActors)}`);

  console.log("[Dapr-JS][Example][Actors] Trying to invoke method 'say' with msg 'hello world'");
  const actor = client.actor.create<DemoActorSayImpl>(DemoActorSayImpl);
  const resActorInvokeSay = await actor.sayString("Hello World");
  console.log(`[Dapr-JS][Example][Actors] Invoked Method and got data: ${resActorInvokeSay}`);
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});