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

export type MetadataEntry = {
  readonly name: string;
  readonly value: string;
};

type ComponentResource = {
  apiVersion: "dapr.io/v1alpha1";
  kind: "Component";
  metadata: {
    name: string;
  };
  spec: {
    type: string;
    version: string;
    metadata?: MetadataEntry[];
  };
};

export class Component {
  private readonly metadata: MetadataEntry[];

  /**
   * Creates a new component.
   *
   * @param name            Component name.
   * @param type            Component type.
   * @param version         Component version.
   * @param metadataEntries Component metadata entries.
   */
  constructor(
    public readonly name: string,
    public readonly type: string,
    public readonly version: string,
    metadataEntries: MetadataEntry[]
  ) {
    this.metadata = metadataEntries;
  }

  getMetadata(): MetadataEntry[] {
    return this.metadata.slice();
  }

  toYaml(): string {
    const resource: ComponentResource = {
      apiVersion: "dapr.io/v1alpha1",
      kind: "Component",
      metadata: {
        name: this.name,
      },
      spec: {
        type: this.type,
        version: this.version,
        metadata: this.metadata,
      },
    };
    return YAML.stringify(resource, { indentSeq: false });
  }

  static fromYaml(src: string): Component {
    const resource: ComponentResource = YAML.parse(src);
    const metadata = resource.metadata;
    const spec = resource.spec;
    return new Component(metadata.name, spec.type, spec.version, (spec.metadata ?? []));
  }
}
