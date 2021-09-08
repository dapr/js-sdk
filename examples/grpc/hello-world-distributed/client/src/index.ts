import { CommunicationProtocolEnum, DaprClient, HttpMethod } from "../../../../../build";

const daprHost = "127.0.0.1";
const daprPort = "3500";
const daprAppId = "my-server";

async function start() {
  const client = new DaprClient(daprHost, daprPort, CommunicationProtocolEnum.GRPC);

  const res = await client.invoker.invoke(daprAppId, "hello-world", HttpMethod.POST, {
    hello: "world"
  });
  console.log(`[Dapr-JS][Example] ${JSON.stringify(res)}`);}

start().catch((e) => {
    console.error(e);
    process.exit(1);
});