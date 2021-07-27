import { DaprServer, DaprClient, HttpMethod } from "@roadwork/dapr-js-sdk/http";

const daprHost = "127.0.0.1";
const daprPort = "50050"; // Dapr Sidecar Port of this Example Server
const daprPortActor = "10002"; // Dapr Sidecar Port of the Actor Server
const daprInternalServerPort = "50051"; // App Port of this Example Server
const daprAppId = "example-hello-world";

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function start() {
  const server = new DaprServer(daprHost, daprPort, daprInternalServerPort);
  const client = new DaprClient(daprHost, daprPort);
  const clientActor = new DaprClient(daprHost, daprPortActor);

  console.log("===============================================================");
  console.log("REGISTERING SERVER HANDLERS")
  console.log("===============================================================");
  await server.binding.receive("binding-mqtt", async (data) => console.log(`[Dapr-JS][Example][Binding Receive] Got Data: ${JSON.stringify(data)}`));
  await server.pubsub.subscribe("pubsub-redis", "test-topic", async (data) => console.log(`[Dapr-JS][Example][PubSub Subscribe] Got Data: ${JSON.stringify(data)}`));

  console.log("===============================================================");
  console.log("INITIALIZING")
  console.log("===============================================================");
  // We initialize after registering our listeners since these should be defined upfront
  // this is how Dapr works, it waits until we are listening on the port. Once that is detected
  // it will scan the binding list and pubsub subscriptions list to process
  await server.startServer();

  console.log("===============================================================");
  console.log("EXECUTING CLIENT -INVOKER")
  console.log("===============================================================");
  await server.invoker.listen("hello-world", async (data: any) => {
    console.log("[Dapr-JS][Example] POST /hello-world");
    console.log(`[Dapr-JS][Example] Received: ${JSON.stringify(data.body)}`);
    console.log(`[Dapr-JS][Example] Replying to Client`);
    return { hello: "world received from POST" };
  }, { method: HttpMethod.POST });

  await server.invoker.listen("hello-world", async () => {
    console.log("[Dapr-JS][Example] GET /hello-world");
    console.log(`[Dapr-JS][Example] Replying to Client`);
    return { hello: "world received from GET" };
  }, { method: HttpMethod.GET });

  const r = await client.invoker.invoke(daprAppId, "hello-world", HttpMethod.POST, {
    hello: "world"
  });
  console.log(r);
  const r2 = await client.invoker.invoke(daprAppId, "hello-world", HttpMethod.GET);
  console.log(r2);

  // Now we can use the direct methods
  console.log("===============================================================");
  console.log("EXECUTING CLIENT - BINDING/PUBSUB");
  console.log("===============================================================");
  await client.binding.send("binding-mqtt", "create", { hello: "world" });
  console.log(`[Dapr-JS][Example][Binding] Executed Binding for binding-mqtt`);
  await client.pubsub.publish("pubsub-redis", "test-topic", { hello: "world" });
  console.log(`[Dapr-JS][Example][PubSub] Published to pubsub pubsub-redis on topic "test-topic"`);

  await sleep(500); // wait a bit to receive the messages

  console.log("===============================================================");
  console.log("EXECUTING CLIENT - SECRETS");
  console.log("===============================================================");
  const resSecret = await client.secret.get("secret-envvars", "TEST_SECRET_1");
  console.log(`[Dapr-JS][Example][Secret] Fetched Secret: ${JSON.stringify(resSecret)}`);

  const resSecrets = await client.secret.getBulk("secret-envvars");
  console.log(`[Dapr-JS][Example][Secret] Fetched Secret: ${JSON.stringify(resSecrets)}`);

  console.log("===============================================================");
  console.log("EXECUTING CLIENT - STATE");
  console.log("===============================================================");
  console.log("[Dapr-JS][Example][State] Saving State");
  await client.state.save("state-redis", [
    {
      key: "key-1",
      value: "value-1"
    },
    {
      key: "key-2",
      value: "value-2"
    },
    {
      key: "key-3",
      value: "value-3"
    }
  ]);

  const resState = await client.state.get("state-redis", "key-1");
  console.log(`[Dapr-JS][Example][State] Fetched State: ${JSON.stringify(resState)}`);

  const resStateBulk = await client.state.getBulk("state-redis", [ "key-3", "key-2"]);
  console.log(`[Dapr-JS][Example][State] Fetched State Bulk: ${JSON.stringify(resStateBulk)}`);

  await client.state.delete("state-redis", "key-2");
  const resStateDelete = await client.state.get("state-redis", "key-2");
  console.log(`[Dapr-JS][Example][State] Deleted State "key-2" ${JSON.stringify(resStateDelete)}`);

  // After the above we have key-1 and key-3 left. Let's change key-1 to my-new-data-1 and delete key-3
  await client.state.transaction("state-redis", [
    {
      operation: "upsert",
      request: {
        key: "key-1",
        value: "my-new-data-1"
      }
    },
    {
      operation: "delete",
      request: {
        key: "key-3"
      }
    }
  ]);
  const resTransactionDelete = await client.state.get("state-redis", "key-3");
  const resTransactionUpsert = await client.state.get("state-redis", "key-1");
  console.log(`[Dapr-JS][Example][State] Transaction changed key-1 to: ${JSON.stringify(resTransactionUpsert)} and deleted key-3: ${JSON.stringify(resTransactionDelete)}`);

  console.log("===============================================================");
  console.log("EXECUTING CLIENT - ACTORS");
  console.log("Note: we create new client for now since Actors are not supported internally!")
  console.log("===============================================================");
  await clientActor.actor.invoke("POST", "DemoActor", "MyActorId1", "SetDataAsync", { PropertyA: "hello", PropertyB: "world", ToNotExistKey: "this should not exist since we only have PropertyA and PropertyB" });
  const resActorInvoke = await clientActor.actor.invoke("GET", "DemoActor", "MyActorId1", "GetDataAsync"); // will only return PropertyA and PropertyB since these are the only properties that can be set
  console.log(`[Dapr-JS][Example][Actors] Invoked Method and got data: ${JSON.stringify(resActorInvoke)}`);

  await clientActor.actor.stateTransaction("DemoActor", "MyActorId1", [
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

  const resActorStateGet = await clientActor.actor.stateGet("DemoActor", "MyActorId1", "key-to-delete");
  console.log(`[Dapr-JS][Example][Actors] Get State (should be empty): ${JSON.stringify(resActorStateGet)}`);
  const resActorStateGet2 = await clientActor.actor.stateGet("DemoActor", "MyActorId1", "key-1");
  console.log(`[Dapr-JS][Example][Actors] Get State (should be my-new-data-1): ${JSON.stringify(resActorStateGet2)}`);

  const resActorsGetAll = await clientActor.actor.getActors();
  console.log(resActorsGetAll)
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});