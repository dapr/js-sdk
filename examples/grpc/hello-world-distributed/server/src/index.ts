import { DaprServer, HttpMethod, CommunicationProtocolEnum } from "../../../../../build";

const daprHost = "127.0.0.1";
const daprPort = "50050"; // Dapr Sidecar Port of this Example Server
const serverHost = "127.0.0.1"; // App Host of this Example Server
const serverPort = "50051"; // App Port of this Example Server

async function start() {
  const server = new DaprServer(serverHost, serverPort, daprHost, daprPort, CommunicationProtocolEnum.GRPC);
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