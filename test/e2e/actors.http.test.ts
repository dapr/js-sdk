import { DaprClient, DaprServer, Temporal } from '../../src';

import DemoActorCounterImpl from '../actor/DemoActorCounterImpl';
import DemoActorReminderImpl from '../actor/DemoActorReminderImpl';
import DemoActorSayImpl from '../actor/DemoActorSayImpl';
import DemoActorTimerImpl from '../actor/DemoActorTimerImpl';

const serverHost = "127.0.0.1";
const serverPort = "50001";
const sidecarPort = "50000";

describe('http/actors', () => {
    let server: DaprServer;
    let client: DaprClient;

    // We need to start listening on some endpoints already
    // this because Dapr is not dynamic and registers endpoints on boot
    beforeAll(async () => {
        server = new DaprServer(serverHost, serverPort, serverHost, sidecarPort);
        client = new DaprClient(serverHost, sidecarPort);

        // has to be initialized before the server started! 
        // This will initialize the actor routes. 
        // Actors themselves can be initialized later
        await server.actor.init(); 
        server.actor.registerActor(DemoActorCounterImpl);
        server.actor.registerActor(DemoActorSayImpl);
        server.actor.registerActor(DemoActorReminderImpl);
        server.actor.registerActor(DemoActorTimerImpl);
        
        // Start server
        await server.startServer(); // Start the general server
    });

    // describe('invoke', () => {
    //     it('should register actors correctly', async () => {
    //         const actors = await server.actor.getRegisteredActors();

    //         expect(actors.length).toEqual(2);

    //         expect(actors).toContain(DemoActorCounterImpl.name);
    //         expect(actors).toContain(DemoActorSayImpl.name);
    //     });

    //     it('should be able to invoke an actor through a text message', async () => {
    //         const res = await client.actor.invoke("PUT", DemoActorSayImpl.name, "my-actor-id", "sayString", "Hello World");
    //         expect(res).toEqual(`Actor said: "Hello World"`)
    //     });

    //     it('should be able to invoke an actor through an object message', async () => {
    //         const res = await client.actor.invoke("PUT", DemoActorSayImpl.name, "my-actor-id", "sayObject", { hello: "world"});
    //         expect(JSON.stringify(res)).toEqual(`{\"said\":{\"hello\":\"world\"}}`)
    //     });
    // });

    describe('timers', () => {
        it('should fire a timer correctly when the actor configures it itself', async () => {
            // Activate an actor -> this will start the actor which has a timer configured of dueTime = 2s and period = 1s
            const proxy = await client.actor.createProxy(DemoActorTimerImpl, "my-actor-counter");

            proxy.registerTimer(
                "my-timer"
                , DemoActorTimerImpl.prototype.count.name
                , Temporal.Duration.from({ seconds: 2})
                , Temporal.Duration.from({ seconds: 1})
            )

            // Now we wait for dueTime (2s)
            await (new Promise(resolve => setTimeout(resolve, 2000)));

            // After that the timer callback will be called
            // In our case, the callback increments the count attribute
            expect(proxy.count).toEqual(1);

            // Every 1 second the timer gets called again, so the count attribute should change
            // we check this twice to ensure correct calling
            await (new Promise(resolve => setTimeout(resolve, 1000)));
            expect(proxy.counter).toEqual(2);
            await (new Promise(resolve => setTimeout(resolve, 1000)));
            expect(proxy.counter).toEqual(3);
        });

        // it('should fire a timer correctly with the configured dueTime (how long before first call) and period (every x seconds after dueTime)', async () => {
        //     await client.actor.timerCreate(DemoActorCounterImpl.name, "my-actor-counter", "my-timer-name", {
        //         dueTime: Temporal.Duration.from({ seconds: 3 }),
        //         period: Temporal.Duration.from({ seconds: 1 }),
        //         callback: DemoActorCounterImpl.prototype.count.name
        //     })
        // });

        // it('should fire a timer correctly with the configured data', async () => {
        //     const actors = await server.actor.getRegisteredActors();

        //     await client.actor.reminderCreate(DemoActorCounterImpl.name, "my-actor-counter", "my-timer-name", {
        //         callback: DemoActorCounterImpl.prototype.countBy.name,
        //         data: 100,
        //         dueTime: Temporal.Duration.from({ seconds: 3 }),
        //         period: Temporal.Duration.from({ seconds: 1 }),
        //     })

        //     expect(actors.length).toEqual(2);

        //     expect(actors).toContain(DemoActorCounterImpl.name);
        //     expect(actors).toContain(DemoActorSayImpl.name);
        // });

        // it('should delete a timer correctly', async () => {
        //     const actors = await server.actor.getRegisteredActors();

        //     expect(actors.length).toEqual(2);

        //     expect(actors).toContain(DemoActorCounterImpl.name);
        //     expect(actors).toContain(DemoActorSayImpl.name);
        // });

        // it('should return the configured actor timer', async () => {
        //     const actors = await server.actor.getRegisteredActors();

        //     expect(actors.length).toEqual(2);

        //     expect(actors).toContain(DemoActorCounterImpl.name);
        //     expect(actors).toContain(DemoActorSayImpl.name);
        // });
    });

    // describe('reminders', () => {
    //     it('should fire a reminder correctly', async () => {
    //         const actors = await server.actor.getRegisteredActors();

    //         expect(actors.length).toEqual(2);

    //         expect(actors).toContain(DemoActorCounterImpl.name);
    //         expect(actors).toContain(DemoActorSayImpl.name);
    //     });
    // });
})