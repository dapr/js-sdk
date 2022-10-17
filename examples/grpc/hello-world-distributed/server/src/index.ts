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

import { DaprServer, HttpMethod, CommunicationProtocolEnum } from "@dapr/dapr";

const daprHost = "127.0.0.1";
const daprPort = "50050"; // Dapr Sidecar Port of this Example Server
const serverHost = "127.0.0.1"; // App Host of this Example Server
const serverPort = "50051"; // App Port of this Example Server

async function start() {
  const server = new DaprServer(serverHost, serverPort, daprHost, daprPort, CommunicationProtocolEnum.GRPC);
  await server.start();

  await server.invoker.listen(
    "hello-world",
    async (data: any) => {
      console.log("[Dapr-JS][Example] Received Hello World Method Call");
      console.log(`[Dapr-JS][Example] Data: ${JSON.stringify(data.body)}`);
      console.log(`[Dapr-JS][Example] Replying to the client`);
      return { hello: "world received" };
    },
    { method: HttpMethod.POST },
  );
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
