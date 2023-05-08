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

import { CommunicationProtocolEnum, DaprClient, DaprClientOptions, DaprServer } from "../../../src";
import fetch from "node-fetch";

import * as NodeJSUtil from "../../../src/utils/NodeJS.util";
import ActorId from "../../../src/actors/ActorId";
import ActorProxyBuilder from "../../../src/actors/client/ActorProxyBuilder";
import DemoActorActivateImpl from "../../actor/DemoActorActivateImpl";
import DemoActorCounterImpl from "../../actor/DemoActorCounterImpl";
import DemoActorCounterInterface from "../../actor/DemoActorCounterInterface";
import DemoActorReminderImpl from "../../actor/DemoActorReminderImpl";
import DemoActorReminder2Impl from "../../actor/DemoActorReminder2Impl";
import DemoActorReminderInterface from "../../actor/DemoActorReminderInterface";
import DemoActorSayImpl from "../../actor/DemoActorSayImpl";
import DemoActorSayInterface from "../../actor/DemoActorSayInterface";
import DemoActorTimerImpl from "../../actor/DemoActorTimerImpl";
import DemoActorTimerInterface from "../../actor/DemoActorTimerInterface";
import DemoActorTimerTtlImpl from "../../actor/DemoActorTimerTtlImpl";
import DemoActorReminderTtlImpl from "../../actor/DemoActorReminderTtlImpl";
import DemoActorDeleteStateImpl from "../../actor/DemoActorDeleteStateImpl";
import DemoActorDeleteStateInterface from "../../actor/DemoActorDeleteStateInterface";

const serverHost = "127.0.0.1";
const serverPort = "50001";
const sidecarHost = "127.0.0.1";
const sidecarPort = "50000";
const serverStartWaitTimeMs = 5 * 1000;

const daprClientOptions: DaprClientOptions = {
  daprHost: sidecarHost,
  daprPort: sidecarPort,
  communicationProtocol: CommunicationProtocolEnum.HTTP,
  isKeepAlive: false,
  actor: {
    actorIdleTimeout: "1h",
    actorScanInterval: "30s",
    drainOngoingCallTimeout: "1m",
    drainRebalancedActors: true,
    reentrancy: {
      enabled: true,
      maxStackDepth: 32,
    },
    remindersStoragePartitions: 0,
  },
};

