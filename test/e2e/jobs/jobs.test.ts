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

import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";
// import { LogWaitStrategy } from "testcontainers/build/wait-strategies/log-wait-strategy";
import { CommunicationProtocolEnum, DaprClient, DaprServer } from "../../../src";
// import { AbstractWaitStrategy } from "testcontainers/build/wait-strategies/wait-strategy";

jest.setTimeout(10000);

describe("Jobs End to End", () => {

    let daprScheduler: StartedTestContainer | null = null;
    let daprd: StartedTestContainer | null = null;
    let server: DaprServer | null = null;
    let client: DaprClient | null = null;

    beforeAll(async () => {

        daprScheduler = await new GenericContainer("ghcr.io/dapr/dapr")
          .withExposedPorts(
            {
              host: 8083,
              container: 8083,
            }
          )
          .withCommand([
            "./scheduler",
            "--listen-address", "0.0.0.0",
            "--port", "8083",
            "--healthz-port", "8084",
            "--enable-metrics", "false",
            // note: This is here because `--enable-metrics=false` doesn't seem to be working.
            "--metrics-port", "8085",
          ])
          // note: This is here because of daemon visibility issues.
          .withNetworkMode("host")
          .withTmpFs({
            "/data": "rw",
          })
          // note: Because dapr containers don't have `sh` or `bash` inside, this is kind of the best health check.
          .withWaitStrategy(Wait.forLogMessage("api is ready").withStartupTimeout(10000))
          .start();

        daprd = await new GenericContainer("ghcr.io/dapr/dapr")
          .withExposedPorts(
            {
                host: 8081,
                container: 8081
            },
            {
                host: 8082,
                container: 8082,
            }
          )
          .withCommand([
            "./daprd",
            "--app-id", "dapr-js-sdk-testing",
            "--app-port", "8070",
            "--dapr-grpc-port", "8081",
            "--dapr-http-port", "8082",
            "--scheduler-host-address", "0.0.0.0:8083",
            "--placement-host-address", "",
            "--enable-metrics", "false",
          ])
          // note: This is here because well, the daemon likes it.
          .withNetworkMode("host")
          // note: Because dapr containers don't have `sh` or `bash` inside, this is kind of the best health check.
          .withWaitStrategy(Wait.forLogMessage("HTTP server is running on port").withStartupTimeout(10000))
          .start()
        ;
    });

    beforeEach(async () => {

      server = new DaprServer({
        serverHost: "127.0.0.1",
        serverPort: "8070",
        communicationProtocol: CommunicationProtocolEnum.HTTP,
        clientOptions: {
          daprHost: "127.0.0.1",
          daprPort: "8082",
        },
      });

      client = new DaprClient({
        daprHost: "127.0.0.1",
        daprPort: "8082",
        communicationProtocol: CommunicationProtocolEnum.HTTP,
      });

      await server.start();
    })

    afterEach(async () => {

      await client?.jobs.delete("test");
      await server?.stop();
      // await daprScheduler?.restart();

      server = null;
    })

    afterAll(async () => {
        await daprScheduler?.stop();
        await daprd?.stop();
    });

    it("Registers and receives a one second job five times.", async () => {

        const callback = jest.fn(async () => { return null; });

        server?.jobs.listen("test", callback);

        await client?.jobs.schedule(
          "test",
          { value: "test" },
          "* * * * * *"
        );

        const job = await client?.jobs.get("test");

        await new Promise(resolve => setTimeout(resolve, 5000));

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
})