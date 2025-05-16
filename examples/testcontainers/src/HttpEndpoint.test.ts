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

import { DAPR_RUNTIME_IMAGE, DaprContainer } from "./DaprContainer";
import { HttpEndpoint } from "./HttpEndpoint";

describe("HttpEndpoint", () => {
  it("should convert to YAML", () => {
    const dapr = new DaprContainer(DAPR_RUNTIME_IMAGE)
      .withAppName("dapr-app")
      .withAppPort(8081)
      .withHttpEndpoint(new HttpEndpoint("my-endpoint", "http://localhost:8080"))
      .withAppChannelAddress("host.testcontainers.internal");
    const endpoints = dapr.getHttpEndpoints();
    expect(endpoints.length).toBe(1);
    const endpoint = endpoints[0];
    const endpointYaml = endpoint.toYaml();
    const expectedEndpointYaml =
      "apiVersion: dapr.io/v1alpha1\n" +
      "kind: HTTPEndpoint\n" +
      "metadata:\n" +
      "  name: my-endpoint\n" +
      "spec:\n" +
      "  baseUrl: http://localhost:8080\n";
    expect(endpointYaml).toEqual(expectedEndpointYaml);
  });
});
