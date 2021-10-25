import { DaprClient, DaprServer, Temporal } from '../../src';

import DemoActorActivateImpl from '../actor/DemoActorActivateImpl';
import DemoActorCounterImpl from '../actor/DemoActorCounterImpl';
import DemoActorReminderImpl from '../actor/DemoActorReminderImpl';
import DemoActorReminder2Impl from '../actor/DemoActorReminder2Impl';
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
    // Start server and client
    server = new DaprServer(serverHost, serverPort, sidecarHost, sidecarPort);
    client = new DaprClient(sidecarHost, sidecarPort);

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
    await server.startServer(); // Start the general server
  });

  describe('activation/deactivation', () => {
    it('should correctly deactivate and activate an actor', async () => {
      // An actor is activated when we create the object and it has been added to the tracking table
      // for a good E2E test we thus check:
      // * has it been added to the tracking table?
      //   -> Indirectly, we expect this by calling the Dapr client, which should be able to find the Actor in its tracking table
      //   -> we thus use the client rather than the server methods
      // * has the method onActivate been called on the implemented actor? 
      //   -> create a specific actor implementation for this, since it's threaded and hard to mock else

      // Reset state store
      // for this we activate and deactivate the actor first so we know it exists
      await client.actor.invoke("GET", DemoActorActivateImpl.name, "my-actor-id", "getIsActivated");
      await server.actor.deactivateActor(DemoActorActivateImpl.name, "my-actor-id");
      await client.actor.stateTransaction(DemoActorActivateImpl.name, "my-actor-id", [
        {
          operation: "upsert",
          request: {
            key: "is_activated",
            value: false
          }
        },
        {
          operation: "upsert",
          request: {
            key: "is_deactivated",
            value: false
          }
        },
        {
          operation: "upsert",
          request: {
            key: "call_count_activated",
            value: 0
          }
        },
        {
          operation: "upsert",
          request: {
            key: "call_count_deactivated",
            value: 0
          }
        },
      ]);

      // Activate Actor
      const res1 = await client.actor.invoke("GET", DemoActorActivateImpl.name, "my-actor-id", "getIsDeactivated");
      const res2 = await client.actor.invoke("GET", DemoActorActivateImpl.name, "my-actor-id", "getIsActivated");
      const res3 = await client.actor.invoke("GET", DemoActorActivateImpl.name, "my-actor-id", "getDeactivatedCallCount");
      const res4 = await client.actor.invoke("GET", DemoActorActivateImpl.name, "my-actor-id", "getActivatedCallCount");
      expect(res1).toEqual(false);
      expect(res2).toEqual(true);
      expect(res3).toEqual(0);
      expect(res4).toEqual(1);

      // Deactivate Actor
      await server.actor.deactivateActor(DemoActorActivateImpl.name, "my-actor-id");

      // Now call the getIsDeactivated and getDeactivatedCallCount again, which should change since it was deactivated
      // note: it will be reactivated again now since we call the invoke
      const res5 = await client.actor.invoke("GET", DemoActorActivateImpl.name, "my-actor-id", "getIsDeactivated");
      const res6 = await client.actor.invoke("GET", DemoActorActivateImpl.name, "my-actor-id", "getIsActivated");
      const res7 = await client.actor.invoke("GET", DemoActorActivateImpl.name, "my-actor-id", "getDeactivatedCallCount");
      const res8 = await client.actor.invoke("GET", DemoActorActivateImpl.name, "my-actor-id", "getActivatedCallCount");
      expect(res5).toEqual(true);
      expect(res6).toEqual(true);
      expect(res7).toEqual(1);
      expect(res8).toEqual(2);

      // Deactivate Actor
      await server.actor.deactivateActor(DemoActorActivateImpl.name, "my-actor-id");

      const res9 = await client.actor.invoke("GET", DemoActorActivateImpl.name, "my-actor-id", "getIsDeactivated");
      const res10 = await client.actor.invoke("GET", DemoActorActivateImpl.name, "my-actor-id", "getIsActivated");
      const res11 = await client.actor.invoke("GET", DemoActorActivateImpl.name, "my-actor-id", "getDeactivatedCallCount");
      const res12 = await client.actor.invoke("GET", DemoActorActivateImpl.name, "my-actor-id", "getActivatedCallCount");
      expect(res9).toEqual(true);
      expect(res10).toEqual(true);
      expect(res11).toEqual(2);
      expect(res12).toEqual(3);
    });
  });

  describe('invoke', () => {
    it('should register actors correctly', async () => {
      const actors = await server.actor.getRegisteredActors();

      expect(actors.length).toEqual(6);

      expect(actors).toContain(DemoActorCounterImpl.name);
      expect(actors).toContain(DemoActorSayImpl.name);
      expect(actors).toContain(DemoActorReminderImpl.name);
      expect(actors).toContain(DemoActorTimerImpl.name);
      expect(actors).toContain(DemoActorActivateImpl.name);
    });

    it('should be able to invoke an actor through a text message', async () => {
      const res = await client.actor.invoke("PUT", DemoActorSayImpl.name, "my-actor-id", "sayString", "Hello World");
      expect(res).toEqual(`Actor said: "Hello World"`)
    });

    it('should be able to invoke an actor through an object message', async () => {
      const res = await client.actor.invoke("PUT", DemoActorSayImpl.name, "my-actor-id", "sayObject", { hello: "world" });
      expect(JSON.stringify(res)).toEqual(`{"said":{"hello":"world"}}`)
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
      const actorId = `my-actor-for-reminder-unregistering`;
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
      const actorId = `my-actor-counter-id-for-reminder-firing`;
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

    it('should fire a reminder but with a warning if it\'s not implemented correctly', async () => {
      const actorId = `my-actor-counter-id-for-reminder-implementation-check`;
      const reminderId = `my-reminder-2`;

      // Create spy object
      const spy = jest.spyOn(global.console, 'warn');

      // Activate our actor
      await client.actor.invoke("PUT", DemoActorReminder2Impl.name, actorId, "init");

      // Register a reminder, it has a default callback
      await client.actor.reminderCreate(DemoActorReminder2Impl.name, actorId, reminderId, {
        dueTime: Temporal.Duration.from({ seconds: 2 }),
        period: Temporal.Duration.from({ seconds: 1 }),
        data: 100
      });

      const res0 = await client.actor.invoke("PUT", DemoActorReminder2Impl.name, actorId, "getCounter");
      expect(res0).toEqual(0);

      // Now we wait for dueTime (2s)
      await (new Promise(resolve => setTimeout(resolve, 2000)));

      // The method receiveReminder on AbstractActor should be called at least once
      // this will state the not implemented function
      expect(spy.mock.calls[0].length).toBe(1);
      expect(spy.mock.calls[0][0]).toEqual(`{"error":"ACTOR_METHOD_NOT_IMPLEMENTED","errorMsg":"A reminder was created for the actor with id: ${actorId} but the method 'receiveReminder' was not implemented"}`);

      // Unregister the reminder
      await client.actor.reminderDelete(DemoActorReminder2Impl.name, actorId, reminderId);
    });
  });
})