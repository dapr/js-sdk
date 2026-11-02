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

import express from "express";
import { Server } from "node:http";
import { AddressInfo } from "node:net";
import { Network, StartedNetwork, TestContainers } from "testcontainers";
import { DaprContainer, StartedDaprContainer } from "@dapr/testcontainer-node";
import { CommunicationProtocolEnum, DaprClient, HttpMethod, withBaggage } from "../../../src";
import {
  buildInMemoryPubSubComponent,
  DAPR_TEST_RUNTIME_IMAGE,
  DAPR_TEST_PLACEMENT_IMAGE,
  DAPR_TEST_SCHEDULER_IMAGE,
  runWithCleanupErrorSuppression,
} from "../helpers/containers";

const appId = "test-baggage";

describe("baggage propagation through Dapr", () => {
  let appServer: Server | undefined;
  let network: StartedNetwork | undefined;
  let dapr: StartedDaprContainer | undefined;
  const clients: DaprClient[] = [];

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    app.get("/echo", (req, res) => {
      res.json({ baggage: req.headers.baggage ?? null });
    });
    app.get("/failure", (_req, res) => {
      res.status(500).json({ error: "intentional failure" });
    });
    appServer = await new Promise<Server>((resolve) => {
      const listener = app.listen(0, "0.0.0.0", () => resolve(listener));
    });
    const port = (appServer.address() as AddressInfo).port;
    await TestContainers.exposeHostPorts(port);
    network = await new Network().start();
    dapr = await new DaprContainer(DAPR_TEST_RUNTIME_IMAGE)
      .withPlacementImage(DAPR_TEST_PLACEMENT_IMAGE)
      .withSchedulerImage(DAPR_TEST_SCHEDULER_IMAGE)
      .withNetwork(network)
      .withAppName(appId)
      .withAppPort(port)
      .withAppChannelAddress("host.testcontainers.internal")
      .withComponent(buildInMemoryPubSubComponent())
      .start();

    for (const protocol of [CommunicationProtocolEnum.HTTP, CommunicationProtocolEnum.GRPC]) {
      const client = new DaprClient({
        daprHost: dapr.getHost(),
        daprPort: String(protocol === CommunicationProtocolEnum.HTTP ? dapr.getHttpPort() : dapr.getGrpcPort()),
        communicationProtocol: protocol,
      });
      clients.push(client);
      await client.start();
    }
  }, 180_000);

  afterAll(
    () =>
      runWithCleanupErrorSuppression(async () => {
        await Promise.all(clients.map((client) => client.stop()));
        await dapr?.stop();
        await network?.stop();
        if (appServer) {
          await new Promise<void>((resolve, reject) =>
            appServer!.close((error) => (error ? reject(error) : resolve())),
          );
        }
      }),
    60_000,
  );

  describe.each([
    ["HTTP", 0],
    ["gRPC", 1],
  ] as const)("%s", (_name, index) => {
    const invoke = (method = "echo") => clients[index].invoker.invoke(appId, method, HttpMethod.GET);

    it("forwards encoded baggage to the application and omits it outside the callback", async () => {
      expect(await invoke()).toEqual({ baggage: null });
      const result = await withBaggage({ "user-id": "12345", tenant: "acme inc", value: "a,b;\u00e9" }, async () => {
        await Promise.resolve();
        return await invoke();
      });
      expect(result).toEqual({ baggage: "user-id=12345,tenant=acme%20inc,value=a%2Cb%3B%C3%A9" });
      expect(await invoke()).toEqual({ baggage: null });
      expect(await withBaggage({}, () => invoke())).toEqual({ baggage: null });
    });

    it("isolates concurrent callers using the same client", async () => {
      const result = await Promise.all(
        ["first", "second", "third"].map((tenant) =>
          withBaggage({ tenant }, async () => {
            await new Promise<void>((resolve) => setImmediate(resolve));
            return await invoke();
          }),
        ),
      );
      expect(result).toEqual([{ baggage: "tenant=first" }, { baggage: "tenant=second" }, { baggage: "tenant=third" }]);
      expect(await invoke()).toEqual({ baggage: null });
    });

    it("merges nested baggage and restores the outer context", async () => {
      await withBaggage({ tenant: "outer", user: "123" }, async () => {
        expect(await invoke()).toEqual({ baggage: "tenant=outer,user=123" });
        expect(await withBaggage({ tenant: "inner" }, () => invoke())).toEqual({
          baggage: "tenant=inner,user=123",
        });
        expect(await invoke()).toEqual({ baggage: "tenant=outer,user=123" });
      });
      expect(await invoke()).toEqual({ baggage: null });
    });

    it("preserves service errors and does not leak baggage after rejection", async () => {
      await expect(withBaggage({ tenant: "failed" }, () => invoke("failure"))).rejects.toThrow();
      expect(await invoke()).toEqual({ baggage: null });
    });
  });
});
