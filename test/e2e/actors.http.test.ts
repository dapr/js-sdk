import { DaprClient, DaprServer } from '../../src';

import DemoCounterActorImpl from '../actor/DemoCounterActorImpl';

const serverHost = "127.0.0.1";
const serverPort = "50051";

describe('http/actors', () => {
    let server: DaprServer;

    // We need to start listening on some endpoints already
    // this because Dapr is not dynamic and registers endpoints on boot
    beforeAll(async () => {
        server = new DaprServer(serverHost, serverPort);

        // has to be initialized before the server started! 
        // This will initialize the actor routes. 
        // Actors themselves can be initialized later
        await server.actor.init(); 
        
        // Start server
        await server.startServer(); // Start the general server
    });

    describe('actors', () => {
        it('should be able to register an actor', async () => {
            // const server = new DaprServer(serverHost, serverPort);
            server.actor.registerActor(DemoCounterActorImpl);

            const actors = await server.actor.getRegisteredActors();

            expect(actors.length).toEqual(1);
            expect(actors).toContain(DemoCounterActorImpl.name);
        })
    });
})