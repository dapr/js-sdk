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

/* eslint-disable @typescript-eslint/no-var-requires */
// No top-level imports - we use jest.isolateModules() to import fresh modules

describe("Settings - Environment Variable Support", () => {
  // Store original env vars to restore later
  const originalEnv = { ...process.env };

  afterEach(() => {
    // Restore original env after each test
    process.env = { ...originalEnv };
  });

  describe("getDefaultHost", () => {
    it("respects DAPR_RUNTIME_HOST environment variable", () => {
      jest.isolateModules(() => {
        process.env.DAPR_RUNTIME_HOST = "192.168.1.100";
        const { Settings } = require("../../../src/utils/Settings.util");
        expect(Settings.getDefaultHost()).toEqual("192.168.1.100");
      });
    });

    it("returns default when DAPR_RUNTIME_HOST is not set", () => {
      jest.isolateModules(() => {
        delete process.env.DAPR_RUNTIME_HOST;
        const { Settings } = require("../../../src/utils/Settings.util");
        expect(Settings.getDefaultHost()).toEqual("127.0.0.1");
      });
    });
  });

  describe("getDefaultHttpPort", () => {
    it("respects DAPR_HTTP_PORT environment variable", () => {
      jest.isolateModules(() => {
        process.env.DAPR_HTTP_PORT = "3510";
        const { Settings } = require("../../../src/utils/Settings.util");
        expect(Settings.getDefaultHttpPort()).toEqual("3510");
      });
    });

    it("returns default when DAPR_HTTP_PORT is not set", () => {
      jest.isolateModules(() => {
        delete process.env.DAPR_HTTP_PORT;
        const { Settings } = require("../../../src/utils/Settings.util");
        expect(Settings.getDefaultHttpPort()).toEqual("3500");
      });
    });
  });

  describe("getDefaultGrpcPort", () => {
    it("respects DAPR_GRPC_PORT environment variable", () => {
      jest.isolateModules(() => {
        process.env.DAPR_GRPC_PORT = "50010";
        const { Settings } = require("../../../src/utils/Settings.util");
        expect(Settings.getDefaultGrpcPort()).toEqual("50010");
      });
    });

    it("returns default when DAPR_GRPC_PORT is not set", () => {
      jest.isolateModules(() => {
        delete process.env.DAPR_GRPC_PORT;
        const { Settings } = require("../../../src/utils/Settings.util");
        expect(Settings.getDefaultGrpcPort()).toEqual("50001");
      });
    });
  });
});
