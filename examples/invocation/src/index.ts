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

import { DaprServer, DaprClient, HttpMethod, DaprInvokerCallbackContent } from "@dapr/dapr";

// Common settings
const daprAppId = "example-invocation";
const serverHost = "127.0.0.1"; // App Host of this Example Server
const daprHost = "127.0.0.1";
const serverPort = "50051"; // App Port of this Example Server

async function start() {
  const server = new DaprServer(serverHost, serverPort, daprHost);
  const client = new DaprClient({ daprHost: daprHost });

  // Note that invoker listeners can be set up after start() has been called
  await server.start();

  console.log("Setting up invocation endpoints");
  await server.invoker.listen(
    "hello-world",
    async (data: DaprInvokerCallbackContent) => {
      // Data is automatically parsed when received
      console.log(`Received: ${JSON.stringify(data.body)} as body on POST hello-world`);
      console.log(`Received: ${JSON.stringify(data.headers)} as headers on POST hello-world`);
      return { hello: "world received from POST" };
    },
    { method: HttpMethod.POST },
  );

  await server.invoker.listen(
    "hello-world",
    async () => {
      console.log("Received on GET hello-world");
      return { hello: "world received from GET" };
    },
    { method: HttpMethod.GET },
  );

  // Wait for 500ms to allow the server to start
  await new Promise((resolve) => setTimeout(resolve, 500));

  console.log("Invoking endpoints");
  const r = await client.invoker.invoke(
    daprAppId,
    "hello-world",
    HttpMethod.POST,
    { hello: "world" },
    { headers: { "X-Application-Type": "examples/invocation" } },
  );
  console.log(`Response to POST request: ${JSON.stringify(r)}`);
  const r2 = await client.invoker.invoke(daprAppId, "hello-world", HttpMethod.GET);
  console.log(`Response to GET request: ${JSON.stringify(r2)}`);
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
