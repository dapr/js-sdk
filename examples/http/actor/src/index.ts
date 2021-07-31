import { DaprServer, DaprClient, HttpMethod } from "@dapr/js-sdk";
import DemoActorCounterImpl from "./actor/DemoActorCounterImpl";
import DemoActorSayImpl from "./actor/DemoActorSayImpl";

const daprHost = "127.0.0.1";
const daprPort = "50000"; // Dapr Sidecar Port of this Example Server
const serverHost = "127.0.0.1"; // App Host of this Example Server
const serverPort = "50001"; // App Port of this Example Server
const daprAppId = "example-hello-world";

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function start() {
  const server = new DaprServer(serverHost, serverPort);
  const client = new DaprClient(daprHost, daprPort);

  console.log("===============================================================");
  console.log("INITIALIZING")
  console.log("===============================================================");
  // Creating actor bindings
  await server.actor.init();

  // We initialize after registering our listeners since these should be defined upfront
  // this is how Dapr works, it waits until we are listening on the port. Once that is detected
  // it will scan the binding list and pubsub subscriptions list to process
  await server.startServer();

  console.log("===============================================================");
  console.log("EXECUTING CLIENT - ACTORS");
  console.log("Note: we create new client for now since Actors are not supported internally!")
  console.log("===============================================================");
  server.actor.registerActor(DemoActorCounterImpl);
  server.actor.registerActor(DemoActorSayImpl);

  const resRegisteredActors = await server.actor.getRegisteredActors();
  console.log(`Registered Actor Types: ${JSON.stringify(resRegisteredActors)}`);
  
  console.log("[Dapr-JS][Example][Actors] Trying to invoke method 'say' with msg 'hello world'");
  const resActorInvokeSay = await client.actor.invoke("POST", DemoActorSayImpl.name, "MyActorId1", "say", "Hello World");
  console.log(`[Dapr-JS][Example][Actors] Invoked Method and got data: ${resActorInvokeSay}`);

  // const resActorStateGet = await clientActor.actor.stateGet("DemoActor", "MyActorId1", "PropertyA");
  // await clientActor.actor.stateTransaction("DemoActor", "MyActorId1", [
  //   {
  //     operation: "upsert",
  //     request: {
  //       key: "key-1",
  //       value: "my-new-data-1"
  //     }
  //   },
  //   {
  //     operation: "upsert",
  //     request: {
  //       key: "key-to-delete",
  //       value: "my-new-data-1"
  //     }
  //   },
  //   {
  //     operation: "delete",
  //     request: {
  //       key: "key-to-delete"
  //     }
  //   }
  // ]);

  // const resActorStateGet = await clientActor.actor.stateGet("DemoActor", "MyActorId1", "key-to-delete");
  // console.log(`[Dapr-JS][Example][Actors] Get State (should be empty): ${JSON.stringify(resActorStateGet)}`);
  // const resActorStateGet2 = await clientActor.actor.stateGet("DemoActor", "MyActorId1", "key-1");
  // console.log(`[Dapr-JS][Example][Actors] Get State (should be my-new-data-1): ${JSON.stringify(resActorStateGet2)}`);
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});