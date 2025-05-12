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

import { AbstractStartedContainer, GenericContainer, Network, StartedTestContainer, Wait } from "testcontainers";

export const DAPR_VERSION = "1.15.4";
export const DAPR_RUNTIME_IMAGE = "daprio/daprd:" + DAPR_VERSION;
export const DAPR_PLACEMENT_IMAGE = "daprio/placement:" + DAPR_VERSION;
export const DAPR_SCHEDULER_IMAGE = "daprio/scheduler:" + DAPR_VERSION;

export const DAPRD_DEFAULT_HTTP_PORT = 3500;
export const DAPRD_DEFAULT_GRPC_PORT = 50001;
export const DAPR_PROTOCOL = "http";

export class DaprContainer extends GenericContainer {
  private daprLogLevel = "info";
  private appChannelAddress = "localhost";
  private placementService = "placement";
  private schedulerService = "scheduler";
  private placementDockerImageName = DAPR_PLACEMENT_IMAGE;
  private schedulerDockerImageName = DAPR_SCHEDULER_IMAGE;
  // private configuration: Configuration;
  private placementContainer: GenericContainer;
  private schedulerContainer: GenericContainer;
  private appName: string;
  private appPort: number;
  private appHealthCheckPath: string;
  private shouldReusePlacement: boolean;
  private shouldReuseScheduler: boolean;

  constructor(image = DAPR_RUNTIME_IMAGE) {
    super(image);
    this.withExposedPorts(DAPRD_DEFAULT_HTTP_PORT, DAPRD_DEFAULT_GRPC_PORT)
      .withWaitStrategy(Wait.forHttp("/v1.0/healthz/outbound", DAPRD_DEFAULT_HTTP_PORT)
        .forStatusCodeMatching((statusCode) => statusCode >= 200 && statusCode <= 399))
      .withStartupTimeout(120_000)
  }

  public override async start(): Promise<StartedDaprContainer> {
    return new StartedDaprContainer(await super.start());
  }

