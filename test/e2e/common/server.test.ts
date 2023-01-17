/*
Copyright 2023 The Dapr Authors
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

import { CommunicationProtocolEnum, DaprServer } from "../../../src";

const serverHost = "127.0.0.1";
const serverGrpcPort = "50001";
const serverHttpPort = "3501";
const daprHost = "127.0.0.1";
const daprGrpcPort = "50000";
const daprHttpPort = "3500";

const pubSubName = "pubsub-redis";
const getTopic = (protocol: string) => "test-topic" + "-" + protocol;
const getTopicRawPayload = (protocol: string) => "test-topic-raw" + "-" + protocol;

describe("common/server", () => {
    let httpServer: DaprServer;
    let grpcServer: DaprServer;

    const mockSubscribeHandler = jest.fn(async (_data: object) => null);

    beforeAll(async () => {
        httpServer = new DaprServer(serverHost, serverHttpPort, daprHost, daprHttpPort, CommunicationProtocolEnum.HTTP);
        grpcServer = new DaprServer(serverHost, serverGrpcPort, daprHost, daprGrpcPort, CommunicationProtocolEnum.GRPC);

        await httpServer.pubsub.subscribe(pubSubName, getTopic("http"), mockSubscribeHandler);
        await grpcServer.pubsub.subscribe(pubSubName, getTopic("grpc"), mockSubscribeHandler);

        await httpServer.pubsub.subscribe(pubSubName, getTopicRawPayload("http"), mockSubscribeHandler, undefined, { rawPayload: true });
        await grpcServer.pubsub.subscribe(pubSubName, getTopicRawPayload("grpc"), mockSubscribeHandler, undefined, { rawPayload: true });

        await httpServer.start();
        await grpcServer.start();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await httpServer.stop();
        await grpcServer.stop();
    });

    // Helper function to run the test for both HTTP and gRPC.
    const runIt = (name: string, fn: (server: DaprServer, protocol: string) => void) => {
        it("http/" + name, () => fn(httpServer, "http"));
        it("grpc/" + name, () => fn(grpcServer, "grpc"));
    };

    describe("pubsub", () => {
        runIt("should be able to send and receive plain events", async (server: DaprServer, protocol: string) => {
            await server.client.pubsub.publish(pubSubName, getTopic(protocol), "Hello, world!");

            // Delay a bit for event to arrive
            await new Promise((resolve, _reject) => setTimeout(resolve, 250));

            expect(mockSubscribeHandler.mock.calls.length).toBe(1);
            expect(mockSubscribeHandler.mock.calls[0][0]).toEqual("Hello, world!");
        });

        runIt("should be able to send and receive JSON events", async (server: DaprServer, protocol: string) => {
            await server.client.pubsub.publish(pubSubName, getTopic(protocol), { message: "Hello, world!" });

            // Delay a bit for event to arrive
            await new Promise((resolve, _reject) => setTimeout(resolve, 250));

            expect(mockSubscribeHandler.mock.calls.length).toBe(1);
            expect(mockSubscribeHandler.mock.calls[0][0]).toEqual({ message: "Hello, world!" });
        });

        runIt("should be able to send and receive cloud events", async (server: DaprServer, protocol: string) => {
            const ce = {
                specversion: "1.0",
                type: "com.github.pull.create",
                source: "https://github.com/cloudevents/spec/pull",
                id: "A234-1234-1234",
                data: "Hello, world!",
                datacontenttype: "text/plain",
            };

            await server.client.pubsub.publish(pubSubName, getTopic(protocol), ce);

            // Delay a bit for event to arrive
            await new Promise((resolve, _reject) => setTimeout(resolve, 500));

            expect(mockSubscribeHandler.mock.calls.length).toBe(1);
            expect(mockSubscribeHandler.mock.calls[0][0]).toEqual("Hello, world!");
        });

        runIt("should be able to send plain events and receive as raw payload", async (server: DaprServer, protocol: string) => {
            await server.client.pubsub.publish(pubSubName, getTopicRawPayload(protocol), "Hello, world!");

            // Delay a bit for event to arrive
            await new Promise((resolve, _reject) => setTimeout(resolve, 250));

            expect(mockSubscribeHandler.mock.calls.length).toBe(1);
            const rawData: any = mockSubscribeHandler.mock.calls[0][0];
            expect(rawData["data"]).toEqual("Hello, world!");
        });

        runIt("should be able to send and receive plain events as raw payload", async (server: DaprServer, protocol: string) => {
            await server.client.pubsub.publish(pubSubName, getTopicRawPayload(protocol), "Hello, world!", { "rawPayload": "true" });

            // Delay a bit for event to arrive
            await new Promise((resolve, _reject) => setTimeout(resolve, 250));

            expect(mockSubscribeHandler.mock.calls.length).toBe(1);
            expect(mockSubscribeHandler.mock.calls[0][0]).toEqual("Hello, world!");
        });
    });
});
