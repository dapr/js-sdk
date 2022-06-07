---
type: docs
title: "Logging in JavaScript SDK"
linkTitle: "Logging"
weight: 500
description: Configuring logging in JavaScript SDK
---

## Introduction

The JavaScript SDK comes with a out-of-box `Console` based logger. The SDK emits various internal logs to help users understand the chain of events and troubleshoot problems. A consumer of this SDK can customize the verbosity of the log, as well as provide their own implementation for the logger.

## Configure log level

The JavaScript SDK comes with five levels of logging in **ascending order of importance** - `error`, `warn`, `info`, `verbose`, and `debug`. Setting the log to a level means that the logger will emit all the logs that are at least as important as the mentioned level. For example, setting to `verbose` log means that the SDK will not emit `debug` level logs. The default log level is `info`.

### Dapr Client

```js
import { DaprClient, LogLevel } from "dapr-client";

// create a client instance with log level set to verbose.
const client = new DaprClient(daprHost, daprPort, options = { loggerOptions: { logLevel: LogLevel.verbose } });
```

> For more details on how to use the Client, see [JavaScript Client]({{< ref js-client/_index.md >}}).

### DaprServer

```js
import { DaprServer, LogLevel } from "dapr-client";

// create a server instance with log level set to error.
const server = new DaprServer(serverhost, serverPort, daprHost, daprPort, clientOptions = { loggerOptions: { logLevel: LogLevel.error } })
```

> For more details on how to use the Server, see [JavaScript Server]({{< ref js-server/_index.md >}}).

## Custom LoggerService

The JavaScript SDK uses the in-built `Console` for logging. To use a custom logger like Winston or Pino, you can implement the `LoggerService` interface.

Example of using Winston:
```ts
class WinsonLoggerService implement LoggerService {
    private logger;

    constructor() {
        this.logger = winston.createLogger({
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: 'combined.log' })
            ]
        });
    }

    error(_message: any, ..._optionalParams: any[]): void {
        this.logger.error(message, ...optionalParams)
    }
    warn(_message: any, ..._optionalParams: any[]): void {
        this.logger.warn(message, ...optionalParams)
    }
    info(_message: any, ..._optionalParams: any[]): void {
        this.logger.info(message, ...optionalParams)
    }
    verbose(_message: any, ..._optionalParams: any[]): void {
        this.logger.verbose(message, ...optionalParams)
    }
    debug(_message: any, ..._optionalParams: any[]): void {
        this.logger.debug(message, ...optionalParams)
    }
}
```