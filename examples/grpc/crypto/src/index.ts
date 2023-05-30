/*
Copyright 2023 The Dapr Authors
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

import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";

import { DaprClient, CommunicationProtocolEnum } from "@dapr/dapr";

const daprHost = "127.0.0.1";
const daprPort = "50050"; // Dapr Sidecar Port of this Example Server

async function start() {
  const client = new DaprClient({
    daprHost,
    daprPort,
    communicationProtocol: CommunicationProtocolEnum.GRPC,
  });

  // First, encrypt the message
  console.log("== Encrypting message");
  console.log("Encrypting plaintext.txt to ciphertext.out");

  await pipeline(
    createReadStream("plaintext.txt"),
    await client.crypto.encrypt({
      componentName: "crypto-local",
      keyName: "symmetric256",
      keyWrapAlgorithm: "A256KW",
    }),
    createWriteStream("ciphertext.out"),
  );

  // Decrypt the message
  console.log("== Decrypting message");
  console.log("Encrypting ciphertext.out to plaintext.out");
  await pipeline(
    createReadStream("ciphertext.out"),
    await client.crypto.decrypt({
      componentName: "crypto-local",
    }),
    createWriteStream("plaintext.out"),
  );
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
