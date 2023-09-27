/*
Copyright 2023 The Dapr Authors
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

import { GRPCClient } from "../../../src";

describe("grpc", () => {
  it("getEndpoint should remove http and https from endpoint", () => {
    const testCases = [
      { host: "http://localhost", port: "5000", expected: "localhost:5000" },
      { host: "https://localhost", port: "5000", expected: "localhost:5000" },
      { host: "localhost", port: "5000", expected: "localhost:5000" },
    ];

    testCases.forEach((testCase) => {
      expect(GRPCClient.getEndpoint(testCase.host, testCase.port)).toBe(testCase.expected);
    });
  });
});