describe("http/actors", () => {
  let server: DaprServer;
  let client: DaprClient;

  // We need to start listening on some endpoints already
  // this because Dapr is not dynamic and registers endpoints on boot
  beforeAll(async () => {
    // Start server and client with keepAlive on the client set to false.
    // this means that we won't re-use connections here which is necessary for the tests
    // since it will keep handles open else it has to be initialized before the server starts!
    server = new DaprServer({
      serverHost,
      serverPort,
      communicationProtocol: CommunicationProtocolEnum.HTTP,
      clientOptions: daprClientOptions,
    });

    client = new DaprClient(daprClientOptions);

    // This will initialize the actor routes.
    // Actors themselves can be initialized later
    await server.actor.init();
    await server.actor.registerActor(DemoActorCounterImpl);
    await server.actor.registerActor(DemoActorSayImpl);
    await server.actor.registerActor(DemoActorReminderImpl);
    await server.actor.registerActor(DemoActorReminder2Impl);
    await server.actor.registerActor(DemoActorTimerImpl);
    await server.actor.registerActor(DemoActorActivateImpl);
    await server.actor.registerActor(DemoActorTimerTtlImpl);
    await server.actor.registerActor(DemoActorReminderTtlImpl);
    await server.actor.registerActor(DemoActorDeleteStateImpl);

    // Start server
    await server.start(); // Start the general server, this can take a while

    // Wait for actor placement tables to fully start up
    // TODO: Remove this once healthz is fixed (https://github.com/dapr/dapr/issues/3451)
    await NodeJSUtil.sleep(serverStartWaitTimeMs);
  }, 30 * 1000);

  // We need to stop the server after all tests are done
  // Note: it can take > 5s so increase timeout as we are testing reminders and timers
  afterAll(async () => {
    await server.stop();
  }, 30 * 1000);

  describe("configuration", () => {
    it("actor configuration endpoint should contain the correct parameters", async () => {
      const res = await fetch(`http://${serverHost}:${serverPort}/dapr/config`);
      expect(res.status).toBe(200);

      const config = JSON.parse(await res.text());

      expect(config.entities.length).toBe(9);
      expect(config.actorIdleTimeout).toBe("1h");
      expect(config.actorScanInterval).toBe("30s");
      expect(config.drainOngoingCallTimeout).toBe("1m");
      expect(config.drainRebalancedActors).toBe(true);
      expect(config.reentrancy.enabled).toBe(true);
      expect(config.reentrancy.maxStackDepth).toBe(32);
    });
  });

  describe("actorProxy", () => {
    it("should be able to create an actor object through the proxy", async () => {
      const builder = new ActorProxyBuilder<DemoActorCounterInterface>(DemoActorCounterImpl, client);
      const actor = builder.build(ActorId.createRandomId());

      const c1 = await actor.getCounter();
      expect(c1).toEqual(0);

      await actor.countBy(1, 1);
      const c2 = await actor.getCounter();
      expect(c2).toEqual(1);

      await actor.countBy(1, 10);
      const c3 = await actor.getCounter();
      expect(c3).toEqual(11);
    });
  });

  describe("invokeNonExistentMethod", () => {
    it("should not fail if invoked non-existing method on actor", async () => {
      const builder = new ActorProxyBuilder<DemoActorCounterInterface>(DemoActorCounterImpl, client);
      const actorId = ActorId.createRandomId();
      builder.build(actorId);

      const baseActorUrl = `http://${sidecarHost}:${sidecarPort}/v1.0/actors/DemoActorCounterImpl/${actorId.toString()}/method`;

      const validFunc = await fetch(`${baseActorUrl}/getCounter`);
      expect(validFunc.status).toBe(200);
      expect(validFunc.statusText).toBe("OK");

      const nonExistentFunc = await fetch(`${baseActorUrl}/sayHello`);
      expect(nonExistentFunc.status).toBe(500);
      expect(nonExistentFunc.statusText).toBe("Internal Server Error");
    });
  });

  describe("deleteActorState", () => {
    it("should be able to delete actor state", async () => {
      const builder = new ActorProxyBuilder<DemoActorDeleteStateInterface>(DemoActorDeleteStateImpl, client);
      const actor = builder.build(ActorId.createRandomId());
      await actor.init();

      const res = await actor.tryGetState();
      expect(res).toEqual(true);

      await actor.deleteState("data");

      const deletedRes = await actor.tryGetState();
      console.log(deletedRes);
      expect(deletedRes).toEqual(false);
    });
  });
  describe("invoke", () => {
    it("should register actors correctly", async () => {
      const actors = await server.actor.getRegisteredActors();

      expect(actors.length).toEqual(9);

      expect(actors).toContain(DemoActorCounterImpl.name);
      expect(actors).toContain(DemoActorSayImpl.name);
      expect(actors).toContain(DemoActorReminderImpl.name);
      expect(actors).toContain(DemoActorTimerImpl.name);
      expect(actors).toContain(DemoActorActivateImpl.name);
      expect(actors).toContain(DemoActorTimerTtlImpl.name);
      expect(actors).toContain(DemoActorReminderTtlImpl.name);
    });

    it("should be able to invoke an actor through a text message", async () => {
      const builder = new ActorProxyBuilder<DemoActorSayInterface>(DemoActorSayImpl, client);
      const actor = builder.build(ActorId.createRandomId());
      const res = await actor.sayString("Hello World");
      expect(res).toEqual(`Actor said: "Hello World"`);
    });

    it("should be able to invoke an actor through an object message", async () => {
      const builder = new ActorProxyBuilder<DemoActorSayInterface>(DemoActorSayImpl, client);
      const actor = builder.build(ActorId.createRandomId());
      const res = await actor.sayObject({ hello: "world" });
      expect(JSON.stringify(res)).toEqual(`{"said":{"hello":"world"}}`);
    });

    it("should be able to invoke an actor through multiple parameters", async () => {
      const builder = new ActorProxyBuilder<DemoActorSayInterface>(DemoActorSayImpl, client);
      const actor = builder.build(ActorId.createRandomId());
      const res = await actor.sayMulti(123, "123", { hello: "world 123" }, [1, 2, 3]);
      expect(JSON.stringify(res)).toEqual(
        `{"a":{"value":123,"type":"number"},"b":{"value":"123","type":"string"},"c":{"value":{"hello":"world 123"},"type":"object"},"d":{"value":[1,2,3],"type":"object"}}`,
      );
    });

    it("should be able to invoke an actor through the client which abstracts the actor proxy builder for people unaware of patterns", async () => {
      const actor = client.actor.create<DemoActorSayInterface>(DemoActorSayImpl);
      const res = await actor.sayMulti(123, "123", { hello: "world 123" }, [1, 2, 3]);
      expect(JSON.stringify(res)).toEqual(
        `{"a":{"value":123,"type":"number"},"b":{"value":"123","type":"string"},"c":{"value":{"hello":"world 123"},"type":"object"},"d":{"value":[1,2,3],"type":"object"}}`,
      );
    });
  });

  describe("timers", () => {
    it("should fire a timer correctly (expected execution time > 5s)", async () => {
      const builder = new ActorProxyBuilder<DemoActorTimerInterface>(DemoActorTimerImpl, client);
      const actor = builder.build(ActorId.createRandomId());

      // Activate our actor
      await actor.init();

      const res0 = await actor.getCounter();
      expect(res0).toEqual(0);

      // Now we wait for dueTime (2s)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // After that the timer callback will be called
      // In our case, the callback increments the count attribute
      // the count attribute is +100 due to the passed state
      const res1 = await actor.getCounter();
      expect(res1).toEqual(100);

      // Every 1 second the timer gets called again, so the count attribute should change
      // we check this twice to ensure correct calling
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const res2 = await actor.getCounter();
      expect(res2).toEqual(200);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const res3 = await actor.getCounter();
      expect(res3).toEqual(300);

      // Stop the timer
      await actor.removeTimer();

      // We then expect the counter to stop increasing
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const res4 = await actor.getCounter();
      expect(res4).toEqual(300);
    }, 10000);

    it("should apply the ttl when it is set (expected execution time > 5s)", async () => {
      const builder = new ActorProxyBuilder<DemoActorTimerInterface>(DemoActorTimerTtlImpl, client);
      const actor = builder.build(ActorId.createRandomId());

      // Activate our actor
      await actor.init();

      const res0 = await actor.getCounter();
      expect(res0).toEqual(0);

      // Now we wait for dueTime (2s)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // After that the timer callback will be called
      // In our case, the callback increments the count attribute
      // the count attribute is +100 due to the passed state
      const res1 = await actor.getCounter();
      expect(res1).toEqual(100);

      // Every 1 second the timer gets called again, so the count attribute should change
      // we check this twice to ensure correct calling
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const res2 = await actor.getCounter();
      expect(res2).toEqual(100);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const res3 = await actor.getCounter();
      expect(res3).toEqual(200);

      // Stop the timer
      await actor.removeTimer();

      // We then expect the counter to stop increasing
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const res4 = await actor.getCounter();
      expect(res4).toEqual(200);
    }, 10000);
  });

  describe("reminders", () => {
    it("should be able to unregister a reminder", async () => {
      const builder = new ActorProxyBuilder<DemoActorReminderInterface>(DemoActorReminderImpl, client);
      const actor = builder.build(ActorId.createRandomId());

      // Activate our actor
      // this will initialize the reminder to be called
      await actor.init();

      const res0 = await actor.getCounter();
      expect(res0).toEqual(0);

      // Now we wait for dueTime (1.5s)
      await NodeJSUtil.sleep(1500);

      // After that the reminder callback will be called
      // In our case, the callback increments the count attribute
      const res1 = await actor.getCounter();
      expect(res1).toEqual(123);

      await actor.removeReminder();

      // Now we wait an extra period - duration (1s)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Make sure the counter didn't change as we removed it
      const res2 = await actor.getCounter();
      expect(res2).toEqual(123);
    });

    it("should fire a reminder but with a warning if it's not implemented correctly", async () => {
      const builder = new ActorProxyBuilder<DemoActorReminderInterface>(DemoActorReminder2Impl, client);
      const actorId = ActorId.createRandomId();
      const actor = builder.build(actorId);

      // Create spy object
      const spy = jest.spyOn(global.console, "warn");

      // Activate our actor
      await actor.init();

      const res0 = await actor.getCounter();
      expect(res0).toEqual(0);

      // Now we wait for dueTime (2s)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // The method receiveReminder on AbstractActor should be called at least once
      // this will state the not implemented function
      expect(spy.mock.calls[0].length).toBe(1);
      expect(spy.mock.calls[0][0]).toContain(
        `{"error":"ACTOR_METHOD_NOT_IMPLEMENTED","errorMsg":"A reminder was created for the actor with id: ${actorId.getId()} but the method 'receiveReminder' was not implemented"}`,
      );

      // Unregister the reminder
      await actor.removeReminder();
    });

    it("should apply the ttl when it is set to a reminder", async () => {
      const builder = new ActorProxyBuilder<DemoActorReminderInterface>(DemoActorReminderTtlImpl, client);
      const actor = builder.build(ActorId.createRandomId());

      // Activate our actor
      // this will initialize the reminder to be called
      await actor.init();

      const res0 = await actor.getCounter();
      expect(res0).toEqual(0);

      // Now we wait for dueTime (1.5s)
      await NodeJSUtil.sleep(1500);

      // After that the reminder callback will be called
      // In our case, the callback increments the count attribute
      const res1 = await actor.getCounter();
      expect(res1).toEqual(123);

      await actor.removeReminder();

      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Make sure the counter didn't change
      const res2 = await actor.getCounter();
      expect(res2).toEqual(123);
    });
  });
});
