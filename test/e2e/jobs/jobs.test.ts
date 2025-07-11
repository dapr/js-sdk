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

import { GenericContainer, Network, StartedNetwork, StartedTestContainer, TestContainers, Wait } from "testcontainers";
import { CommunicationProtocolEnum, DaprClient } from "../../../src";
import express from "express";

jest.setTimeout(120 * 1000);

describe("Jobs End to End", () => {

    let network: StartedNetwork | null = null;
    let daprScheduler: StartedTestContainer | null = null;

    beforeAll(async () => {

      network = await new Network().start();

      daprScheduler = await (new GenericContainer("ghcr.io/dapr/dapr")
        .withName("dapr-js-sdk-test-scheduler")
        .withNetwork(network)
        .withNetworkAliases("scheduler")
        .withExposedPorts(8083, 8080)
        .withCommand([
          "./scheduler",
          // note: Don't think this is necessary, buuuuut????
          "--listen-address", "0.0.0.0",
          "--port", "8083",
          "--log-level", "debug",
          "--healthz-listen-address", "0.0.0.0",
          "--healthz-port", "8080",
          // note: This feels redundant, but here as yet another thing I've tried.
          // "--mode", "standalone",
        ])
        .withTmpFs({
          "/data": "rw",
        })
        // note: Because dapr containers don't have `sh` or `bash` inside, this is kind of the best health check.
        .withWaitStrategy(Wait.forLogMessage("api is ready").withStartupTimeout(10000))
        // note: Still having some issues with this.
        // .withWaitStrategy(Wait.forHttp("/healthz", 8080)
        //   .forStatusCodeMatching((statusCode) => statusCode >= 200 && statusCode <= 399))
        // .withStartupTimeout(120_000)
        .start());
    });

    afterAll(async () => {
      await daprScheduler?.stop();
      await network?.stop();
    });

    it("Registers and receives a one second job five times.", async () => {

      const callback = jest.fn(async () => { console.info("Callback called!"); });

      const expressApp = express();
      expressApp.post("/job/test", callback);
      const expressServer = expressApp.listen(8070);

      console.log("Waiting for listen...");
      await (new Promise(resolve => setTimeout(resolve, 10000)));
      console.log("Done waiting for listen.");

      console.info("Exposing 8070.");
      await TestContainers.exposeHostPorts(8070);
      console.info("8070 exposed.");

      const daprContainer = new GenericContainer("ghcr.io/dapr/dapr")
        .withName("dapr-js-sdk-test-daemon")
        .withNetwork(network!)
        .withNetworkAliases("daprd")
        .withExposedPorts(8081, 8082)
        .withCommand([
          "./daprd",
          "--app-id", "dapr-js-sdk-testing",
          "--app-channel-address", "host.testcontainers.internal",
          // "--app-channel-address", "host.containers.internal",
          "--app-protocol", "http",
          "--app-port", "8070",
          "--dapr-grpc-port", "8081",
          "--dapr-http-port", "8082",
          "--scheduler-host-address", `scheduler:8083`,
          "--placement-host-address", "",
          "--enable-metrics", "false",
          "--log-level", "debug",
          "--enable-api-logging",
        ])
        // .withWaitStrategy(Wait.forLogMessage("dapr initialized. Status: Running.").withStartupTimeout(10000))
        .withWaitStrategy(Wait.forLogMessage("HTTP server is running on port").withStartupTimeout(10000))
        // .withWaitStrategy(Wait.forHttp("/v1.0/healthz/outbound", 8082)
        //   .forStatusCodeMatching((statusCode) => statusCode >= 200 && statusCode <= 399))
        // .withStartupTimeout(120_000)
      ;

      const daprd = await daprContainer.start();
console.info("daprd started.");
      const client = new DaprClient({
        daprHost: getIp(daprd),
        daprPort: getPort(daprd, 8082),
        communicationProtocol: CommunicationProtocolEnum.HTTP,
      });
console.info("client created.");
      await client?.jobs.schedule(
        "test",
        { value: "test" },
        "* * * * * *"
      );
console.info("job scheduled.");
      const job = await client?.jobs.get("test");

      await client.start();
      console.info("client started.");

      console.log("Waiting...");
      await (new Promise(resolve => setTimeout(resolve, 10000)));
      console.log("Done waiting.");

      await client?.jobs.delete("test");
      expressServer.close();

      expect(job).toMatchObject({
        "data": {
          "value": {
            "value": "test",
          },
        },
        "name": "test",
        "schedule": "* * * * * *",
      });
      expect(callback).toHaveBeenCalledTimes(5);
      expect(callback).toHaveBeenCalledWith({
        value: "test",
      });
    });

  function getIp(container: StartedTestContainer | null | undefined): string {

    if (! network) throw new Error("Network is null or undefined?");
    if (! container) throw new Error("Container is null or undefined?");

    return container.getIpAddress(network.getName());
  }

  function getPort(container: StartedTestContainer | null | undefined, port: number): string {

    if (! container) throw new Error("Container is null or undefined?");

    return container.getMappedPort(port).toString();
  }
});