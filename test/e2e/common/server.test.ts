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
const topic = "test-topic";

describe("common/server", () => {
  let httpServer: DaprServer;
  let grpcServer: DaprServer;

  const mockSubscribeHandler = jest.fn(async (_data: object) => null);

  beforeAll(async () => {
    httpServer = new DaprServer(serverHost, serverHttpPort, daprHost, daprHttpPort, CommunicationProtocolEnum.HTTP);
    grpcServer = new DaprServer(serverHost, serverGrpcPort, daprHost, daprGrpcPort, CommunicationProtocolEnum.GRPC);

    await httpServer.pubsub.subscribe(pubSubName, topic, mockSubscribeHandler);
    await grpcServer.pubsub.subscribe(pubSubName, topic, mockSubscribeHandler);

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
  const runIt = (name: string, fn: (server: DaprServer) => void) => {
    it("http/" + name, () => fn(httpServer));
    it("grpc/" + name, () => fn(grpcServer));
  };

  describe("pubsub", () => {
    runIt("should be able to send and receive plain events", async (server: DaprServer) => {
      const messages = ["message1", "message2", "message3"];
      await server.client.pubsub.publishBulk(pubSubName, topic, messages);

      // Delay a bit for events to arrive
      await new Promise((resolve) => setTimeout(resolve, 250));

      expect(mockSubscribeHandler.mock.calls.length).toBe(3);
      // Check that the messages are present
      mockSubscribeHandler.mock.calls.forEach((call) => {
        let message = JSON.stringify(call[0]);
        // This is required because the message is wrapped in quotes when sent via gRPC.
        message = message.replace(/"/g, "");
        message = message.replace(/\\/g, "");
        expect(messages).toContain(message);
      });
    });
  });
});
