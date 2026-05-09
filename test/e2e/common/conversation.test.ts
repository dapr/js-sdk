/*
Copyright 2025 The Dapr Authors
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

import { Network, StartedNetwork } from "testcontainers";
import { DaprContainer, StartedDaprContainer } from "@dapr/testcontainer-node";
import { CommunicationProtocolEnum, DaprClient, LogLevel } from "../../../src";
import {
  ConversationInput,
  ConversationOptions,
  ConversationResponse,
} from "../../../src/types/conversation/Conversation.type";
import {
  buildConversationEchoComponent,
  runWithCleanupErrorSuppression,
} from "../helpers/containers";

// The Conversation API alpha2 requires Dapr >= 1.16.
// Use DAPR_RUNTIME_VER to override, otherwise default to 1.16.0.
const CONVERSATION_DAPR_VERSION = process.env.DAPR_RUNTIME_VER || "1.16.0";
const CONVERSATION_RUNTIME_IMAGE = `daprio/daprd:${CONVERSATION_DAPR_VERSION}`;
const CONVERSATION_PLACEMENT_IMAGE = `daprio/placement:${CONVERSATION_DAPR_VERSION}`;
const CONVERSATION_SCHEDULER_IMAGE = `daprio/scheduler:${CONVERSATION_DAPR_VERSION}`;

const loggerSettings = {
  level: LogLevel.Debug,
};

/**
 * Shared test suite for the Conversation API.  Called once per protocol
 * (HTTP and gRPC) so we exercise both transports against a real Dapr sidecar.
 */
function conversationTestSuite(protocol: "HTTP" | "GRPC") {
  let client: DaprClient;
  let network: StartedNetwork;
  let daprContainer: StartedDaprContainer;

  beforeAll(async () => {
    network = await new Network().start();

    daprContainer = await new DaprContainer(CONVERSATION_RUNTIME_IMAGE)
      .withPlacementImage(CONVERSATION_PLACEMENT_IMAGE)
      .withSchedulerImage(CONVERSATION_SCHEDULER_IMAGE)
      .withNetwork(network)
      .withAppChannelAddress("host.testcontainers.internal")
      .withComponent(buildConversationEchoComponent())
      .start();

    const port =
      protocol === "HTTP" ? daprContainer.getHttpPort().toString() : daprContainer.getGrpcPort().toString();
    const commProtocol =
      protocol === "HTTP" ? CommunicationProtocolEnum.HTTP : CommunicationProtocolEnum.GRPC;

    client = new DaprClient({
      daprHost: daprContainer.getHost(),
      daprPort: port,
      communicationProtocol: commProtocol,
      logger: loggerSettings,
    });
  }, 180 * 1000);

  afterAll(async () => {
    await runWithCleanupErrorSuppression(async () => {
      await client.stop();
      await daprContainer.stop();
      await network.stop();
    });
  });

  describe("converse", () => {
    it("should send a simple user message and receive a response", async () => {
      const inputs: ConversationInput[] = [
        {
          messages: [
            {
              role: "user",
              content: [{ text: "Hello, Dapr!" }],
            },
          ],
        },
      ];

      const response: ConversationResponse = await client.conversation.converse("echo", inputs);

      expect(response).toBeDefined();
      expect(response.outputs).toBeDefined();
      expect(response.outputs.length).toBeGreaterThan(0);
      expect(response.outputs[0].choices).toBeDefined();
      expect(response.outputs[0].choices.length).toBeGreaterThan(0);
      expect(response.outputs[0].choices[0].message).toBeDefined();
      expect(response.outputs[0].choices[0].message!.content).toBeDefined();
    });

    it("should send a system message", async () => {
      const inputs: ConversationInput[] = [
        {
          messages: [
            {
              role: "system",
              content: [{ text: "You are a helpful assistant." }],
            },
            {
              role: "user",
              content: [{ text: "Repeat after me: test" }],
            },
          ],
        },
      ];

      const response = await client.conversation.converse("echo", inputs);

      expect(response).toBeDefined();
      expect(response.outputs).toBeDefined();
      expect(response.outputs.length).toBeGreaterThan(0);
    });

    it("should pass metadata in options", async () => {
      const inputs: ConversationInput[] = [
        {
          messages: [{ role: "user", content: [{ text: "test with metadata" }] }],
        },
      ];

      const options: ConversationOptions = {
        metadata: { "test-key": "test-value" },
      };

      const response = await client.conversation.converse("echo", inputs, options);

      expect(response).toBeDefined();
      expect(response.outputs).toBeDefined();
      expect(response.outputs.length).toBeGreaterThan(0);
    });

    it("should pass temperature in options", async () => {
      const inputs: ConversationInput[] = [
        {
          messages: [{ role: "user", content: [{ text: "test with temperature" }] }],
        },
      ];

      const options: ConversationOptions = {
        temperature: 0.7,
      };

      const response = await client.conversation.converse("echo", inputs, options);

      expect(response).toBeDefined();
      expect(response.outputs).toBeDefined();
      expect(response.outputs.length).toBeGreaterThan(0);
    });

    it("should handle multiple inputs", async () => {
      const inputs: ConversationInput[] = [
        {
          messages: [{ role: "user", content: [{ text: "First message" }] }],
        },
        {
          messages: [{ role: "user", content: [{ text: "Second message" }] }],
        },
      ];

      const response = await client.conversation.converse("echo", inputs);

      expect(response).toBeDefined();
      expect(response.outputs).toBeDefined();
      // The echo component should return results for all inputs
      expect(response.outputs.length).toBeGreaterThanOrEqual(1);
    });

    it("should handle multiple content items in a single message", async () => {
      const inputs: ConversationInput[] = [
        {
          messages: [
            {
              role: "user",
              content: [{ text: "Part 1" }, { text: "Part 2" }],
            },
          ],
        },
      ];

      const response = await client.conversation.converse("echo", inputs);

      expect(response).toBeDefined();
      expect(response.outputs).toBeDefined();
      expect(response.outputs.length).toBeGreaterThan(0);
    });

    it("should reject requests for non-existent component", async () => {
      const inputs: ConversationInput[] = [
        {
          messages: [{ role: "user", content: [{ text: "test" }] }],
        },
      ];

      await expect(client.conversation.converse("non-existent-component", inputs)).rejects.toThrow();
    });
  });
}

describe("common/conversation/http", () => {
  conversationTestSuite("HTTP");
});

describe("common/conversation/grpc", () => {
  conversationTestSuite("GRPC");
});