  protected override async beforeContainerCreated(): Promise<void> {
    this.withCommand([
      "./daprd",
      "--app-id",
      "FIXME",
      "--dapr-listen-addresses=0.0.0.0",
      "--app-protocol",
      DAPR_PROTOCOL,
      "--placement-host-address",
      `${this.placementService}:50005`,
      "--scheduler-host-address",
      `${this.schedulerService}:51005`,
    ]);

    // if (!this.networkMode) {
    //   this.withNetwork(await new Network().start());
    // }

    // if (this.placementContainer == null) {
    //   this.placementContainer = new DaprPlacementContainer(this.placementDockerImageName)
    //       .withNetwork(getNetwork())
    //       .withNetworkAliases(placementService)
    //       .withReuse(this.shouldReusePlacement);
    //   this.placementContainer.start();
    // }

    // if (this.schedulerContainer == null) {
    //   this.schedulerContainer = new DaprSchedulerContainer(this.schedulerDockerImageName)
    //       .withNetwork(getNetwork())
    //       .withNetworkAliases(schedulerService)
    //       .withReuse(this.shouldReuseScheduler);
    //   this.schedulerContainer.start();
    // }

    // List<String> cmds = new ArrayList<>();
    // cmds.add("./daprd");
    // cmds.add("--app-id");
    // cmds.add(appName);
    // cmds.add("--dapr-listen-addresses=0.0.0.0");
    // cmds.add("--app-protocol");
    // cmds.add(DAPR_PROTOCOL.getName());
    // cmds.add("--placement-host-address");
    // cmds.add(placementService + ":50005");
    // cmds.add("--scheduler-host-address");
    // cmds.add(schedulerService + ":51005");

    // if (appChannelAddress != null && !appChannelAddress.isEmpty()) {
    //   cmds.add("--app-channel-address");
    //   cmds.add(appChannelAddress);
    // }

    // if (appPort != null) {
    //   cmds.add("--app-port");
    //   cmds.add(Integer.toString(appPort));
    // }

    // if (appHealthCheckPath != null && !appHealthCheckPath.isEmpty()) {
    //   cmds.add("--enable-app-health-check");
    //   cmds.add("--app-health-check-path");
    //   cmds.add(appHealthCheckPath);
    // }

    // if (configuration != null) {
    //   cmds.add("--config");
    //   cmds.add("/dapr-resources/" + configuration.getName() + ".yaml");
    // }

    // cmds.add("--log-level");
    // cmds.add(daprLogLevel.toString());
    // cmds.add("--resources-path");
    // cmds.add("/dapr-resources");

    // String[] cmdArray = cmds.toArray(new String[]{});
    // LOGGER.info("> `daprd` Command: \n");
    // LOGGER.info("\t" + Arrays.toString(cmdArray) + "\n");

    // withCommand(cmdArray);

    // if (configuration != null) {
    //   String configurationYaml = CONFIGURATION_CONVERTER.convert(configuration);

    //   LOGGER.info("> Configuration YAML: \n");
    //   LOGGER.info("\t\n" + configurationYaml + "\n");

    //   withCopyToContainer(Transferable.of(configurationYaml), "/dapr-resources/" + configuration.getName() + ".yaml");
    // }

    // if (components.isEmpty()) {
    //   components.add(new Component("kvstore", "state.in-memory", "v1", Collections.emptyMap()));
    //   components.add(new Component("pubsub", "pubsub.in-memory", "v1", Collections.emptyMap()));
    // }

    // if (subscriptions.isEmpty() && !components.isEmpty()) {
    //   subscriptions.add(new Subscription("local", "pubsub", "topic", "/events"));
    // }

    // for (Component component : components) {
    //   String componentYaml = COMPONENT_CONVERTER.convert(component);

    //   LOGGER.info("> Component YAML: \n");
    //   LOGGER.info("\t\n" + componentYaml + "\n");

    //   withCopyToContainer(Transferable.of(componentYaml), "/dapr-resources/" + component.getName() + ".yaml");
    // }

    // for (Subscription subscription : subscriptions) {
    //   String subscriptionYaml = SUBSCRIPTION_CONVERTER.convert(subscription);

    //   LOGGER.info("> Subscription YAML: \n");
    //   LOGGER.info("\t\n" + subscriptionYaml + "\n");

    //   withCopyToContainer(Transferable.of(subscriptionYaml), "/dapr-resources/" + subscription.getName() + ".yaml");
    // }

    // for (HttpEndpoint endpoint : httpEndpoints) {
    //   String endpointYaml = HTTPENDPOINT_CONVERTER.convert(endpoint);

    //   LOGGER.info("> HTTPEndpoint YAML: \n");
    //   LOGGER.info("\t\n" + endpointYaml + "\n");

    //   withCopyToContainer(Transferable.of(endpointYaml), "/dapr-resources/" + endpoint.getName() + ".yaml");
    // }

    // dependsOn(placementContainer, schedulerContainer);
  }

  // public override async start(): Promise<StartedK3sContainer> {
  //   const container = await super.start();
  //   const tarStream = await container.copyArchiveFromContainer(KUBE_CONFIG_PATH);
  //   const rawKubeConfig = await extractFromTarStream(tarStream, basename(KUBE_CONFIG_PATH));
  //   return new StartedK3sContainer(container, rawKubeConfig);
  // }

  // protected override async beforeContainerCreated(): Promise<void> {
  //   this.resolveHostname();
  //   await this.flagLambdaSessionId();
  // }

  // protected override async beforeContainerCreated() {
  //   let command = this.createOpts.Cmd ?? ["server", "--disable=traefik"];
  //   if (this.networkMode && this.networkAliases.length > 0) {
  //     const aliases = this.networkAliases.join();
  //     command = [...command, `--tls-san=${aliases}`];
  //   }
  //   this.withCommand(command);
  // }
}

export class StartedDaprContainer extends AbstractStartedContainer {
  constructor(startedTestContainer: StartedTestContainer) {
    super(startedTestContainer);
  }
}

// export class StartedK3sContainer extends AbstractStartedContainer {
//   constructor(
//     startedTestContainer: StartedTestContainer,
//     private readonly rawKubeConfig: string
//   ) {
//     super(startedTestContainer);
//   }
// }

// export class StartedLocalStackContainer extends AbstractStartedContainer {
//   constructor(startedTestContainer: StartedTestContainer) {
//     super(startedTestContainer);
//   }

//   public getPort(): number {
//     return this.startedTestContainer.getMappedPort(LOCALSTACK_PORT);
//   }

//   /**
//    * @returns A connection URI in the form of `http://host:port`
//    */
//   public getConnectionUri(): string {
//     return `http://${this.getHost()}:${this.getPort().toString()}`;
//   }
// }
