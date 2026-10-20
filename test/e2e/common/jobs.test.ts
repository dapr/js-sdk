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

import { randomUUID } from "node:crypto";
import { AddressInfo } from "node:net";
import { Network, StartedNetwork, TestContainers, Wait } from "testcontainers";
import { DaprContainer, StartedDaprContainer } from "@dapr/testcontainer-node";
import { CommunicationProtocolEnum, CronExpressionBuilder, DaprClient, DaprServer, Job } from "../../../src";
import GRPCServer from "../../../src/implementation/Server/GRPCServer/GRPCServer";
import HTTPServer from "../../../src/implementation/Server/HTTPServer/HTTPServer";
import { DaprGrpcAppContainer, StartedGrpcDaprContainer } from "../helpers/DaprGrpcAppContainer";
import { DAPR_TEST_RUNTIME_IMAGE, DAPR_TEST_PLACEMENT_IMAGE, DAPR_TEST_SCHEDULER_IMAGE } from "../helpers/containers";
import { DAPR_TEST_VERSION } from "../helpers/runtimeVersion";

const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
async function waitFor(predicate: () => boolean, timeout = 15000): Promise<void> {
  const deadline = Date.now() + timeout;
  while (!predicate()) {
    if (Date.now() >= deadline) {
      throw new Error("Timed out waiting for job callbacks");
    }
    await sleep(50);
  }
}

