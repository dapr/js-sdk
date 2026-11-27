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

import { CommunicationProtocolEnum } from "../../../src";
import { Settings } from "../../../src/utils/Settings.util";

describe("Settings", () => {
  describe("getDefaultPort returns the correct default when", () => {
    it("communication protocol is GRPC", () => {
      expect(Settings.getDefaultPort(CommunicationProtocolEnum.GRPC)).toEqual(Settings.getDefaultGrpcPort());
    });
    it("communication protocol is HTTP", () => {
      expect(Settings.getDefaultPort(CommunicationProtocolEnum.HTTP)).toEqual(Settings.getDefaultHttpPort());
    });
  });
  describe("empty environment variables are treated as unset", () => {
    const names = ["APP_ID", "DAPR_HTTP_PORT", "DAPR_GRPC_PORT", "APP_PORT"];
    const saved: Record<string, string | undefined> = {};

    beforeEach(() => {
      for (const name of names) {
        saved[name] = process.env[name];
        process.env[name] = "";
      }
    });

    afterEach(() => {
      for (const name of names) {
        if (saved[name] === undefined) {
          delete process.env[name];
        } else {
          process.env[name] = saved[name];
        }
      }
    });

    it("falls back to the default app id", () => {
      expect(Settings.getAppId()).toEqual("my-dapr-app");
    });
    it("falls back to the default sidecar ports", () => {
      expect(Settings.getDefaultHttpPort()).toEqual("3500");
      expect(Settings.getDefaultGrpcPort()).toEqual("50001");
    });
    it("falls back to the default app ports", () => {
      expect(Settings.getDefaultHttpAppPort()).toEqual("3000");
      expect(Settings.getDefaultGrpcAppPort()).toEqual("50000");
    });
    it("still uses a value that is set", () => {
      process.env.DAPR_HTTP_PORT = "3600";
      expect(Settings.getDefaultHttpPort()).toEqual("3600");
    });
  });
  describe("getDefaultAppPort returns the correct default when", () => {
    it("communication protocol is GRPC", () => {
      expect(Settings.getDefaultAppPort(CommunicationProtocolEnum.GRPC)).toEqual(Settings.getDefaultGrpcAppPort());
    });
    it("communication protocol is HTTP", () => {
      expect(Settings.getDefaultAppPort(CommunicationProtocolEnum.HTTP)).toEqual(Settings.getDefaultHttpAppPort());
    });
  });
});
