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

import { v4 as uuidv4 } from "uuid";
import { DaprClient } from "../../../src";
import ActorRuntime from "../../../src/actors/runtime/ActorRuntime";
import ActorId from "../../../src/actors/ActorId";
import DemoActorCounterImpl from "../../actor/DemoActorCounterImpl";
import DemoActorSayImpl from "../../actor/DemoActorSayImpl";
import { ActorRuntimeOptions } from "../../../src/types/actors/ActorRuntimeOptions";

describe("ActorRuntime", () => {
  let client: DaprClient;
  let runtime: ActorRuntime;

  beforeAll(async () => {
    jest.mock("../../../src/implementation/Client/DaprClient"); // converts DaprClient into a mock constructor
    client = new DaprClient({ daprHost: "127.0.0.1", daprPort: "1000" });
  });

  beforeEach(async () => {
    runtime = ActorRuntime.getInstanceByDaprClient(client);

    // Reset the runtime config
    const options: ActorRuntimeOptions = {
      actorIdleTimeout: "1h",
      actorScanInterval: "30s",
      drainOngoingCallTimeout: "1m",
      drainRebalancedActors: true,
      reentrancy: {
        enabled: false,
      },
      remindersStoragePartitions: 1,
    };
    runtime.setActorRuntimeOptions(options);

    // Clear the Actor Managers
    runtime.clearActorManagers();
  });

  it("should have an actor config that matches the default values", async () => {
    const config = runtime.getActorRuntimeOptions();

    expect(config.actorIdleTimeout).toEqual("1h");
    expect(config.actorScanInterval).toEqual("30s");
    expect(config.drainOngoingCallTimeout).toEqual("1m");
    expect(config.drainRebalancedActors).toEqual(true);
    expect(config.reentrancy?.enabled).toEqual(false);
    expect(config.remindersStoragePartitions).toEqual(1);
  });

  it("should allow us to change the actor runtime config values", async () => {
    const newOptions: ActorRuntimeOptions = {
      actorIdleTimeout: "3h",
      actorScanInterval: "10s",
      drainOngoingCallTimeout: "2m",
      drainRebalancedActors: false,
      reentrancy: {
        enabled: true,
        maxStackDepth: 10,
      },
      remindersStoragePartitions: 2,
    };

    runtime.setActorRuntimeOptions(newOptions);

    const config = runtime.getActorRuntimeOptions();

    expect(config.actorIdleTimeout).toEqual("3h");
    expect(config.actorScanInterval).toEqual("10s");
    expect(config.drainOngoingCallTimeout).toEqual("2m");
    expect(config.drainRebalancedActors).toEqual(false);
    expect(config.reentrancy?.enabled).toEqual(true);
    expect(config.reentrancy?.maxStackDepth).toEqual(10);
    expect(config.remindersStoragePartitions).toEqual(2);
  });

  it("should be able to register an actor", async () => {
    await runtime.registerActor(DemoActorCounterImpl);
    await runtime.registerActor(DemoActorSayImpl);

    expect(runtime.getRegisteredActorTypes().indexOf(DemoActorCounterImpl.name)).toBeGreaterThan(-1);
    expect(runtime.getRegisteredActorTypes().indexOf(DemoActorSayImpl.name)).toBeGreaterThan(-1);
  });

  it("should only register an actor once", async () => {
    await runtime.registerActor(DemoActorCounterImpl);
    await runtime.registerActor(DemoActorCounterImpl);

    expect(runtime.getRegisteredActorTypes().indexOf(DemoActorCounterImpl.name)).toBeGreaterThan(-1);
    expect(runtime.getRegisteredActorTypes().length).toEqual(1);
  });

  it("should be able to invoke an actor", async () => {
    const actorId = uuidv4();

    await runtime.registerActor(DemoActorSayImpl);

    const res = await runtime.invoke(DemoActorSayImpl.name, actorId, "sayString", Buffer.from("Hello World"));
    expect(res.toString()).toEqual(`Actor said: "Hello World"`);
  });

  it("should receive an error if the actor method does not exist", async () => {
    const actorId = uuidv4();

    await runtime.registerActor(DemoActorCounterImpl);

    try {
      await runtime.invoke(DemoActorCounterImpl.name, actorId, "someRandomMethod");
    } catch (e) {
      const msg = (e as Error).message;
      expect(msg).toEqual(
        `{"error":"ACTOR_METHOD_DOES_NOT_EXIST","errorMsg":"The actor method 'someRandomMethod' does not exist on ${DemoActorCounterImpl.name}"}`,
      );
    }
  });

  it("should be able to fire a reminder", async () => {
    // TODO: add this test
    new ActorId(uuidv4());
  });

  it("should be able to fire a timer", async () => {
    // TODO: add this test
    new ActorId(uuidv4());
  });
});
