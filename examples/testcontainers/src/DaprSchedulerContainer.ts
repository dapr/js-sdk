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

import { GenericContainer, Wait } from "testcontainers";

export class DaprSchedulerContainer extends GenericContainer {
  private schedulerPort = 51005;

  constructor(image: string) {
    super(image);
    this.withWaitStrategy(Wait.forLogMessage(/Dapr Scheduler listening/))
      .withStartupTimeout(120_000)
  }

  protected async beforeContainerCreated(): Promise<void> {
    this.withCopyContentToContainer([
      { content: "", target: "./default-dapr-scheduler-server-0/dapr-0.1/", mode: 0o777 },
      { content: "", target: "./dapr-scheduler-existing-cluster/", mode: 0o777 },
    ]);
    this.withExposedPorts(this.schedulerPort);
    this.withCommand(["./scheduler", "--port", this.schedulerPort.toString(), "--etcd-data-dir", "."]);
  }

  withPort(port: number): this {
    this.schedulerPort = port;
    return this;
  }

  getPort(): number {
    return this.schedulerPort;
  }
}