describe.each([CommunicationProtocolEnum.HTTP, CommunicationProtocolEnum.GRPC])(
  `Jobs on Dapr ${DAPR_TEST_VERSION}, callback protocol %s`,
  (callbackProtocol) => {
    let network: StartedNetwork | undefined;
    let container: StartedDaprContainer | StartedGrpcDaprContainer | undefined;
    let server: DaprServer;
    let clients: DaprClient[];

    beforeAll(async () => {
      network = await new Network().start();
      server = new DaprServer({ communicationProtocol: callbackProtocol, serverHost: "0.0.0.0", serverPort: "0" });
      await server.daprServer.start("0.0.0.0", "0");
      const transport = server.daprServer;
      const address =
        transport instanceof GRPCServer
          ? transport.server.address()
          : (transport as HTTPServer).serverInstance?.address();
      const port = (address as AddressInfo).port;
      await TestContainers.exposeHostPorts(port);
      if (callbackProtocol === CommunicationProtocolEnum.GRPC) {
        container = await new DaprGrpcAppContainer()
          .withNetwork(network)
          .withCopyContentToContainer([{ content: "", target: "/dapr-resources/.keep" }])
          .withAppId(`jobs-${randomUUID()}`)
          .withAppPort(port)
          .withAppChannelAddress("host.testcontainers.internal")
          .withWaitStrategy(
            Wait.forHttp("/v1.0/healthz/outbound", 3500)
              .withHeaders({ "dapr-api-token": "jobs-token" })
              .forStatusCode(204),
          )
          .withContainerEnvironment({ DAPR_API_TOKEN: "jobs-token" })
          .start();
      } else {
        container = await new DaprContainer(DAPR_TEST_RUNTIME_IMAGE)
          .withNetwork(network)
          .withPlacementImage(DAPR_TEST_PLACEMENT_IMAGE)
          .withSchedulerImage(DAPR_TEST_SCHEDULER_IMAGE)
          .withAppName(`jobs-${randomUUID()}`)
          .withAppPort(port)
          .withAppChannelAddress("host.testcontainers.internal")
          .withEnvironment({ DAPR_API_TOKEN: "jobs-token" })
          .start();
      }
      clients = [CommunicationProtocolEnum.HTTP, CommunicationProtocolEnum.GRPC].map(
        (protocol) =>
          new DaprClient({
            communicationProtocol: protocol,
            daprHost: container!.getHost(),
            daprPort: String(
              protocol === CommunicationProtocolEnum.HTTP ? container!.getHttpPort() : container!.getGrpcPort(),
            ),
            daprApiToken: "jobs-token",
          }),
      );
      await Promise.all(clients.map((client) => client.start()));
    }, 180000);

    afterAll(async () => {
      try {
        await Promise.all((clients ?? []).map((client) => client.stop()));
      } finally {
        try {
          // Close the sidecar's persistent gRPC app-channel connection before stopping the listener.
          await container?.stop();
        } finally {
          try {
            await server?.stop();
            await server?.client.stop();
          } finally {
            await network?.stop();
          }
        }
      }
    }, 90000);

    describe.each([0, 1])("client protocol %s", (index) => {
      const name = () => `job-${randomUUID()}`;
      let client: DaprClient;
      let other: DaprClient;
      beforeEach(() => {
        client = clients[index];
        other = clients[1 - index];
      });

      it("round-trips timing, JSON, and failure policies across transports; refuses accidental overwrite", async () => {
        const id = name();
        const options = {
          schedule: "@every 1h",
          dueTime: "1h",
          ttl: "2h",
          repeats: 3,
          data: { values: [0, false, "", null], text: "payload" },
          failurePolicy: { type: "constant" as const, interval: "0.125s", maxRetries: 0 },
        };
        try {
          await client.jobs.schedule(id, options);
          const saved = await other.jobs.get(id);
          expect(saved).toMatchObject({
            name: id,
            schedule: options.schedule,
            repeats: 3,
            data: options.data,
            failurePolicy: options.failurePolicy,
          });
          expect(saved.dueTime).toBeDefined();
          expect(saved.ttl).toBeDefined();
          await expect(client.jobs.schedule(id, { dueTime: "1h" })).rejects.toThrow();
          expect((await other.jobs.get(id)).data).toEqual(options.data);
          await other.jobs.schedule(id, {
            dueTime: "1h",
            data: false,
            overwrite: true,
            failurePolicy: { type: "drop" },
          });
          expect(await client.jobs.get(id)).toMatchObject({ data: false, failurePolicy: { type: "drop" } });
          await client.jobs.delete(id);
          await expect(other.jobs.get(id)).rejects.toThrow();
          await other.jobs.delete(id);
        } finally {
          await client.jobs.delete(id);
        }
      });

      it("delivers scalar, null, array and object JSON values without loss", async () => {
        for (const data of [false, 0, "", null, [1, false], { value: "hello" }]) {
          const id = name();
          const received: Job["data"][] = [];
          await server.jobs.listen(id, async (payload) => {
            received.push(payload);
          });
          await client.jobs.schedule(id, { dueTime: "100ms", data });
          await waitFor(() => received.length > 0);
          expect(received).toEqual([data]);
        }
      }, 30000);

      it("uses cron builder output, honors repeats, and stops after deletion", async () => {
        const id = name();
        let calls = 0;
        await server.jobs.listen(id, async () => {
          calls++;
        });
        try {
          await client.jobs.schedule(id, {
            schedule: new CronExpressionBuilder().every("second", 1).withTimeZone("UTC"),
            repeats: 2,
          });
          await waitFor(() => calls >= 2);
          await sleep(1500);
          expect(calls).toBe(2);
          await client.jobs.schedule(id, { dueTime: "2s", overwrite: true });
          await other.jobs.delete(id);
          await sleep(2500);
          expect(calls).toBe(2);
        } finally {
          await client.jobs.delete(id);
        }
      }, 20000);

      it("applies retry and drop policies to rejected callbacks", async () => {
        const retryId = name();
        let retries = 0;
        await server.jobs.listen(retryId, async () => {
          retries++;
          if (retries < 3) {
            throw new Error("retry me");
          }
        });
        const dropId = name();
        let dropped = 0;
        await server.jobs.listen(dropId, async () => {
          dropped++;
          throw new Error("drop me");
        });
        try {
          await client.jobs.schedule(retryId, {
            dueTime: "100ms",
            failurePolicy: { type: "constant", interval: "0.2s", maxRetries: 2 },
          });
          await client.jobs.schedule(dropId, { dueTime: "100ms", failurePolicy: { type: "drop" } });
          await waitFor(() => retries === 3 && dropped === 1);
          await sleep(1000);
          expect(retries).toBe(3);
          expect(dropped).toBe(1);
        } finally {
          await client.jobs.delete(retryId);
          await client.jobs.delete(dropId);
        }
      }, 20000);

      it("rejects invalid runtime schedules and missing jobs without success-shaped results", async () => {
        await expect(client.jobs.schedule(name(), { schedule: "this is not cron" })).rejects.toThrow();
        await expect(client.jobs.schedule(name(), { dueTime: "not a time" })).rejects.toThrow();
        await expect(client.jobs.get(name())).rejects.toThrow();
      });

      it("bounds exhausted retries and stops recurring jobs at their TTL", async () => {
        const failedId = name();
        const expiringId = name();
        let failures = 0;
        let ticks = 0;
        await server.jobs.listen(failedId, async () => {
          failures++;
          throw new Error("persistent failure");
        });
        await server.jobs.listen(expiringId, async () => {
          ticks++;
        });
        try {
          await client.jobs.schedule(failedId, {
            dueTime: "100ms",
            failurePolicy: { type: "constant", interval: "0.2s", maxRetries: 2 },
          });
          await client.jobs.schedule(expiringId, { schedule: "@every 1s", ttl: "3s" });
          await waitFor(() => failures >= 3 && ticks > 0);
          await sleep(4000);
          const finalTicks = ticks;
          await sleep(1200);
          expect(failures).toBe(3);
          expect(ticks).toBe(finalTicks);
          expect(ticks).toBeLessThanOrEqual(3);
        } finally {
          await client.jobs.delete(failedId);
          await client.jobs.delete(expiringId);
        }
      }, 20000);
    });

    it("interoperates with .NET-style opaque gRPC payloads", async () => {
      const grpc = clients[1];
      for (const data of [Buffer.alloc(0), Buffer.from([0, 255, 128, 1])]) {
        const id = `bytes-${randomUUID()}`;
        try {
          await grpc.jobs.schedule(id, { dueTime: "1h", data });
          expect((await grpc.jobs.get(id)).data).toEqual(data);
          if (callbackProtocol === CommunicationProtocolEnum.GRPC) {
            const received: Job["data"][] = [];
            await server.jobs.listen(id, async (value) => {
              received.push(value);
            });
            await grpc.jobs.schedule(id, { dueTime: "100ms", data, overwrite: true });
            await waitFor(() => received.length === 1);
            expect(received[0]).toEqual(data);
          }
        } finally {
          await grpc.jobs.delete(id);
        }
      }
    });
  },
);
