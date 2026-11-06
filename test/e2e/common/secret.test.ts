/*
Copyright 2026 The Dapr Authors
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

import { SecretStoreHarness } from "@dapr/testcontainer-node";
import { CommunicationProtocolEnum, DaprClient, LogLevel } from "../../../src";
import { DAPR_TEST_RUNTIME_IMAGE, runWithCleanupErrorSuppression } from "../helpers/containers";

describe("common/secret", () => {
  let harness: SecretStoreHarness | undefined;
  const clients = new Map<CommunicationProtocolEnum, DaprClient>();

  beforeAll(async () => {
    harness = new SecretStoreHarness({
      daprRuntimeImage: DAPR_TEST_RUNTIME_IMAGE,
      multiValued: true,
      secrets: {
        database: {
          username: "test-user",
          password: "test-password",
        },
        token: "test-token",
      },
    });
    await harness.start();
    for (const protocol of [CommunicationProtocolEnum.HTTP, CommunicationProtocolEnum.GRPC]) {
      clients.set(
        protocol,
        new DaprClient({
          communicationProtocol: protocol,
          daprHost: harness.getHost(),
          daprPort: String(protocol === CommunicationProtocolEnum.HTTP ? harness.getHttpPort() : harness.getGrpcPort()),
          logger: { level: LogLevel.Error },
        }),
      );
    }
  }, 180_000);

  afterAll(async () => {
    await runWithCleanupErrorSuppression(async () => {
      try {
        await Promise.all([...clients.values()].map((client) => client.stop()));
      } finally {
        await harness?.stop();
      }
    });
  }, 60_000);

  describe.each([
    ["HTTP", CommunicationProtocolEnum.HTTP],
    ["gRPC", CommunicationProtocolEnum.GRPC],
  ] as const)("%s", (_name, protocol) => {
    const getClient = (): DaprClient => {
      const client = clients.get(protocol);
      if (client === undefined) throw new Error("Secret client was not initialized");
      return client;
    };

    it("returns every key/value pair of a multi-valued secret", async () => {
      const res = await getClient().secret.get(harness!.getSecretStoreName(), "database");
      expect(res).toEqual({ username: "test-user", password: "test-password" });
    });

    it("returns a single-valued secret keyed by its name", async () => {
      const res = await getClient().secret.get(harness!.getSecretStoreName(), "token");
      expect(res).toEqual({ token: "test-token" });
    });
  });
});
