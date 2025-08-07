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

// @ts-nocheck
import { DaprClient } from "@dapr/dapr";

const LLM_NAME = "echo";

async function main() {
  const daprHost = process.env.DAPR_HOST || "http://localhost";
  const daprHttpPort = process.env.DAPR_HTTP_PORT || "3500";
  const client = new DaprClient({ daprHost, daprPort: daprHttpPort });

  try {
    const response = await client.conversation.converseAsync(
      LLM_NAME,
      [
        {
          messages: [
            {
              of_user: {
                content: [
                  {
                    text: "What is the weather like in San Francisco in celsius?",
                  },
                ],
              },
            },
          ],
          scrub_pii: false,
        },
      ],
      {
        metadata: {
          api_key: "test-key",
          version: "1.0",
        },
        scrub_pii: false,
        temperature: 0.7,
        tools: [
          {
            function: {
              name: "get_weather",
              description: "Get the current weather for a location",
              parameters: {
                type: "object",
                properties: {
                  location: {
                    type: "string",
                    description: "The city and state, e.g. San Francisco, CA",
                  },
                  unit: {
                    type: "string",
                    enum: ["celsius", "fahrenheit"],
                    description: "The temperature unit to use",
                  },
                },
                required: ["location"],
              },
            },
          },
        ],
        tool_choice: "auto",
      },
    );
    console.log("Response:", response);
  } catch (error) {
    console.error("Error:", (error as Error).message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
