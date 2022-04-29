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

import { ActorId, ActorProxyBuilder, DaprServer, DaprClient } from "dapr-client";
import ActorCounterImpl from "./actor/implementations/ActorCounterImpl";
import ActorReminderImpl from "./actor/implementations/ActorReminderImpl";
import ActorSayImpl from "./actor/implementations/ActorSayImpl";
import ActorTimerImpl from "./actor/implementations/ActorTimerImpl";
import ActorCounterInterface from "./actor/interfaces/ActorCounterInterface";
import ActorReminderInterface from "./actor/interfaces/ActorReminderInterface";
import ActorSayInterface from "./actor/interfaces/ActorSayInterface";
import ActorTimerInterface from "./actor/interfaces/ActorTimerInterface";

const daprHost = "127.0.0.1";
const daprPort = "50000"; // Dapr Sidecar Port of this Example Server
const serverHost = "127.0.0.1"; // App Host of this Example Server
const serverPort = "50001"; // App Port of this Example Server

async function start() {
  const server = new DaprServer(serverHost, serverPort, daprHost, daprPort);
  const client = new DaprClient(daprHost, daprPort);

  logHeader("INITIALIZING");
  
  // Creating actor bindings
  await server.actor.init();
  
  // Register the actor bindings.
  server.actor.registerActor(ActorSayImpl);
  server.actor.registerActor(ActorCounterImpl);
  server.actor.registerActor(ActorTimerImpl);
  server.actor.registerActor(ActorReminderImpl);

  // We initialize after registering our listeners since these should be defined upfront.
  // Dapr waits until we are listening on the port. Once that is detected it scans the binding list to process.
  await server.start();

  log("Init", "Waiting for actors to be ready");
  await new Promise((resolve) => {setTimeout(resolve, 5*1000);});

  const resRegisteredActors = await server.actor.getRegisteredActors();
  log("Init", `Registered Actor Types: ${JSON.stringify(resRegisteredActors)}`);

  logHeader("EXAMPLE 1 - ACTORS Method Invocation")
  await exampleActorSay(client);

  logHeader("EXAMPLE 2 - ACTORS Counter");
  await exampleActorCount(client);

  logHeader("EXAMPLE 3 - ACTORS Reminder");
  await exampleActorReminder(client);

  logHeader("EXAMPLE 4 - ACTORS Timer");
  await exampleActorTimer(client);

  await server.stop();
}

async function exampleActorSay(client: DaprClient) {
  const inputStr = "Hello World!";
  const inputObj = { message: "Hello World!" };

  // Create a new actor instance from a proxy builder.
  const builder = new ActorProxyBuilder<ActorSayInterface>(ActorSayImpl, client);
  const actor = builder.build(ActorId.createRandomId());

  // Invoke the actor methods.
  log("Example1", `Trying to invoke method 'sayString' with string "${inputStr}"`);
  const resActorInvokeSayStr = await actor.sayString(inputStr);
  log("Example1", `Invoked method with "${inputStr}" and got data: ${resActorInvokeSayStr}`);

  log("Example1", `Trying to invoke method 'sayObject' with object "${JSON.stringify(inputObj)}"`);
  const resActorInvokeSayObj = await actor.sayObject(inputObj);
  log("Example1", `Invoked method with ${JSON.stringify(inputObj)} and got data: ${JSON.stringify(resActorInvokeSayObj)}`);
}

async function exampleActorCount(client: DaprClient) {
  // Create a new actor instance from a proxy builder.
  const counterBuilder = new ActorProxyBuilder<ActorCounterInterface>(ActorCounterImpl, client);
  const counterActor = counterBuilder.build(ActorId.createRandomId());

  // Invoke the actor methods.
  log("Example2", `Invoking 'count' thrice`);
  await counterActor.count();
  await counterActor.count();
  await counterActor.count();

  log("Example2", `Invoking 'getCounter'`);
  const resCounterGetCounter = await counterActor.getCounter();
  log("Example2", `Invoked 'getCounter' and got data: ${resCounterGetCounter}`);

  log("Example2", `Invoking 'countBy' with amount: 5 and multiplier: 2`);
  await counterActor.countBy(5, 2);

  log("Example2", `Invoking 'getCounter'`);
  const resCounterGetCounter2 = await counterActor.getCounter();
  log("Example2", `Invoked 'getCounter' and got data: ${resCounterGetCounter2}`);
}

async function exampleActorReminder(client: DaprClient) {
  // Create a new actor instance from a proxy builder.
  const reminderBuilder = new ActorProxyBuilder<ActorReminderInterface>(ActorReminderImpl, client);
  const reminderActor = reminderBuilder.build(ActorId.createRandomId());

  const reminderName = "my-reminder";

  // Initialize the reminder.
  log("Example3", "Invoking 'init' and registering the reminder");
  await reminderActor.init(reminderName, 5, 1, 10);

  // Wait for 8 seconds
  await new Promise((resolve) => {setTimeout(resolve, 8*1000);});

  // Stop the reminder.
  log("Example3", "Invoking 'stop' and unregistering the reminder");
  await reminderActor.stop();
}

async function exampleActorTimer(client: DaprClient) {
  // Create a new actor instance from a proxy builder.
  const timerBuilder = new ActorProxyBuilder<ActorTimerInterface>(ActorTimerImpl, client);
  const timerActor = timerBuilder.build(ActorId.createRandomId());

  const timerName = "my-timer";

  // Initialize the timer.
  log("Example4", "Invoking 'init' and registering the timer");
  await timerActor.init(timerName, 100, 5, 1, 10);

  // Wait for 2 seconds
  await new Promise((resolve) => {setTimeout(resolve, 2*1000);});

  // Get the value of the counter
  log("Example4", "Invoking 'getCounter'");
  const resTimerGetCounter = await timerActor.getCounter();
  log("Example4", `Invoked 'getCounter' and got data: ${resTimerGetCounter}`);

  // Wait for 5 seconds
  await new Promise((resolve) => {setTimeout(resolve, 5*1000);});

  // Get the value of the counter
  log("Example4", "Invoking 'getCounter'");
  const resTimerGetCounter2 = await timerActor.getCounter();
  log("Example4", `Invoked 'getCounter' and got data: ${resTimerGetCounter2}`);

  // Stop the timer.
  log("Example4", "Invoking 'stop' and unregistering the timer");
  await timerActor.stop();
}

function log(identifier: string, message: string) {
  console.log(`[Dapr-JS][Actors][${identifier}] ${message}`);
}

function logHeader(message: string) {
  console.log("===============================================================");
  console.log(message);
  console.log("===============================================================");
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});