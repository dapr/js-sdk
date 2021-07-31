import { DaprServer, HttpMethod } from "@dapr/js-sdk";

const serverHost = "127.0.0.1";
const serverPort = "4000";

async function start() {
  const server = new DaprServer(serverHost, serverPort);
  await server.startServer();

  await server.invoker.listen("hello-world", async (data: any) => {
    console.log("[Dapr-JS][Example] Received Hello World Method Call");
    console.log(`[Dapr-JS][Example] Data: ${JSON.stringify(data.body)}`);
    console.log(`[Dapr-JS][Example] Replying to the client`);
    return { hello: "world received" };
  }, { method: HttpMethod.POST });
}

start().catch((e) => {
    console.error(e);
    process.exit(1);
});