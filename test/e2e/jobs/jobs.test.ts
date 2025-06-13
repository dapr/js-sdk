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
// import { LogWaitStrategy } from "testcontaineclienrs/build/wait-strategies/log-wait-strategy";
import { CommunicationProtocolEnum, DaprServer } from "../../../src";
import express from "express";
import http from "http";
import fetch from "node-fetch";
// import { AbstractWaitStrategy } from "testcontainers/build/wait-strategies/wait-strategy";

jest.setTimeout(120 * 1000);

describe("Jobs End to End", () => {

    let network: StartedNetwork | null = null;
    let daprScheduler: StartedTestContainer | null = null;
    let daprd: StartedTestContainer | null = null;
    let server: DaprServer | null = null;

    beforeAll(async () => {

      network = await new Network().start();

      daprScheduler = await (new GenericContainer("ghcr.io/dapr/dapr")
        .withName("dapr-js-sdk-test-scheduler")
        .withNetwork(network)
        .withNetworkAliases("scheduler")
        .withExposedPorts(8083)
        .withCommand([
          "./scheduler",
          // note: Don't think this is necessary, buuuuut????
          "--listen-address", "0.0.0.0",
          "--port", "8083",
          "--log-level", "debug",
          // note: This feels redundant, but here as yet another thing I've tried.
          // "--mode", "standalone",
        ])
        .withTmpFs({
          "/data": "rw",
        })
        // note: Because dapr containers don't have `sh` or `bash` inside, this is kind of the best health check.
        .withWaitStrategy(Wait.forLogMessage("api is ready").withStartupTimeout(10000))
        // .withWaitStrategy(Wait.forHttp("/v1.0/healthz/outbound", 8082)
        //   .forStatusCodeMatching((statusCode) => statusCode >= 200 && statusCode <= 399))
        // .withStartupTimeout(120_000)
        .start());

        const dummyExpress = createDummyExpress(8070);

        console.info("Exposing 8070.")
        await TestContainers.exposeHostPorts(8070);
        console.info("8070 exposed.")

        daprd = await (new GenericContainer("ghcr.io/dapr/dapr")
          .withName("dapr-js-sdk-test-daemon")
          .withNetwork(network)
          .withNetworkAliases("daprd")
          .withExposedPorts(8081, 8082)
          .withCommand([
            "./daprd",
            "--app-id", "dapr-js-sdk-testing",
            "--app-channel-address", "host.testcontainers.internal",
            "--app-protocol", "http",
            "--app-port", "8070",
            "--dapr-grpc-port", "8081",
            "--dapr-http-port", "8082",
            "--scheduler-host-address", `scheduler:8083`,
            "--placement-host-address", "",
            "--enable-metrics", "false",
            "--log-level", "debug",
          ])
          // note: Because dapr containers don't have `sh` or `bash` inside, this is kind of the best health check.
          .withWaitStrategy(Wait.forLogMessage("HTTP server is running on port").withStartupTimeout(10000))
          .start());

      dummyExpress.close();

      console.info(`Scheduler: ${getIp(daprScheduler)}`);
      console.info(`Daemon: ${getIp(daprd)}`);

      server = new DaprServer({
        serverHost: "0.0.0.0",
        serverPort: "8070",
        communicationProtocol: CommunicationProtocolEnum.HTTP,
        clientOptions: {
          daprHost: "localhost",
          daprPort: getPort(daprd, 8082),
          communicationProtocol: CommunicationProtocolEnum.HTTP,
        },
      });
    });

    afterAll(async () => {
      await server?.stop();
      await daprd?.stop();
      await daprScheduler?.stop();
      await network?.stop();
    });

    it("Registers and receives a one second job five times.", async () => {

      const callback = jest.fn(async () => { console.info("Callback called!"); });

      server?.jobs.listen("test", callback);

      await server?.start();

      await server?.client.jobs.schedule(
        "test",
        { value: "test" },
        "* * * * * *"
      );

      const job = await server?.client.jobs.get("test");

      console.log("Waiting...");
      await (new Promise(resolve => setTimeout(resolve, 10000)));
      console.log("Done waiting.");

      await server?.stop();
      await server?.client.jobs.delete("test");

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

  function createDummyExpress(port: number): http.Server {

    const expressApp = express();

    return expressApp.listen(port);
  }
})