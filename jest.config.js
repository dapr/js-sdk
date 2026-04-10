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
  setupFiles: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^@bufbuild/protobuf/wkt$": "<rootDir>/node_modules/@bufbuild/protobuf/dist/cjs/wkt/index.js",
    "^@bufbuild/protobuf/codegenv2$": "<rootDir>/node_modules/@bufbuild/protobuf/dist/cjs/codegenv2/index.js",
    "^@bufbuild/protobuf/codegenv1$": "<rootDir>/node_modules/@bufbuild/protobuf/dist/cjs/codegenv1/index.js",
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
