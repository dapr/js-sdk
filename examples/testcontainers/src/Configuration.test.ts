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
import {
  AppHttpPipeline,
  Configuration,
  OtelTracingConfigurationSettings,
  TracingConfigurationSettings,
} from "./Configuration";

describe("Configuration", () => {
  it("should convert to YAML", () => {
    const otel = new OtelTracingConfigurationSettings("localhost:4317", false, "grpc");
    const tracing = new TracingConfigurationSettings("1", true, otel);
    const appHttpPipeline = new AppHttpPipeline([
      {
        name: "alias",
        type: "middleware.http.routeralias",
      },
    ]);
    const dapr = new DaprContainer(DAPR_RUNTIME_IMAGE)
      .withAppName("dapr-app")
      .withAppPort(8081)
      .withConfiguration(new Configuration("my-config", tracing, appHttpPipeline))
      .withAppChannelAddress("host.testcontainers.internal");
    const configuration = dapr.getConfiguration();
    expect(configuration).toBeDefined();
    const configurationYaml = configuration?.toYaml();
    const expectedConfigurationYaml =
      "apiVersion: dapr.io/v1alpha1\n" +
      "kind: Configuration\n" +
      "metadata:\n" +
      "  name: my-config\n" +
      "spec:\n" +
      "  tracing:\n" +
      '    samplingRate: "1"\n' +
      "    stdout: true\n" +
      "    otel:\n" +
      "      endpointAddress: localhost:4317\n" +
      "      isSecure: false\n" +
      "      protocol: grpc\n" +
      "  appHttpPipeline:\n" +
      "    handlers:\n" +
      "    - name: alias\n" +
      "      type: middleware.http.routeralias\n";
    expect(configurationYaml).toEqual(expectedConfigurationYaml);
  });
});
