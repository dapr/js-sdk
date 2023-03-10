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

import { DaprClient, CommunicationProtocolEnum } from "@dapr/dapr";
import { GreeterClient } from "./proto/helloworld/helloworld_grpc_pb";
import { HelloReply, HelloRequest } from "./proto/helloworld/helloworld_pb";

const daprHost = "127.0.0.1";
const daprPort = "50007"; // Dapr Sidecar Port of this Example

async function start() {
  const clientSidecar = new DaprClient({
    daprHost,
    daprPort,
    communicationProtocol: CommunicationProtocolEnum.GRPC,
  });
  const clientProxy = await clientSidecar.proxy.create<GreeterClient>(GreeterClient);

  const req = new HelloRequest();
  req.setName("Hello World");

  clientProxy.sayHello(req, (err: any, res: HelloReply) => {
    if (err) {
      console.error(err);
    } else {
      console.log(`Received from Server: ${res.getMessage()}`);
    }
  });
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
