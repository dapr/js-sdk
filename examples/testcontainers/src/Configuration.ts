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

import YAML from "yaml";

export type ListEntry = {
  name: string;
  type: string;
}

export class AppHttpPipeline {
  constructor(
    public readonly handlers: ListEntry[]
  ) {}
}

export class OtelTracingConfigurationSettings {
  constructor(
    public readonly endpointAddress?: string,
    public readonly isSecure?: boolean,
    public readonly protocol?: string
  ) {}
}

export class ZipkinTracingConfigurationSettings {
  constructor(
    public readonly endpointAddress?: string
  ) {}
}

export class TracingConfigurationSettings {
  constructor(
    public readonly samplingRate?: string,
    public readonly stdout?: boolean,
    public readonly otel?: OtelTracingConfigurationSettings,
    public readonly zipkin?: ZipkinTracingConfigurationSettings
  ) {}
}

type ConfigurationResource = {
  apiVersion: "dapr.io/v1alpha1";
  kind: "Configuration";
  metadata: {
    name: string;
  };
  spec: {
    tracing?: TracingConfigurationSettings;
    appHttpPipeline?: AppHttpPipeline;
  };
};

/**
 * Configuration class for Dapr.
 * 
 * @remarks
 * This class is used to create a configuration object for Dapr. It includes
 * tracing and appHttpPipeline settings.
 * 
 * @example
 * ```typescript
 * const config = new Configuration("my-config", tracingConfig, appHttpPipeline);
 * console.log(config.toYaml());
 * ```
 */
export class Configuration {

  // TODO: add secrets
  // TODO: add metrics
  // TODO: add logging
  // TODO: add middleware httpPipeline
  // TODO: add nameResolution
  // TODO: add disallow components
  // TODO: add mtls

  /**
   * Creates a new configuration.
   * 
   * @param name            Configuration name.
   * @param tracing         TracingConfigParameters tracing configuration
   *                        parameters.
   * @param appHttpPipeline AppHttpPipeline middleware configuration.
   */
  constructor(
    public readonly name: string,
    public readonly tracing: TracingConfigurationSettings,
    public readonly appHttpPipeline: AppHttpPipeline
  ) {}

  toYaml(): string {
    const resource: ConfigurationResource = {
      apiVersion: "dapr.io/v1alpha1",
      kind: "Configuration",
      metadata: {
        name: this.name
      },
      spec: {
        ...{ tracing: this.tracing },
        ...{ appHttpPipeline: this.appHttpPipeline },
      }
    };
    return YAML.stringify(resource, { indentSeq: false });
  }
}
