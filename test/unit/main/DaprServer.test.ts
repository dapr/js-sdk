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

import { CommunicationProtocolEnum, DaprServer } from "../../../src";
import HTTPServer from "../../../src/implementation/Server/HTTPServer/HTTPServer";
import GRPCServer from "../../../src/implementation/Server/GRPCServer/GRPCServer";
import HTTPServerJobs from "../../../src/implementation/Server/HTTPServer/jobs";
import GRPCServerJobs from "../../../src/implementation/Server/GRPCServer/jobs";

const host = "127.0.0.1";
const port = "50001";

describe("DaprServer", () => {
  beforeEach(() => {
    jest.replaceProperty(process, "env", { ...process.env });
  });

  afterEach(() => jest.restoreAllMocks());

  it("should throw an error on a wrong port for server", () => {
    expect(
      () =>
        new DaprServer({
          serverHost: host,
          serverPort: host,
        }),
    ).toThrow("DAPR_INCORRECT_SERVER_PORT");
  });

  it("should throw an error on a wrong port for client", () => {
    expect(
      () =>
        new DaprServer({
          serverHost: host,
          serverPort: port,
          clientOptions: {
            daprHost: host,
            daprPort: host,
          },
        }),
    ).toThrow("DAPR_INCORRECT_SIDECAR_PORT");
  });

  describe.each([CommunicationProtocolEnum.HTTP, CommunicationProtocolEnum.GRPC])("protocol %s", (protocol) => {
    let server: DaprServer;

    beforeEach(() => {
      server = new DaprServer({
        communicationProtocol: protocol,
        serverHost: host,
        serverPort: "43210",
        clientOptions: { daprHost: host, daprPort: "43211" },
      });
    });

    afterEach(async () => {
      jest.restoreAllMocks();
      await server.client.stop();
    });

    it("wires the matching Jobs server and embedded client", () => {
      expect(server.daprServer).toBeInstanceOf(protocol === CommunicationProtocolEnum.HTTP ? HTTPServer : GRPCServer);
      expect(server.jobs).toBeInstanceOf(protocol === CommunicationProtocolEnum.HTTP ? HTTPServerJobs : GRPCServerJobs);
      expect(server.getDaprClient()).toBe(server.daprServer);
      expect(server.client.options).toMatchObject({
        communicationProtocol: protocol,
        daprHost: host,
        daprPort: "43211",
      });
      expect(process.env.DAPR_SERVER_PORT).toBe("43210");
      expect(process.env.DAPR_CLIENT_PORT).toBe("43211");
    });

    it("awaits the listener before starting the embedded client", async () => {
      let ready!: () => void;
      const listening = new Promise<void>((resolve) => {
        ready = resolve;
      });
      const startServer = jest.spyOn(server.daprServer, "start").mockReturnValue(listening);
      const startClient = jest.spyOn(server.client, "start").mockResolvedValue();
      const pending = server.start();
      expect(startServer).toHaveBeenCalledTimes(1);
      expect(startServer).toHaveBeenCalledWith(host, "43210");
      expect(startClient).not.toHaveBeenCalled();
      ready();
      await pending;
      expect(startClient).toHaveBeenCalledTimes(1);
    });

    it("propagates listener failures without starting the client", async () => {
      const error = new Error("port in use");
      jest.spyOn(server.daprServer, "start").mockRejectedValue(error);
      const startClient = jest.spyOn(server.client, "start").mockResolvedValue();
      await expect(server.start()).rejects.toBe(error);
      expect(startClient).not.toHaveBeenCalled();
    });

    it("propagates embedded client startup failures", async () => {
      jest.spyOn(server.daprServer, "start").mockResolvedValue();
      const error = new Error("sidecar unavailable");
      jest.spyOn(server.client, "start").mockRejectedValue(error);
      await expect(server.start()).rejects.toBe(error);
    });

    it("awaits listener shutdown without stopping the embedded client", async () => {
      let stopped!: () => void;
      const stopping = new Promise<void>((resolve) => {
        stopped = resolve;
      });
      const stopServer = jest.spyOn(server.daprServer, "stop").mockReturnValue(stopping);
      const stopClient = jest.spyOn(server.client, "stop").mockResolvedValue();
      let finished = false;
      const pending = server.stop().then(() => {
        finished = true;
      });
      await Promise.resolve();
      expect(finished).toBe(false);
      expect(stopServer).toHaveBeenCalledTimes(1);
      stopped();
      await pending;
      expect(finished).toBe(true);
      expect(stopClient).not.toHaveBeenCalled();
    });

    it("propagates listener shutdown failures", async () => {
      const error = new Error("shutdown failed");
      jest.spyOn(server.daprServer, "stop").mockRejectedValue(error);
      await expect(server.stop()).rejects.toBe(error);
    });
  });
});
