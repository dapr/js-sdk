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
import ParkingSensorImpl from "./ParkingSensorImpl";

const daprHost = "127.0.0.1";
const daprPort = "50000"; // Dapr Sidecar Port of this Example Server
const serverHost = "127.0.0.1"; // App Host of this Example Server
const serverPort = "50001"; // App Port of this Example Server

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function start() {
  const server = new DaprServer(serverHost, serverPort, daprHost, daprPort);
  const client = new DaprClient(daprHost, daprPort);

  console.log("===============================================================");
  console.log("SERVER INITIALIZING")
  console.log("===============================================================");
  await server.actor.init(); // Let the server know we need actors
  server.actor.registerActor(ParkingSensorImpl); // Register the actor
  await server.start(); // Start the server

  console.log("===============================================================");
  console.log("CLIENT EXECUTION");
  console.log("===============================================================");
  const amount = 250;
  console.log(`Creating ${amount} Actors`);
  for (let i = 0; i < amount; i++) {
    // await client.actor.invoke("GET", ParkingSensorImpl.name, `parking-sensor-${i}`, "getInfo");
    await client.actor.invoke("PUT", ParkingSensorImpl.name, `parking-sensor-${i}`, "carLeave");
  }

  console.log("===============================================================");
  console.log("CHANGING STATE OF SENSORS");
  console.log("===============================================================");
  console.log("Waiting 10 seconds before starting");
  await sleep(10000);

  const isRunning = true;
  while (isRunning) {
    console.log("Simulating cars entering and leaving for 5% of the population");

    const populationSize = Math.floor(amount * 0.05);

    // Randomly put 10 on parked
    for (let i = 0; i < populationSize; i++) {
      const id = Math.floor(Math.random() * amount);
      await client.actor.invoke("PUT", ParkingSensorImpl.name, `parking-sensor-${id}`, "carEnter");
    }

    // Randomly put 10 on empty
    for (let i = 0; i < populationSize; i++) {
      const id = Math.floor(Math.random() * amount);
      await client.actor.invoke("PUT", ParkingSensorImpl.name, `parking-sensor-${id}`, "carLeave");
    }

    await sleep(5000);
  }
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});