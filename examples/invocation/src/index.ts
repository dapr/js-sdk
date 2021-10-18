import { DaprServer, DaprClient, HttpMethod, CommunicationProtocolEnum } from "dapr-client";

// Common settings
const daprAppId = "example-invocation";
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
    CommunicationProtocolEnum.HTTP
  );

  const client = new DaprClient(
    daprHost, 
    process.env.DAPR_HTTP_PORT as string, 
    CommunicationProtocolEnum.HTTP
  );

  await server.startServer();

  console.log("Setting up invocation endpoints")
  await server.invoker.listen("hello-world", async (data: any) => {
    console.log(`Received: ${JSON.stringify(data.body)} on POST hello-world`);
    return { hello: "world received from POST" };
  }, { method: HttpMethod.POST });

  await server.invoker.listen("hello-world", async () => {
    console.log("Received on GET hello-world");
    return { hello: "world received from GET" };
  }, { method: HttpMethod.GET });

  console.log("Invoking endpoints")
  const r = await client.invoker.invoke(daprAppId, "hello-world", HttpMethod.POST, {
    hello: "world"
  });
  console.log(`Response to POST request: ${JSON.stringify(r)}`);
  const r2 = await client.invoker.invoke(daprAppId, "hello-world", HttpMethod.GET);
  console.log(`Response to GET request: ${JSON.stringify(r2)}`);
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});