# Dapr SDK for JavaScript

[![NPM Version](https://img.shields.io/npm/v/%40dapr%2Fdapr?style=flat&logo=npm&label=Latest%20version)](https://www.npmjs.com/package/@dapr/dapr) [![NPM Downloads](https://img.shields.io/npm/dy/%40dapr%2Fdapr?style=flat&logo=npm&label=Downloads)](https://www.npmjs.com/package/@dapr/dapr) [![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/dapr/js-sdk/.github%2Fworkflows%2Fbuild.yml?branch=main&label=Build&logo=github)](https://github.com/dapr/js-sdk/actions/workflows/build.yml) [![codecov](https://codecov.io/gh/dapr/js-sdk/branch/main/graph/badge.svg)](https://codecov.io/gh/dapr/js-sdk) [![GitHub License](https://img.shields.io/github/license/dapr/js-sdk?style=flat&label=License&logo=github)](https://github.com/dapr/js-sdk/blob/main/LICENSE) [![GitHub issue custom search in repo](https://img.shields.io/github/issues-search/dapr/js-sdk?query=type%3Aissue%20is%3Aopen%20label%3A%22good%20first%20issue%22&label=Good%20first%20issues&style=flat&logo=github)](https://github.com/dapr/js-sdk/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) [![Discord](https://img.shields.io/discord/778680217417809931?label=Discord&style=flat&logo=discord)](http://bit.ly/dapr-discord) [![YouTube Channel Views](https://img.shields.io/youtube/channel/views/UCtpSQ9BLB_3EXdWAUQYwnRA?style=flat&label=YouTube%20views&logo=youtube)](https://youtube.com/@daprdev) [![X (formerly Twitter) Follow](https://img.shields.io/twitter/follow/daprdev?logo=x&style=flat)](https://twitter.com/daprdev)

The official Dapr SDK for JavaScript and TypeScript, covering durable workflows, actors, pub/sub, state, jobs and more.

## Getting Started

Instantly get started by installing the Dapr JS SDK and reading the [getting started documentation](https://docs.dapr.io/developing-applications/sdks/js/) or [follow one of the quickstarts](https://github.com/dapr/quickstarts)

```sh
npm install --save @dapr/dapr
```

You can also use the development version of the SDK which is built from the `main` branch. Make sure to remove the `@dapr/dapr` package first. This package is not meant for production use, and should only be used for development purposes.

```sh
npm install --save @dapr/dapr-dev
```

## Documentation

Visit [https://docs.dapr.io/developing-applications/sdks/js/](https://docs.dapr.io/developing-applications/sdks/js/) to view the full documentation.

### Features

- **Workflows**: durable, long-running orchestrations that survive restarts (see the Workflows section below).
- **Actors**: virtual actors with timers and reminders.
- **Pub/sub**: publish messages and subscribe to topics, including streaming subscriptions.
- **State**: key/value state with transactions and queries.
- **Jobs**: schedule jobs that the Dapr runtime triggers.
- **Service invocation, bindings, secrets, configuration, distributed lock, cryptography and conversation** through the same client.
- **Search (Alpha1, Dapr 1.19+)**: `client.search` creates, lists and deletes indexes, upserts, fetches and deletes documents, and runs lexical or native queries. See the [Search client interface](https://github.com/dapr/js-sdk/blob/main/src/interfaces/Client/IClientSearch.ts) for the available operations.

## Workflows

Dapr Workflow lets you write durable execution in plain JavaScript or TypeScript: a workflow calls activities, waits on timers and external events, and fans out and back in, while Dapr persists its progress so it resumes where it left off after a crash or restart. Use `WorkflowRuntime` to register workflows and activities, and `DaprWorkflowClient` to schedule and manage runs.

- [Workflow examples](https://github.com/dapr/js-sdk/tree/main/examples/workflow): activity sequence, fan-out/fan-in, human interaction and workflow management.
- [Workflow overview](https://docs.dapr.io/developing-applications/building-blocks/workflow/workflow-overview/): concepts and patterns.
- [JS SDK documentation](https://docs.dapr.io/developing-applications/sdks/js/): client, server, actors and workflow guides.

## Community

There are multiple ways to get involved with the SDK community, please see [wiki/Community-engagement](https://github.com/dapr/js-sdk/wiki/Community-engagement) for more information.

The Dapr community can be found on [Discord](https://discord.com/invite/ptHhX6jc34), where you can ask questions, propose features, and share your thoughts.

## Contributing

Please see our [Contributing Overview](https://docs.dapr.io/contributing/sdk-contrib/js-contributing/).

### Good First Issues

We have a list of [good first issues](https://github.com/dapr/js-sdk/labels/good%20first%20issue) that contain bugs which have a relatively limited scope. This is a great place to get started, gain experience, and get familiar with our contribution process.

## Code of conduct

Please see [CODE_OF_CONDUCT.md](https://github.com/dapr/js-sdk/blob/main/CODE_OF_CONDUCT.md).
