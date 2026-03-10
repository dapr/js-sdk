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

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  collectCoverage: true,
  coverageReporters: ["lcov"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      isolatedModules: true,
    }],
  },
  moduleNameMapper: {
    // Mock proto files - they're ES modules that don't play well with Jest
    "proto.*_pb$": "<rootDir>/test/__mocks__/proto.mock.ts",
    "proto.*_connect$": "<rootDir>/test/__mocks__/proto.mock.ts",
    "@bufbuild/protobuf/wkt": "<rootDir>/test/__mocks__/protobuf.mock.ts",
    "@bufbuild/protobuf/codegenv2": "<rootDir>/test/__mocks__/protobuf.mock.ts",
    "@bufbuild/protobuf": "<rootDir>/test/__mocks__/protobuf.mock.ts",
    "@connectrpc/connect": "<rootDir>/test/__mocks__/connect.mock.ts",
  },
  testPathIgnorePatterns: [
    "/node_modules/",
    "/build/"
  ]
};
