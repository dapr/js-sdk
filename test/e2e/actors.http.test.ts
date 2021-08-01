import { DaprClient, DaprServer } from '../../src';

import DemoActorCounterImpl from '../actor/DemoActorCounterImpl';
import DemoActorSayImpl from '../actor/DemoActorSayImpl';

const serverHost = "127.0.0.1";
const serverPort = "50001";
const sidecarPort = "50000";

describe('http/actors', () => {
    let server: DaprServer;
    let client: DaprClient;

    // We need to start listening on some endpoints already
    // this because Dapr is not dynamic and registers endpoints on boot
    beforeAll(async () => {
        server = new DaprServer(serverHost, serverPort);
        client = new DaprClient(serverHost, sidecarPort);

        // has to be initialized before the server started! 
        // This will initialize the actor routes. 
        // Actors themselves can be initialized later
        await server.actor.init(); 
        server.actor.registerActor(DemoActorCounterImpl);
        server.actor.registerActor(DemoActorSayImpl);
        
        // Start server
        await server.startServer(); // Start the general server
    });

    describe('actors', () => {
        it('should register actors correctly', async () => {
            const actors = await server.actor.getRegisteredActors();

            expect(actors.length).toEqual(2);

            expect(actors).toContain(DemoActorCounterImpl.name);
            expect(actors).toContain(DemoActorSayImpl.name);
        });

        it('should be able to invoke an actor through a text message', async () => {
            const res = await client.actor.invoke("PUT", DemoActorSayImpl.name, "my-actor-id", "sayString", "Hello World");
            expect(res).toEqual(`Actor said: "Hello World"`)
        });

        it('should be able to invoke an actor through an object message', async () => {
            const res = await client.actor.invoke("PUT", DemoActorSayImpl.name, "my-actor-id", "sayObject", { hello: "world"});
            expect(JSON.stringify(res)).toEqual(`{\"said\":{\"hello\":\"world\"}}`)
        });
    });
})