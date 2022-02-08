import { DaprClient, /* CommunicationProtocolEnum */ } from "dapr-client";

// Common settings
const daprHost = "127.0.0.1";
// const daprAppId = "example-config";

async function start() {
  // Note that the DAPR_HTTP_PORT and DAPR_GRPC_PORT environment variables are set by DAPR itself. https://docs.dapr.io/reference/environment/

  const client = new DaprClient(
    daprHost,
    process.env.DAPR_HTTP_PORT
  );

  const config = await client.configuration.get('config-store', ['key1', 'key2']);
  console.log(config); 

  console.log(JSON.stringify(config));
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});