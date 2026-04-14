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

/**
 * DaprGrpcAppContainer
 *
 * A Dapr sidecar container that uses `--app-protocol grpc` so that Dapr
 * communicates with the application via gRPC callbacks (bindings, subscriptions,
 * invoker). This mirrors `DaprContainer` from `@dapr/testcontainer-node` but
 * targets the gRPC app-channel protocol which is not yet configurable in the
 * upstream package.
 */

import {
  AbstractStartedContainer,
  GenericContainer,
  StartedNetwork,
  StartedTestContainer,
  StopOptions,
  StoppedTestContainer,
  Wait,
} from "testcontainers";
import {
  Component,
  DaprPlacementContainer,
  DaprSchedulerContainer,
} from "@dapr/testcontainer-node";
import {
  DAPR_TEST_RUNTIME_IMAGE,
  DAPR_TEST_PLACEMENT_IMAGE,
  DAPR_TEST_SCHEDULER_IMAGE,
} from "./containers";

const DAPRD_HTTP_PORT = 3500;
const DAPRD_GRPC_PORT = 50001;

export class DaprGrpcAppContainer extends GenericContainer {
  private daprLogLevel = "info";
  private appId = "dapr-grpc-app";
  private appChannelAddress?: string;
  private appPort?: number;
  private maxRequestSizeMb?: number;
  // Use distinct aliases so this container does not conflict with a DaprContainer
  // running on the same network (DaprContainer uses "placement" / "scheduler").
  private placementAlias = "placement-grpc";
  private schedulerAlias = "scheduler-grpc";
  private startedNetwork?: StartedNetwork;
  private components: Component[] = [];
  private containerEnv: Record<string, string> = {};

  // Populated during start() before beforeContainerCreated() is called.
  private placementContainer?: DaprPlacementContainer;
  private schedulerContainer?: DaprSchedulerContainer;

  constructor(daprRuntimeImage = DAPR_TEST_RUNTIME_IMAGE) {
    super(daprRuntimeImage);
    this.withExposedPorts(DAPRD_HTTP_PORT, DAPRD_GRPC_PORT)
      .withWaitStrategy(
        Wait.forHttp("/v1.0/healthz/outbound", DAPRD_HTTP_PORT).forStatusCodeMatching(
          (statusCode) => statusCode >= 200 && statusCode <= 399,
        ),
      )
      .withStartupTimeout(120_000);
  }

  /** Must be called before start(). */
  withNetwork(network: StartedNetwork): this {
    this.startedNetwork = network;
    return super.withNetwork(network);
  }

  withAppId(appId: string): this {
    this.appId = appId;
    return this;
  }

  withAppPort(port: number): this {
    this.appPort = port;
    return this;
  }

  withAppChannelAddress(address: string): this {
    this.appChannelAddress = address;
    return this;
  }

  withDaprLogLevel(level: string): this {
    this.daprLogLevel = level;
    return this;
  }

  withComponent(component: Component): this {
    this.components.push(component);
    return this;
  }

  withPlacementAlias(alias: string): this {
    this.placementAlias = alias;
    return this;
  }

  withSchedulerAlias(alias: string): this {
    this.schedulerAlias = alias;
    return this;
  }

  withContainerEnvironment(env: Record<string, string>): this {
    this.containerEnv = { ...this.containerEnv, ...env };
    return this;
  }

  withMaxRequestSizeMb(mb: number): this {
    this.maxRequestSizeMb = mb;
    return this;
  }

  async start(): Promise<StartedGrpcDaprContainer> {
    if (!this.startedNetwork) {
      throw new Error("Network must be provided before starting DaprGrpcAppContainer");
    }

    // Start placement and scheduler before the main container so that
    // beforeContainerCreated() can reference their internal ports.
    this.placementContainer = new DaprPlacementContainer(DAPR_TEST_PLACEMENT_IMAGE)
      .withNetwork(this.startedNetwork)
      .withNetworkAliases(this.placementAlias);

    this.schedulerContainer = new DaprSchedulerContainer(DAPR_TEST_SCHEDULER_IMAGE)
      .withNetwork(this.startedNetwork)
      .withNetworkAliases(this.schedulerAlias);

    const [startedPlacement, startedScheduler] = await Promise.all([
      this.placementContainer.start(),
      this.schedulerContainer.start(),
    ]);

    if (Object.keys(this.containerEnv).length > 0) {
      this.withEnvironment(this.containerEnv);
    }

    return new StartedGrpcDaprContainer(await super.start(), [startedPlacement, startedScheduler]);
  }

  protected override async beforeContainerCreated(): Promise<void> {
    if (!this.placementContainer || !this.schedulerContainer) {
      throw new Error("Placement and scheduler containers must be started before the Dapr container");
    }

    const cmds = [
      "./daprd",
      "--app-id",
      this.appId,
      "--dapr-listen-addresses=0.0.0.0",
      "--app-protocol",
      "grpc", // <-- key difference from DaprContainer
      "--placement-host-address",
      `${this.placementAlias}:${this.placementContainer.getPort()}`,
      "--scheduler-host-address",
      `${this.schedulerAlias}:${this.schedulerContainer.getPort()}`,
      "--log-level",
      this.daprLogLevel,
      "--resources-path",
      "/dapr-resources",
    ];

    if (this.appChannelAddress) {
      cmds.push("--app-channel-address", this.appChannelAddress);
    }
    if (this.appPort) {
      cmds.push("--app-port", this.appPort.toString());
    }
    if (this.maxRequestSizeMb !== undefined) {
      cmds.push("--dapr-grpc-max-request-size", this.maxRequestSizeMb.toString());
    }

    this.withCommand(cmds);

    for (const component of this.components) {
      this.withCopyContentToContainer([
        { content: component.toYaml(), target: `/dapr-resources/${component.name}.yaml` },
      ]);
    }
  }
}

export class StartedGrpcDaprContainer extends AbstractStartedContainer {
  constructor(
    startedTestContainer: StartedTestContainer,
    private readonly supportingContainers: StartedTestContainer[],
  ) {
    super(startedTestContainer);
  }

  async stop(options?: Partial<StopOptions>): Promise<StoppedTestContainer> {
    const stopped = await super.stop(options);
    await Promise.all(this.supportingContainers.map((c) => c.stop(options)));
    return stopped;
  }

  getHttpPort(): number {
    return this.getMappedPort(DAPRD_HTTP_PORT);
  }

  getHttpEndpoint(): string {
    return `http://${this.getHost()}:${this.getMappedPort(DAPRD_HTTP_PORT)}`;
  }

  getGrpcPort(): number {
    return this.getMappedPort(DAPRD_GRPC_PORT);
  }

  getGrpcEndpoint(): string {
    return `:${this.getMappedPort(DAPRD_GRPC_PORT)}`;
  }
}
