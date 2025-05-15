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

import assert from "node:assert";
import fs from "node:fs";
import {
  AbstractStartedContainer,
  GenericContainer,
  log,
  StartedNetwork,
  StartedTestContainer,
  StopOptions,
  StoppedTestContainer,
  Wait
} from "testcontainers";
import { Component } from "./Component";
import { Configuration } from "./Configuration";
import { DaprPlacementContainer } from "./DaprPlacementContainer";
import { DaprSchedulerContainer } from "./DaprSchedulerContainer";
import { HttpEndpoint } from "./HttpEndpoint";
import { Subscription } from "./Subscription";

export const DAPR_VERSION = "1.15.4";
export const DAPR_RUNTIME_IMAGE = `daprio/daprd:${DAPR_VERSION}`;
export const DAPR_PLACEMENT_IMAGE = `daprio/placement:${DAPR_VERSION}`;
export const DAPR_SCHEDULER_IMAGE = `daprio/scheduler:${DAPR_VERSION}`;

export const DAPRD_DEFAULT_HTTP_PORT = 3500;
export const DAPRD_DEFAULT_GRPC_PORT = 50001;
export const DAPR_PROTOCOL = "http";

export class DaprContainer extends GenericContainer {
  private daprLogLevel = "info";
  private appName = "dapr-app";
  private appChannelAddress?: string; // "host.testcontainers.internal"
  private appPort?: number;
  private appHealthCheckPath?: string;
  private placementService = "placement";
  private schedulerService = "scheduler";
  private placementImage = DAPR_PLACEMENT_IMAGE;
  private schedulerImage = DAPR_SCHEDULER_IMAGE;
  private placementContainer?: DaprPlacementContainer;
  private schedulerContainer?: DaprSchedulerContainer;
  private shouldReusePlacement = false;
  private shouldReuseScheduler = false;
  private startedNetwork?: StartedNetwork;
  private configuration?: Configuration;
  private components: Component[] = [];
  private subscriptions: Subscription[] = [];
  private httpEndpoints: HttpEndpoint[] = [];

  constructor(image = DAPR_RUNTIME_IMAGE) {
    super(image);
    this.withExposedPorts(DAPRD_DEFAULT_HTTP_PORT, DAPRD_DEFAULT_GRPC_PORT)
      .withWaitStrategy(Wait.forHttp("/v1.0/healthz/outbound", DAPRD_DEFAULT_HTTP_PORT)
        .forStatusCodeMatching((statusCode) => statusCode >= 200 && statusCode <= 399))
      .withStartupTimeout(120_000)
  }

  public withNetwork(network: StartedNetwork): this {
    this.startedNetwork = network;
    return super.withNetwork(network);
  }

  public override async start(): Promise<StartedDaprContainer> {
    assert(this.startedNetwork, "Network must be provided before starting the container");
    if (!this.placementContainer) {
      const container = new DaprPlacementContainer(this.placementImage)
        .withNetwork(this.startedNetwork)
        .withNetworkAliases(this.placementService)
      if (this.shouldReusePlacement) {
        container.withReuse();
      }
      this.placementContainer = container;
    }
    if (!this.schedulerContainer) {
      const container = new DaprSchedulerContainer(this.schedulerImage)
        .withNetwork(this.startedNetwork)
        .withNetworkAliases(this.schedulerService);
      if (this.shouldReuseScheduler) {
        container.withReuse();
      }
      this.schedulerContainer = container;
    }
    const containers = await Promise.all([
      this.placementContainer.start(),
      this.schedulerContainer.start(),
    ]);
    return new StartedDaprContainer(await super.start(), containers);
  }

