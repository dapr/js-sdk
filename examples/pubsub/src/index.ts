import { DaprServer, DaprClient, CommunicationProtocolEnum } from "@dapr/dapr";

// Common settings
const serverHost = "127.0.0.1"; // App Host of this Example Server
const daprHost = "127.0.0.1";
const serverPort = "50051"; // App Port of this Example Server

async function start() {
  // Note that the DAPR_HTTP_PORT and DAPR_GRPC_PORT environment variables are set by DAPR itself. https://docs.dapr.io/reference/environment/
  const server = new DaprServer(
    serverHost,
    serverPort,
    daprHost,
    process.env.DAPR_HTTP_PORT,
  );

  const client = new DaprClient(
    daprHost,
    process.env.DAPR_HTTP_PORT,
  );

  // Initialize the subscription. Note that this must be done BEFORE calling .start()
  await server.pubsub.subscribe("my-pubsub-component", "my-topic", async (data: Record<string, any>) => {
    // The library parses JSON when possible.
    console.log(`[Dapr-JS][Example] Received on subscription: ${JSON.stringify(data)}`)
  });
  await server.start();

  // Publish a message
  console.log("[Dapr-JS][Example] Publishing message")

  // Internally, the message will be serialized using JSON.stringify()
  await client.pubsub.publish("my-pubsub-component", "my-topic", { hello: "world" });
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});