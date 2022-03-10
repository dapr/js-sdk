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

import { CommunicationProtocolEnum, DaprClient, DaprServer } from '../../src';

import DemoActorActivateImpl from '../actor/DemoActorActivateImpl';
import DemoActorCounterImpl from '../actor/DemoActorCounterImpl';
import DemoActorReminderImpl from '../actor/DemoActorReminderImpl';
import DemoActorReminder2Impl from '../actor/DemoActorReminder2Impl';
import DemoActorSayImpl from '../actor/DemoActorSayImpl';
import DemoActorTimerImpl from '../actor/DemoActorTimerImpl';
import ActorId from '../../src/actors/ActorId';
import ActorProxyBuilder from '../../src/actors/client/ActorProxyBuilder';
import * as NodeJSUtil from '../../src/utils/NodeJS.util';
import { testIt } from './utils';

const serverHost = "127.0.0.1";
const serverPort = "50001";
const sidecarHost = "127.0.0.1";
const sidecarPort = "50000";

describe('http/actors', () => {
  let server: DaprServer;
  let client: DaprClient;

  // We need to start listening on some endpoints already
  // this because Dapr is not dynamic and registers endpoints on boot
  beforeAll(async () => {
    // Start server and client with keepAlive on the client set to false.
    // this means that we won't re-use connections here which is necessary for the tests
    // since it will keep handles open else
    server = new DaprServer(serverHost, serverPort, sidecarHost, sidecarPort, CommunicationProtocolEnum.HTTP, {
      isKeepAlive: false
    });

    client = new DaprClient(sidecarHost, sidecarPort, CommunicationProtocolEnum.HTTP, {
      isKeepAlive: false
    });

    // has to be initialized before the server started! 
    // This will initialize the actor routes. 
    // Actors themselves can be initialized later
    await server.actor.init();
    await server.actor.registerActor(DemoActorCounterImpl);
    await server.actor.registerActor(DemoActorSayImpl);
    await server.actor.registerActor(DemoActorReminderImpl);
    await server.actor.registerActor(DemoActorReminder2Impl);
    await server.actor.registerActor(DemoActorTimerImpl);
    await server.actor.registerActor(DemoActorActivateImpl);

    // Start server
    await server.start(); // Start the general server, this can take a while
  }, 30 * 1000);

  afterAll(async () => {
    await server.stop(); // if we hang here, it means connections are open that were not closed. Debug why
    // await client.stop();
  });

  describe('actorProxy', () => {
    testIt('should be able to create an actor object through the proxy', async () => {
      const builder = new ActorProxyBuilder<DemoActorCounterImpl>(DemoActorCounterImpl, client);
      const actor = builder.build(ActorId.createRandomId());

      const c1 = await actor.getCounter();
      expect(c1).toEqual(0);

      await actor.countBy(1);
      const c2 = await actor.getCounter();
      expect(c2).toEqual(1);

      await actor.countBy(1, 10);
      const c3 = await actor.getCounter();
      expect(c3).toEqual(11);
    });
  });

  describe('invoke', () => {
    testIt('should register actors correctly', async () => {
      const actors = await server.actor.getRegisteredActors();

      expect(actors.length).toEqual(6);

      expect(actors).toContain(DemoActorCounterImpl.name);
      expect(actors).toContain(DemoActorSayImpl.name);
      expect(actors).toContain(DemoActorReminderImpl.name);
      expect(actors).toContain(DemoActorTimerImpl.name);
      expect(actors).toContain(DemoActorActivateImpl.name);
    });

    testIt('should be able to invoke an actor through a text message', async () => {
      const builder = new ActorProxyBuilder<DemoActorSayImpl>(DemoActorSayImpl, client);
      const actor = builder.build(ActorId.createRandomId());
      const res = await actor.sayString("Hello World");
      expect(res).toEqual(`Actor said: "Hello World"`)
    });

    testIt('should be able to invoke an actor through an object message', async () => {
      const builder = new ActorProxyBuilder<DemoActorSayImpl>(DemoActorSayImpl, client);
      const actor = builder.build(ActorId.createRandomId());
      const res = await actor.sayObject({ hello: "world" });
      expect(JSON.stringify(res)).toEqual(`{"said":{"hello":"world"}}`)
    });

    testIt('should be able to invoke an actor through multiple parameters', async () => {
      const builder = new ActorProxyBuilder<DemoActorSayImpl>(DemoActorSayImpl, client);
      const actor = builder.build(ActorId.createRandomId());
      const res = await actor.sayMulti(123, "123", { hello: "world 123" }, [1, 2, 3]);
      expect(JSON.stringify(res)).toEqual(`{"a":{"value":123,"type":"number"},"b":{"value":"123","type":"string"},"c":{"value":{"hello":"world 123"},"type":"object"},"d":{"value":[1,2,3],"type":"object"}}`)
    });

    testIt('should be able to invoke an actor through the client which abstracts the actor proxy builder for people unaware of patterns', async () => {
      const actor = client.actor.create<DemoActorSayImpl>(DemoActorSayImpl);
      const res = await actor.sayMulti(123, "123", { hello: "world 123" }, [1, 2, 3]);
      expect(JSON.stringify(res)).toEqual(`{"a":{"value":123,"type":"number"},"b":{"value":"123","type":"string"},"c":{"value":{"hello":"world 123"},"type":"object"},"d":{"value":[1,2,3],"type":"object"}}`)
    });
  });

  describe('timers', () => {
    testIt('should fire a timer correctly (expected execution time > 5s)', async () => {
      const builder = new ActorProxyBuilder<DemoActorTimerImpl>(DemoActorTimerImpl, client);
      const actor = builder.build(ActorId.createRandomId());

      // Activate our actor
      await actor.init();

      const res0 = await actor.getCounter();
      expect(res0).toEqual(0);

      // Now we wait for dueTime (2s)
      await (new Promise(resolve => setTimeout(resolve, 2000)));

      // After that the timer callback will be called
      // In our case, the callback increments the count attribute
      // the count attribute is +100 due to the passed state
      const res1 = await actor.getCounter();
      expect(res1).toEqual(100);

      // Every 1 second the timer gets called again, so the count attribute should change
      // we check this twice to ensure correct calling
      await (new Promise(resolve => setTimeout(resolve, 1000)));
      const res2 = await actor.getCounter();
      expect(res2).toEqual(200);
      await (new Promise(resolve => setTimeout(resolve, 1000)));
      const res3 = await actor.getCounter();
      expect(res3).toEqual(300);

      // Stop the timer
      await actor.removeTimer();

      // We then expect the counter to stop increasing
      await (new Promise(resolve => setTimeout(resolve, 1000)));
      const res4 = await actor.getCounter();
      expect(res4).toEqual(300);
    }, 10000);
  });

  describe('reminders', () => {
    testIt('should be able to unregister a reminder', async () => {
      const builder = new ActorProxyBuilder<DemoActorReminderImpl>(DemoActorReminderImpl, client);
      const actor = builder.build(ActorId.createRandomId());

      // Activate our actor
      // this will initialize the reminder to be called
      await actor.init();

      const res0 = await actor.getCounter();
      expect(res0).toEqual(0);

      // Now we wait for dueTime (2s)
      await NodeJSUtil.sleep(2000);

      // After that the reminder callback will be called
      // In our case, the callback increments the count attribute
      const res1 = await actor.getCounter();
      expect(res1).toEqual(123);

      await actor.removeReminder();

      // Now we wait an extra period (2s)
      await (new Promise(resolve => setTimeout(resolve, 2000)));

      // Make sure the counter didn't change
      const res2 = await actor.getCounter();
      expect(res2).toEqual(123);
    });

    testIt('should fire a reminder but with a warning if it\'s not implemented correctly', async () => {
      const builder = new ActorProxyBuilder<DemoActorReminder2Impl>(DemoActorReminder2Impl, client);
      const actorId = ActorId.createRandomId();
      const actor = builder.build(actorId);

      // Create spy object
      const spy = jest.spyOn(global.console, 'warn');

      // Activate our actor
      await actor.init();

      const res0 = await actor.getCounter();
      expect(res0).toEqual(0);

      // Now we wait for dueTime (2s)
      await (new Promise(resolve => setTimeout(resolve, 2000)));

      // The method receiveReminder on AbstractActor should be called at least once
      // this will state the not implemented function
      expect(spy.mock.calls[0].length).toBe(1);
      expect(spy.mock.calls[0][0]).toEqual(`{"error":"ACTOR_METHOD_NOT_IMPLEMENTED","errorMsg":"A reminder was created for the actor with id: ${actorId.getId()} but the method 'receiveReminder' was not implemented"}`);

      // Unregister the reminder
      await actor.removeReminder();
    });
  });
});