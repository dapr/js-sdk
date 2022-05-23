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

import { DaprServer, DaprClient, ActorProxyBuilder, ActorId } from "@dapr/dapr";
import ParkingSensorImpl from "./ParkingSensorImpl";
import ParkingSensorInterface from "./ParkingSensorInterface";

const daprHost = "127.0.0.1";
const daprPort = "50000"; // Dapr Sidecar Port of this Example Server
const serverHost = "127.0.0.1"; // App Host of this Example Server
const serverPort = "50001"; // App Port of this Example Server

async function start() {
  const server = new DaprServer(serverHost, serverPort, daprHost, daprPort);
  const client = new DaprClient(daprHost, daprPort);

  logHeader("INITIALIZING")

  await server.actor.init(); // Let the server know we need actors
  server.actor.registerActor(ParkingSensorImpl); // Register the actor
  await server.start(); // Start the server

  log("Init", "Waiting for actors to be ready");
  await sleep(5 * 1000);

  const resRegisteredActors = await server.actor.getRegisteredActors();
  log("Init", `Registered Actor Types: ${JSON.stringify(resRegisteredActors)}`);

  logHeader("REGISTER ACTORS");

  const amount = 250;
  const actors = new Array(amount);
  const builder = new ActorProxyBuilder<ParkingSensorInterface>(ParkingSensorImpl, client);

  log("Registration", `Creating ${amount} Actors`);
  for (let i = 0; i < amount; i++) {
    actors[i] = builder.build(new ActorId(`parking-sensor-${i}`));
    await actors[i].carLeave();
  }

  logHeader("UPDATE SENSOR STATES");

  log("Simulate", "Waiting 10 seconds before starting");
  await sleep(10 * 1000);

  const isRunning = true;
  while (isRunning) {
    log("Simulate", "Simulating cars entering and leaving for 5% of the population");

    const populationSize = Math.floor(amount * 0.05);

    // Randomly put 10 on parked
    for (let i = 0; i < populationSize; i++) {
      const id = Math.floor(Math.random() * amount);
      await actors[id].carEnter();
    }

    // Randomly put 10 on empty
    for (let i = 0; i < populationSize; i++) {
      const id = Math.floor(Math.random() * amount);
      await actors[id].carLeave();
    }

    await sleep(5 * 1000);
  }
}

function log(identifier: string, message: string) {
  console.log(`[Dapr-JS][Actors][${identifier}] ${message}`);
}

function logHeader(message: string) {
  console.log("===============================================================");
  console.log(message);
  console.log("===============================================================");
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});