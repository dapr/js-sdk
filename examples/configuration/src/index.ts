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

import { CommunicationProtocolEnum, DaprClient } from "@dapr/dapr";

const daprHost = "127.0.0.1";

async function start() {
  const client = new DaprClient({
    daprHost,
    daprPort: process.env.DAPR_GRPC_PORT,
    communicationProtocol: CommunicationProtocolEnum.GRPC,
  });

  // Get keys from config store
  const config = await client.configuration.get("config-store", ["key1", "key2"]);
  console.log(config);

  console.log("Subscribing to config store updates...");

  // Subscribes to config store changes for keys "key1" and "key2"
  const stream = await client.configuration.subscribeWithKeys("config-store", ["key1", "key2"], async (data) => {
    console.log("Subscribe received updates from config store: ", data);
  });

  // Wait for 60 seconds and unsubscribe.
  await new Promise((resolve) => setTimeout(resolve, 60000));
  stream.stop();

  console.log("Unsubscribed from config store, exiting...");
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
