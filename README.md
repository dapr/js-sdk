# Dapr SDK for JavaScript

[![NPM Version](https://img.shields.io/npm/v/%40dapr%2Fdapr?style=flat&logo=npm&label=Latest%20version)](https://www.npmjs.com/package/@dapr/dapr) [![NPM Downloads](https://img.shields.io/npm/dy/%40dapr%2Fdapr?style=flat&logo=npm&label=Downloads)](https://www.npmjs.com/package/@dapr/dapr) [![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/dapr/js-sdk/.github%2Fworkflows%2Fbuild.yml?branch=main&label=Build&logo=github)](https://github.com/dapr/js-sdk/actions/workflows/build.yml) [![codecov](https://codecov.io/gh/dapr/js-sdk/branch/main/graph/badge.svg)](https://codecov.io/gh/dapr/js-sdk) [![GitHub License](https://img.shields.io/github/license/dapr/js-sdk?style=flat&label=License&logo=github)](https://github.com/dapr/js-sdk/blob/main/LICENSE) [![GitHub issue custom search in repo](https://img.shields.io/github/issues-search/dapr/js-sdk?query=type%3Aissue%20is%3Aopen%20label%3A%22good%20first%20issue%22&label=Good%20first%20issues&style=flat&logo=github)](https://github.com/dapr/js-sdk/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) [![Discord](https://img.shields.io/discord/778680217417809931?label=Discord&style=flat&logo=discord)](http://bit.ly/dapr-discord) [![YouTube Channel Views](https://img.shields.io/youtube/channel/views/UCtpSQ9BLB_3EXdWAUQYwnRA?style=flat&label=YouTube%20views&logo=youtube)](https://youtube.com/@daprdev) [![X (formerly Twitter) Follow](https://img.shields.io/twitter/follow/daprdev?logo=x&style=flat)](https://twitter.com/daprdev)

The official Dapr SDK for JavaScript and TypeScript, covering durable workflows, actors, pub/sub, state, jobs and more.

## Getting Started

Instantly get started by installing the Dapr JS SDK and reading the [getting started documentation](https://docs.dapr.io/developing-applications/sdks/js/) or [follow one of the quickstarts](https://github.com/dapr/quickstarts)

```sh
npm install --save @dapr/dapr
```

## Documentation

Visit [https://docs.dapr.io/developing-applications/sdks/js/](https://docs.dapr.io/developing-applications/sdks/js/) to view the full documentation.

### Building blocks

The SDK implements the following Dapr building blocks:

- **Service invocation**: call methods on other Dapr applications. [Docs](https://docs.dapr.io/developing-applications/building-blocks/service-invocation/)
- **State management**: key/value state with transactions. [Docs](https://docs.dapr.io/developing-applications/building-blocks/state-management/)
- **Publish & subscribe**: publish messages and subscribe to topics, including streaming subscriptions. [Docs](https://docs.dapr.io/developing-applications/building-blocks/pubsub/)
- **Workflows**: durable, long-running orchestrations of activities, timers and external events that resume after a crash or restart. [Docs](https://docs.dapr.io/developing-applications/building-blocks/workflow/), [examples](https://github.com/dapr/js-sdk/tree/main/examples/workflow)
- **Bindings**: trigger and be triggered by external systems. [Docs](https://docs.dapr.io/developing-applications/building-blocks/bindings/)
- **Actors**: virtual actors with timers and reminders. [Docs](https://docs.dapr.io/developing-applications/building-blocks/actors/)
- **Secrets**: read secrets from a secret store. [Docs](https://docs.dapr.io/developing-applications/building-blocks/secrets/)
- **Configuration**: read and subscribe to configuration items. [Docs](https://docs.dapr.io/developing-applications/building-blocks/configuration/)
- **Distributed lock**: acquire and release locks on shared resources. [Docs](https://docs.dapr.io/developing-applications/building-blocks/locks/)
- **Cryptography**: encrypt and decrypt data without exposing keys to the application. [Docs](https://docs.dapr.io/developing-applications/building-blocks/cryptography/)
- **Jobs**: schedule jobs that the Dapr runtime triggers. [Docs](https://docs.dapr.io/developing-applications/building-blocks/jobs/)
- **Conversation**: send prompts to LLM providers through a common API. [Docs](https://docs.dapr.io/developing-applications/building-blocks/conversation/)
- **Binary store (Alpha, Dapr 1.19+)**: upload, stream and delete binary files.
- **Vector (Alpha, Dapr 1.19+)**: store dense, pre-embedded vectors and run similarity queries.
- **Search (Alpha, Dapr 1.19+)**: manage indexes and documents and run lexical or native queries.

## Community

There are multiple ways to get involved with the SDK community, please see [wiki/Community-engagement](https://github.com/dapr/js-sdk/wiki/Community-engagement) for more information.

The Dapr community can be found on [Discord](https://discord.com/invite/ptHhX6jc34), where you can ask questions, propose features, and share your thoughts.

## Contributing

Please see our [Contributing Overview](https://docs.dapr.io/contributing/sdk-contrib/js-contributing/).

### Good First Issues

We have a list of [good first issues](https://github.com/dapr/js-sdk/labels/good%20first%20issue) that contain bugs which have a relatively limited scope. This is a great place to get started, gain experience, and get familiar with our contribution process.

## Code of conduct

Please see [CODE_OF_CONDUCT.md](https://github.com/dapr/js-sdk/blob/main/CODE_OF_CONDUCT.md).
