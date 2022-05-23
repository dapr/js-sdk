/*
Copyright 2022 The Dapr Authors
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { DaprServer, DaprClient } from "@dapr/dapr";

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