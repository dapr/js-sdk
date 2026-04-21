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
  testEnvironment: "<rootDir>/test/e2e/helpers/CustomNodeEnvironment.cjs",
  setupFiles: ["<rootDir>/jest.setup.js"],
  collectCoverage: true,
  coverageReporters: ["lcov"],
  collectCoverageFrom: ["src/**/*.ts", "!src/proto/**"],
  modulePathIgnorePatterns: ["<rootDir>/build/"],
  // Load .github/scripts/*.js files as native CJS — they have no TypeScript syntax.
  transformIgnorePatterns: ["/node_modules/", "/.github/"],
  // Post-process results to remove spurious "Test suite failed to run" entries
  // caused by empty AggregateErrors from testcontainers/ssh2 SubtleCrypto handle
  // GC during container teardown.  All individual tests pass; only the suite-level
  // unhandledRejection handler catches these, so we strip them here.
  testResultsProcessor: "<rootDir>/test/e2e/helpers/filterAggregateErrors.cjs",
  moduleNameMapper: {
    "^@bufbuild/protobuf/wkt$": "<rootDir>/node_modules/@bufbuild/protobuf/dist/cjs/wkt/index.js",
    "^@bufbuild/protobuf/codegenv2$": "<rootDir>/node_modules/@bufbuild/protobuf/dist/cjs/codegenv2/index.js",
    "^@bufbuild/protobuf/codegenv1$": "<rootDir>/node_modules/@bufbuild/protobuf/dist/cjs/codegenv1/index.js",
    "^@bufbuild/protobuf/wire$": "<rootDir>/node_modules/@bufbuild/protobuf/dist/cjs/wire/index.js",
    "^@connectrpc/connect/protocol$": "<rootDir>/node_modules/@connectrpc/connect/dist/cjs/protocol/index.js",
    "^@connectrpc/connect/protocol-connect$": "<rootDir>/node_modules/@connectrpc/connect/dist/cjs/protocol-connect/index.js",
    "^@connectrpc/connect/protocol-grpc$": "<rootDir>/node_modules/@connectrpc/connect/dist/cjs/protocol-grpc/index.js",
    "^@connectrpc/connect/protocol-grpc-web$": "<rootDir>/node_modules/@connectrpc/connect/dist/cjs/protocol-grpc-web/index.js",
  },
  globals: {
    "ts-jest": {
      tsconfig: {
        allowJs: true,
      },
    },
  },
  transform: {
    "^.+\\.[jt]sx?$": "ts-jest",
  },
};
