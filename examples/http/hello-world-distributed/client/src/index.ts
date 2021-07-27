import Dapr, { HttpMethod } from "@roadwork/dapr-js-sdk/http";

const daprHost = "127.0.0.1";
const daprPort = 3500;
const daprInternalServerPort = 4001;
const daprAppId = "my-server";

async function start() {
  const client = new Dapr(daprHost, daprPort, daprInternalServerPort);

  const res = await client.invoker.invoke(daprAppId, "hello-world", HttpMethod.POST, {
    hello: "world"
  });
  console.log(`[Dapr-JS][Example] ${JSON.stringify(res)}`);}

start().catch((e) => {
    console.error(e);
    process.exit(1);
});