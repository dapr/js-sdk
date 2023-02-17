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

import { DaprClient, DaprServer } from "@dapr/dapr";

// Common settings
const serverHost = "127.0.0.1"; // App Host of this Example Server
const daprHost = "127.0.0.1";
const serverPort = "50051"; // App Port of this Example Server

async function start() {
  // Note that the DAPR_HTTP_PORT and DAPR_GRPC_PORT environment variables are set by DAPR itself. https://docs.dapr.io/reference/environment/
  const server = new DaprServer(serverHost, serverPort, daprHost, process.env.DAPR_HTTP_PORT);

  const client = new DaprClient(daprHost, process.env.DAPR_HTTP_PORT);

  // Initialize the subscription. Note that this must be done BEFORE calling .start()
  await server.pubsub.subscribe("my-pubsub-component", "my-topic", async (data: Record<string, any>) => {
    // The library parses JSON when possible.
    console.log(`[Dapr-JS][Example] Received on subscription: ${JSON.stringify(data)}`);
  });

  // Publish multiple messages to a topic with default config.
  await client.pubsub.subscribeBulk(
    "my-pubsub-component",
    "my-topic",
    async (data: Record<string, any>) => {
      // The library parses JSON when possible.
      console.log(`[Dapr-JS][Example] Received on subscription: ${JSON.stringify(data)}`);
    },
  );

  // Publish multiple messages to a topic with specific maxMessagesCount and maxAwaitDurationMs.
  await client.pubsub.subscribeBulk(
    "my-pubsub-component",
    "my-topic",
    async (data: Record<string, any>) => {
      // The library parses JSON when possible.
      console.log(`[Dapr-JS][Example] Received on subscription: ${JSON.stringify(data)}`);
    },
    100,
    40,
  );

  await server.start();

  // Wait for 1 second to allow the server to start.
  await new Promise((resolve) => setTimeout(resolve, 1000));

  let response;

  console.log("[Dapr-JS][Example] Publishing a plain message");
  response = await client.pubsub.publish("my-pubsub-component", "my-topic", "hello, world!");
  console.log(`[Dapr-JS][Example] Publish response: ${JSON.stringify(response)}`);

  console.log("[Dapr-JS][Example] Publishing a JSON message");
  response = await client.pubsub.publish("my-pubsub-component", "my-topic", { hello: "world" });
  console.log(`[Dapr-JS][Example] Publish response: ${JSON.stringify(response)}`);

  const cloudEvent = {
    specversion: "1.0",
    source: "/some/source",
    type: "example",
    id: "1234",
  };

  console.log("[Dapr-JS][Example] Publishing a cloud event message");
  response = await client.pubsub.publish("my-pubsub-component", "my-topic", cloudEvent);
  console.log(`[Dapr-JS][Example] Publish response: ${JSON.stringify(response)}`);
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
