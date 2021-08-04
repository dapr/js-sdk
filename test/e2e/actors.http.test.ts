import { DaprClient, DaprServer, Temporal } from '../../src';

import DemoActorCounterImpl from '../actor/DemoActorCounterImpl';
import DemoActorReminderImpl from '../actor/DemoActorReminderImpl';
import DemoActorSayImpl from '../actor/DemoActorSayImpl';
import DemoActorTimerImpl from '../actor/DemoActorTimerImpl';

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
    server = new DaprServer(serverHost, serverPort, sidecarHost, sidecarPort);
    client = new DaprClient(sidecarHost, sidecarPort);

    // has to be initialized before the server started! 
    // This will initialize the actor routes. 
    // Actors themselves can be initialized later
    await server.actor.init();
    await server.actor.registerActor(DemoActorCounterImpl);
    await server.actor.registerActor(DemoActorSayImpl);
    await server.actor.registerActor(DemoActorReminderImpl);
    await server.actor.registerActor(DemoActorTimerImpl);

    // Start server
    await server.startServer(); // Start the general server
  });

  describe('invoke', () => {
    it('should register actors correctly', async () => {
      const actors = await server.actor.getRegisteredActors();

      expect(actors.length).toEqual(4);

      expect(actors).toContain(DemoActorCounterImpl.name);
      expect(actors).toContain(DemoActorSayImpl.name);
      expect(actors).toContain(DemoActorReminderImpl.name);
      expect(actors).toContain(DemoActorTimerImpl.name);
    });

    it('should be able to invoke an actor through a text message', async () => {
      const res = await client.actor.invoke("PUT", DemoActorSayImpl.name, "my-actor-id", "sayString", "Hello World");
      expect(res).toEqual(`Actor said: "Hello World"`)
    });

    it('should be able to invoke an actor through an object message', async () => {
      const res = await client.actor.invoke("PUT", DemoActorSayImpl.name, "my-actor-id", "sayObject", { hello: "world" });
      expect(JSON.stringify(res)).toEqual(`{\"said\":{\"hello\":\"world\"}}`)
    });
  });

  describe('timers', () => {
    it('should fire a timer correctly (expected execution time > 5s)', async () => {
      const actorId = `my-actor-counter-id-${(new Date()).getTime()}}`;
      const timerId = "my-timer";

      // Activate our actor
      await client.actor.invoke("PUT", DemoActorTimerImpl.name, actorId, "init");

      // Register a timer
      await client.actor.timerCreate(DemoActorTimerImpl.name, actorId, timerId, {
        callback: "count",  // method name to execute on DemoActorTimerImpl
        dueTime: Temporal.Duration.from({ seconds: 2 }),
        period: Temporal.Duration.from({ seconds: 1 })
      })

      const res0 = await client.actor.invoke("PUT", DemoActorTimerImpl.name, actorId, "getCounter");
      expect(res0).toEqual(0);

      // Now we wait for dueTime (2s)
      await (new Promise(resolve => setTimeout(resolve, 2000)));

      // After that the timer callback will be called
      // In our case, the callback increments the count attribute
      const res1 = await client.actor.invoke("PUT", DemoActorTimerImpl.name, actorId, "getCounter");
      expect(res1).toEqual(1);

      // Every 1 second the timer gets called again, so the count attribute should change
      // we check this twice to ensure correct calling
      await (new Promise(resolve => setTimeout(resolve, 1000)));
      const res2 = await client.actor.invoke("PUT", DemoActorTimerImpl.name, actorId, "getCounter");
      expect(res2).toEqual(2);
      await (new Promise(resolve => setTimeout(resolve, 1000)));
      const res3 = await client.actor.invoke("PUT", DemoActorTimerImpl.name, actorId, "getCounter");
      expect(res3).toEqual(3);

      // Stop the timer
      await client.actor.timerDelete(DemoActorTimerImpl.name, actorId, timerId);

      // We then expect the counter to stop increasing
      await (new Promise(resolve => setTimeout(resolve, 1000)));
      const res4 = await client.actor.invoke("PUT", DemoActorTimerImpl.name, actorId, "getCounter");
      expect(res4).toEqual(3);

      // Stop the timer
      await client.actor.timerDelete(DemoActorTimerImpl.name, actorId, timerId);
    }, 10000);

    it('should fire a timer correctly with the configured data', async () => {
      const actorId = `my-actor`;
      const timerId = "my-timer";

      // Activate our actor
      await client.actor.invoke("PUT", DemoActorTimerImpl.name, actorId, "init");

      // Register a timer
      await client.actor.timerCreate(DemoActorTimerImpl.name, actorId, timerId, {
        callback: "countBy",  // method name to execute on DemoActorTimerImpl
        dueTime: Temporal.Duration.from({ seconds: 2 }),
        period: Temporal.Duration.from({ seconds: 1 }),
        data: 100
      })

      const res0 = await client.actor.invoke("PUT", DemoActorTimerImpl.name, actorId, "getCounter");
      expect(res0).toEqual(0);

      // Now we wait for dueTime (2s)
      await (new Promise(resolve => setTimeout(resolve, 2000)));

      // After that the timer callback will be called
      // In our case, the callback increments the count attribute
      const res1 = await client.actor.invoke("PUT", DemoActorTimerImpl.name, actorId, "getCounter");
      expect(res1).toEqual(100);

      // Stop the timer
      await client.actor.timerDelete(DemoActorTimerImpl.name, actorId, timerId);
    });
  });

  describe('reminders', () => {
    it('should be able to unregister a reminder', async () => {
      const actorId = `my-actor`;
      const reminderId = `my-reminder`;

      // Activate our actor
      await client.actor.invoke("PUT", DemoActorReminderImpl.name, actorId, "init");

      // Register a reminder, it has a default callback
      await client.actor.reminderCreate(DemoActorReminderImpl.name, actorId, reminderId, {
        dueTime: Temporal.Duration.from({ seconds: 2 }),
        period: Temporal.Duration.from({ seconds: 1 }),
        data: 100
      })

      const res0 = await client.actor.invoke("PUT", DemoActorReminderImpl.name, actorId, "getCounter");
      expect(res0).toEqual(0);

      // Now we wait for dueTime (2s)
      await (new Promise(resolve => setTimeout(resolve, 2000)));

      // After that the reminder callback will be called
      // In our case, the callback increments the count attribute
      const res1 = await client.actor.invoke("PUT", DemoActorReminderImpl.name, actorId, "getCounter");
      expect(res1).toEqual(100);

      // Unregister a reminder, it has a default callback
      await client.actor.reminderDelete(DemoActorReminderImpl.name, actorId, reminderId);

      // Now we wait an extra period (2s)
      await (new Promise(resolve => setTimeout(resolve, 2000)));

      // Make sure the counter didn't change
      const res2 = await client.actor.invoke("PUT", DemoActorReminderImpl.name, actorId, "getCounter");
      expect(res2).toEqual(100);
    });

    it('should fire a reminder correctly', async () => {
      const actorId = `my-actor-counter-id-${(new Date()).getTime()}}`;
      const reminderId = `my-reminder`;

      // Activate our actor
      await client.actor.invoke("PUT", DemoActorReminderImpl.name, actorId, "init");

      // Register a reminder, it has a default callback
      await client.actor.reminderCreate(DemoActorReminderImpl.name, actorId, reminderId, {
        dueTime: Temporal.Duration.from({ seconds: 2 }),
        period: Temporal.Duration.from({ seconds: 1 }),
        data: 100
      })

      const res0 = await client.actor.invoke("PUT", DemoActorReminderImpl.name, actorId, "getCounter");
      expect(res0).toEqual(0);

      // Now we wait for dueTime (2s)
      await (new Promise(resolve => setTimeout(resolve, 2000)));

      // After that the timer callback will be called
      // In our case, the callback increments the count attribute
      const res1 = await client.actor.invoke("PUT", DemoActorReminderImpl.name, actorId, "getCounter");
      expect(res1).toEqual(100);

      // Unregister the reminder
      await client.actor.reminderDelete(DemoActorReminderImpl.name, actorId, reminderId);
    });
  });
})