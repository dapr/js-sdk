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

const daprHost = "127.0.0.1";
const daprPort = "50000"; // Dapr Sidecar Port of this Example Server
const serverHost = "127.0.0.1"; // App Host of this Example Server
const serverPort = "50001"; // App Port of this Example Server

async function start() {
  // Create a Server (will subscribe) and Client (will publish)
  const server = new DaprServer(serverHost, serverPort, daprHost, daprPort);
  const client = new DaprClient({ daprHost: daprHost, daprPort: daprPort });

  // Initialize the server to subscribe (listen)
  await server.pubsub.subscribe("my-pubsub-component", "my-topic", async (data: any) =>
    console.log(`Received: ${JSON.stringify(data)}`),
  );
  await server.start();

  // Send a message
  await client.pubsub.publish("my-pubsub-component", "my-topic", { hello: "world" });
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
