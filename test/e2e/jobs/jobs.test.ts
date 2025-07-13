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
  let daprDaemon: StartedTestContainer | null = null;
  let expressServer: any | null = null;
  let callback: (() => unknown) | null = null;

  beforeAll(async () => {
    network = await new Network().start();
  });

  afterAll(async () => {
    await network?.stop();
  });

  beforeEach(async () => {

    if (! network) throw new Error("Network not ready!");
    
    callback = jest.fn(async () => { console.debug("Callback called!"); });

    const expressApp = express()
    expressApp.post("/job/test", (req, res) => {
      
      if (! callback) throw new Error("Callback not ready!");
      
      callback();
      
      res.send("👍");
    });
    expressServer = expressApp.listen(8070, "0.0.0.0");

    await TestContainers.exposeHostPorts(8070);
    
    daprScheduler = await new GenericContainer("ghcr.io/dapr/dapr")
      .withName("dapr-js-sdk-test-scheduler")
      .withNetwork(network)
      .withNetworkAliases("scheduler")
      .withExposedPorts(8083, 8080)
      .withCommand([
        "./scheduler",
        "--listen-address",
        "0.0.0.0",
        "--port",
        "8083",
        "--log-level",
        "debug",
        "--healthz-listen-address",
        "0.0.0.0",
        "--healthz-port",
        "8080",
      ])
      .withTmpFs({
        "/data": "rw",
      })
      .withWaitStrategy(Wait.forLogMessage("api is ready").withStartupTimeout(10000))
      .start()
    ;
    
    daprDaemon = await new GenericContainer("ghcr.io/dapr/dapr")
      .withName("dapr-js-sdk-test-daemon")
      .withNetwork(network)
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
      .withWaitStrategy(Wait.forLogMessage("dapr initialized. Status: Running.").withStartupTimeout(10000))
      .start()
    ;
  });
  
  afterEach(async () => {
    await daprDaemon?.stop();
    await daprScheduler?.stop();
    await expressServer?.close();
  });

  it("Registers and receives a one second job five times.", async () => {

    const client = new DaprClient({
      daprHost: "localhost",
      daprPort: getPort(daprDaemon, 8082),
      communicationProtocol: CommunicationProtocolEnum.HTTP,
    });

    await client.jobs.schedule(
      "test",
      { value: "test" },
      "* * * * * *"
    );

    const job = await client.jobs.get("test");

    await (new Promise(resolve => setTimeout(resolve, 5 * 1000)));

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
  });

  it("Should be able to delete jobs.", async () => {

    const client = new DaprClient({
      daprHost: "localhost",
      daprPort: getPort(daprDaemon, 8082),
      communicationProtocol: CommunicationProtocolEnum.HTTP,
    });

    await client.jobs.schedule(
      "test",
      { value: "test" },
      "* * * * * *"
    );

    await client.jobs.delete("test");
    
    const job = await client.jobs.get("test");

    expect(job).toBeNull();
  });
});

function getPort(container: StartedTestContainer | null | undefined, port: number): string {
  if (!container) throw new Error("Container is null or undefined?");

  return container.getMappedPort(port).toString();
}
