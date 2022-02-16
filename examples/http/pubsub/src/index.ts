import { DaprServer, DaprClient } from "dapr-client";

const daprHost = "127.0.0.1";
const daprPort = "50000"; // Dapr Sidecar Port of this Example Server
const serverHost = "127.0.0.1"; // App Host of this Example Server
const serverPort = "50001"; // App Port of this Example Server

async function start() {
  // Create a Server (will subscribe) and Client (will publish)
  const server = new DaprServer(serverHost, serverPort, daprHost, daprPort);
  const client = new DaprClient(daprHost, daprPort);

  // Initialize the server to subscribe (listen)
  await server.pubsub.subscribe("my-pubsub-component", "my-topic", async (data: any) => console.log(`Received: ${JSON.stringify(data)}`));
  await server.start();

  // Send a message
  await client.pubsub.publish("my-pubsub-component", "my-topic", { hello: "world" });
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});