  protected override async beforeContainerCreated(): Promise<void> {
    assert(this.placementContainer, "Placement container expected");
    assert(this.schedulerContainer, "Scheduler container expected");
    const cmds = [
      "./daprd",
      "--app-id",
      this.appName,
      "--dapr-listen-addresses=0.0.0.0",
      "--app-protocol",
      DAPR_PROTOCOL,
      "--placement-host-address",
      `${this.placementService}:${this.placementContainer.getPort()}`,
      "--scheduler-host-address",
      `${this.schedulerService}:${this.schedulerContainer.getPort()}`,
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

    if (this.appHealthCheckPath) {
      cmds.push("--enable-app-health-check", "--app-health-check-path", this.appHealthCheckPath);
    }

    if (this.configuration) {
      cmds.push("--config", `/dapr-resources/${this.configuration.name}.yaml`);
    }

    log.info("> `daprd` Command: \n");
    log.info(`\t${JSON.stringify(cmds, undefined, 2)}\n`);

    this.withCommand(cmds);

    if (this.configuration) {
      const configurationYaml = this.configuration.toYaml();
      log.info("> Configuration YAML: \n");
      log.info(`\t\n${configurationYaml}\n`);
      this.withCopyContentToContainer([
        { content: configurationYaml, target: `/dapr-resources/${this.configuration.name}.yaml` }
      ]);
    }

    if (!this.components.length) {
      this.components.push(new Component("kvstore", "state.in-memory", "v1", []));
      this.components.push(new Component("pubsub", "pubsub.in-memory", "v1", []));
    }

    if (!this.subscriptions.length && this.components.length) {
      this.subscriptions.push(new Subscription("local", "pubsub", "topic", "/events"));
    }

    for (const component of this.components) {
      const componentYaml = component.toYaml();
      log.info("> Component YAML: \n");
      log.info(`\t\n${componentYaml}\n`);
      this.withCopyContentToContainer([
        { content: componentYaml, target: `/dapr-resources/${component.name}.yaml` }
      ]);
    }

    for (const subscription of this.subscriptions) {
      const subscriptionYaml = subscription.toYaml();
      log.info("> Subscription YAML: \n");
      log.info(`\t\n${subscriptionYaml}\n`);
      this.withCopyContentToContainer([
        { content: subscriptionYaml, target: `/dapr-resources/${subscription.name}.yaml` }
      ]);
    }

    for (const endpoint of this.httpEndpoints) {
      const endpointYaml = endpoint.toYaml();
      log.info("> HTTPEndpoint YAML: \n");
      log.info(`\t\n${endpointYaml}\n`);
      this.withCopyContentToContainer([
        { content: endpointYaml, target: `/dapr-resources/${endpoint.name}.yaml` }
      ]);
    }
  }

  getAppName(): string {
    return this.appName;
  }

  getAppPort(): number | undefined {
    return this.appPort;
  }

  getAppChannelAddress(): string | undefined {
    return this.appChannelAddress;
  }

  getPlacementService(): string {
    return this.placementService;
  }

  getConfiguration(): Configuration | undefined {
    return this.configuration;
  }

  getComponents(): Component[] {
    return this.components.slice();
  }

  getSubscriptions(): Subscription[] {
    return this.subscriptions.slice();
  }

  getHttpEndpoints(): HttpEndpoint[] {
    return this.httpEndpoints.slice();
  }

  withAppPort(port: number): this {
    this.appPort = port;
    return this;
  }

  withAppChannelAddress(appChannelAddress: string): this {
    this.appChannelAddress = appChannelAddress;
    return this;
  }

  withAppHealthCheckPath(appHealthCheckPath: string): this {
    this.appHealthCheckPath = appHealthCheckPath;
    return this;
  }

  withConfiguration(configuration: Configuration): this {
    this.configuration = configuration;
    return this;
  }

  withPlacementService(placementService: string): this {
    this.placementService = placementService;
    return this;
  }

  withSchedulerService(schedulerService: string): this {
    this.schedulerService = schedulerService;
    return this;
  }

  withAppName(appName: string): this {
    this.appName = appName;
    return this;
  }

  withDaprLogLevel(daprLogLevel: string): this {
    this.daprLogLevel = daprLogLevel;
    return this;
  }

  withSubscription(subscription: Subscription): this {
    this.subscriptions.push(subscription);
    return this;
  }

  withHttpEndpoint(httpEndpoint: HttpEndpoint): this {
    this.httpEndpoints.push(httpEndpoint);
    return this;
  }

  withPlacementImage(placementImage: string): this {
    this.placementImage = placementImage;
    return this;
  }

  withSchedulerImage(schedulerImage: string): this {
    this.schedulerImage = schedulerImage;
    return this;
  }

  withReusablePlacement(shouldReusePlacement: boolean): this {
    this.shouldReusePlacement = shouldReusePlacement;
    return this;
  }

  withReuseScheduler(shouldReuseScheduler: boolean): this {
    this.shouldReuseScheduler = shouldReuseScheduler;
    return this;
  }

  withPlacementContainer(placementContainer: DaprPlacementContainer): this {
    this.placementContainer = placementContainer;
    return this;
  }

  withSchedulerContainer(schedulerContainer: DaprSchedulerContainer): this {
    this.schedulerContainer = schedulerContainer;
    return this;
  }

  withComponent(component: Component): this {
    this.components.push(component);
    return this;
  }

  /**
   * Adds a Dapr component from a YAML file.
   * @param path Path to the YAML file.
   * @return This container.
   */
  withComponentFromPath(path: string): this {
    try {
      const src = fs.readFileSync(path, "utf8");
      return this.withComponent(Component.fromYaml(src));
    } catch {
      log.warn(`Error while reading component from ${path}`);
    }
    return this;
  }
}

export class StartedDaprContainer extends AbstractStartedContainer {
  constructor(startedTestContainer: StartedTestContainer, private readonly containers: StartedTestContainer[]) {
    super(startedTestContainer);
  }

  async stop(options?: Partial<StopOptions>): Promise<StoppedTestContainer> {
    const stoppedTestContainer = await super.stop(options);
    await Promise.all(this.containers.map((container) => container.stop(options)));
    return stoppedTestContainer;
  }

  getHttpPort(): number {
    return this.getMappedPort(DAPRD_DEFAULT_HTTP_PORT);
  }

  getHttpEndpoint(): string {
    return `http://${this.getHost()}:${this.getMappedPort(DAPRD_DEFAULT_HTTP_PORT)}`;
  }

  getGrpcPort(): number {
    return this.getMappedPort(DAPRD_DEFAULT_GRPC_PORT);
  }

  getGrpcEndpoint(): string {
    return `:${this.getMappedPort(DAPRD_DEFAULT_GRPC_PORT)}`;
  }
}
