import { DaprClient, DaprServer, HttpMethod } from '../src/http';

const daprHost = "127.0.0.1";
const daprPort = "50050"; // Dapr Sidecar Port of this Example Server
const daprPortApp = "50051"; // App Port of this Example Server
const daprPortActor = "10002"; // Dapr Sidecar Port of the Actor Server
const daprAppId = "test-suite";

describe('http', () => {
    let server: DaprServer;
    let mockBindingReceive = jest.fn(async (data: object) => console.log("mockBindingReceive"));
    let mockPubSubSubscribe = jest.fn(async (data: object) => console.log("mockPubSubSubscribe"));

    // We need to start listening on some endpoints already
    // this because Dapr is not dynamic and registers endpoints on boot
    beforeAll(async () => {
        server = new DaprServer(daprHost, daprPort, daprPortApp);

        await server.binding.receive("binding-mqtt", mockBindingReceive);
        await server.pubsub.subscribe("pubsub-redis", "test-topic", mockPubSubSubscribe);

        // Start server
        await server.startServer();
    });

    describe('binding', () => {
        it('should be able to receive events', async () => {
            const client = new DaprClient(daprHost, daprPort);
            await client.binding.send("binding-mqtt", "create", { hello: "world" });

            
            // Delay a bit for event to arrive
            await new Promise((resolve, reject) => setTimeout(resolve, 250));
            expect(mockBindingReceive.mock.calls.length).toBe(1);
            
            // Also test for receiving data
            // @ts-ignore
            expect(mockBindingReceive.mock.calls[0][0]["hello"]).toEqual("world");
        })
    });

    describe('pubsub', () => {
        it('should be able to send and receive events', async () => {
            const client = new DaprClient(daprHost, daprPort);
            await client.pubsub.publish("pubsub-redis", "test-topic", { hello: "world" });

            // Delay a bit for event to arrive
            await new Promise((resolve, reject) => setTimeout(resolve, 250));

            expect(mockPubSubSubscribe.mock.calls.length).toBe(1);

            // Also test for receiving data
            // @ts-ignore
            expect(mockPubSubSubscribe.mock.calls[0][0]["hello"]).toEqual("world");
        })
    });

    describe('invoker', () => {
        it('should be able to listen and invoke a service with GET', async () => {
            const mock = jest.fn(async (data: object) => ({ hello: "world" }));

            const client = new DaprClient(daprHost, daprPort);

            await server.invoker.listen("hello-world", mock, { method: HttpMethod.GET });
            const res = await client.invoker.invoke(daprAppId, "hello-world", HttpMethod.GET);

            // Delay a bit for event to arrive
            // await new Promise((resolve, reject) => setTimeout(resolve, 250));

            expect(mock.mock.calls.length).toBe(1);
            expect(JSON.stringify(res)).toEqual(`{\"hello\":\"world\"}`);
        })

        it('should be able to listen and invoke a service with POST data', async () => {
            const mock = jest.fn(async (data: object) => ({ hello: "world" }));

            const client = new DaprClient(daprHost, daprPort);

            await server.invoker.listen("hello-world", mock, { method: HttpMethod.POST });
            const res = await client.invoker.invoke(daprAppId, "hello-world", HttpMethod.POST, {
                hello: "world"
            });

            // Delay a bit for event to arrive
            // await new Promise((resolve, reject) => setTimeout(resolve, 250));

            expect(mock.mock.calls.length).toBe(1);
            expect(JSON.stringify(res)).toEqual(`{\"hello\":\"world\"}`);
        })
    });

    describe('secrets', () => {
        it('should be able to correctly fetch the secrets by a single key', async () => {
            const client = new DaprClient(daprHost, daprPort);
            const res = await client.secret.get("secret-envvars", "TEST_SECRET_1");
            expect(JSON.stringify(res)).toEqual(`{\"TEST_SECRET_1\":\"secret_val_1\"}`);
        });

        it('should be able to correctly fetch the secrets in bulk', async () => {
            const client = new DaprClient(daprHost, daprPort);
            const res = await client.secret.getBulk("secret-envvars");
            expect(Object.keys(res).length).toBeGreaterThan(1);
        });
    });

    describe('state', () => {
        it('should be able to save the state', async () => {
            const client = new DaprClient(daprHost, daprPort);
            await client.state.save("state-redis", [
                {
                    key: "key-1",
                    value: "value-1"
                },
                {
                    key: "key-2",
                    value: "value-2"
                },
                {
                    key: "key-3",
                    value: "value-3"
                }
            ]);

            const res = await client.state.get("state-redis", "key-1");
            expect(res).toEqual("value-1");
        });

        it('should be able to get the state in bulk', async () => {
            const client = new DaprClient(daprHost, daprPort);
            await client.state.save("state-redis", [
                {
                    key: "key-1",
                    value: "value-1"
                },
                {
                    key: "key-2",
                    value: "value-2"
                },
                {
                    key: "key-3",
                    value: "value-3"
                }
            ]);

            const res = await client.state.getBulk("state-redis", ["key-3", "key-2"]);

            expect(res[0]["key"]).toEqual("key-3");
            expect(res[0]["data"]).toEqual("value-3");
            expect(res[1]["key"]).toEqual("key-2");
            expect(res[1]["data"]).toEqual("value-2");
        });

        it('should be able to delete a key from the state store', async () => {
            const client = new DaprClient(daprHost, daprPort);
            await client.state.save("state-redis", [
                {
                    key: "key-1",
                    value: "value-1"
                },
                {
                    key: "key-2",
                    value: "value-2"
                },
                {
                    key: "key-3",
                    value: "value-3"
                }
            ]);

            await client.state.delete("state-redis", "key-2");
            const res = await client.state.get("state-redis", "key-2");
            expect(res).toEqual("");
        });

        it('should be able to perform a transaction that replaces a key and deletes another', async () => {
            const client = new DaprClient(daprHost, daprPort);
            await client.state.transaction("state-redis", [
                {
                    operation: "upsert",
                    request: {
                        key: "key-1",
                        value: "my-new-data-1"
                    }
                },
                {
                    operation: "delete",
                    request: {
                        key: "key-3"
                    }
                }
            ]);

            const resTransactionDelete = await client.state.get("state-redis", "key-3");
            const resTransactionUpsert = await client.state.get("state-redis", "key-1");
            expect(resTransactionDelete).toEqual("");
            expect(resTransactionUpsert).toEqual("my-new-data-1");
        });
    });

    // Note: actors require an external dependency and are disabled by default for now until we can have actors in Javascript
    // describe('actors', () => {
    //     it('should be able to invoke a method on an actor', async () => {
    //         const clientActor = new DaprClient(daprHost, daprPortActor);

    //         await clientActor.actor.invoke("POST", "DemoActor", "MyActorId1", "SetDataAsync", { PropertyA: "hello", PropertyB: "world", ToNotExistKey: "this should not exist since we only have PropertyA and PropertyB" });
    //         const res = await clientActor.actor.invoke("GET", "DemoActor", "MyActorId1", "GetDataAsync"); // will only return PropertyA and PropertyB since these are the only properties that can be set

    //         expect(JSON.stringify(res)).toEqual(`{\"propertyA\":\"hello\",\"propertyB\":\"world\"}`);
    //     });

    //     it('should be able to manipulate the state through a transaction of an actor', async () => {
    //         const clientActor = new DaprClient(daprHost, daprPortActor);
    //         await clientActor.actor.stateTransaction("DemoActor", "MyActorId1", [
    //             {
    //                 operation: "upsert",
    //                 request: {
    //                     key: "key-1",
    //                     value: "my-new-data-1"
    //                 }
    //             },
    //             {
    //                 operation: "upsert",
    //                 request: {
    //                     key: "key-to-delete",
    //                     value: "my-new-data-1"
    //                 }
    //             },
    //             {
    //                 operation: "delete",
    //                 request: {
    //                     key: "key-to-delete"
    //                 }
    //             }
    //         ]);

    //         const resActorStateGet = await clientActor.actor.stateGet("DemoActor", "MyActorId1", "key-to-delete");
    //         const resActorStateGet2 = await clientActor.actor.stateGet("DemoActor", "MyActorId1", "key-1");

    //         expect(JSON.stringify(resActorStateGet)).toEqual(`{}`);
    //         expect(JSON.stringify(resActorStateGet2)).toEqual(`\"my-new-data-1\"`);
    //     });

    //     it('should be able to get all the actors', async () => {
    //         const clientActor = new DaprClient(daprHost, daprPortActor);

    //         const res = await clientActor.actor.getActors();
    //         console.log(res)

    //         expect(JSON.stringify(res)).toEqual(`{}`);
    //     });
    // });
})