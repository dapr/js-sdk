# Reference

Below a reference can be found of how you can get started with this SDK, utilizing the different features offered by [Dapr](https://dapr.io).

## Service Invocation

The service invocation methods are created as a warpper on the [Dapr Service Invocation API](https://docs.dapr.io/reference/api/service_invocation_api/).

### Invoking a method

```typescript
await client.invoker.invoke("app-id", "method", { hello: "world" });
```

### Listening to a method call

On top of the invoking, this SDK also implements a trivial way to listen to app invocations. Instead of creating your own web server, you can simply run the following commands which will listen to calls coming in on the provided endpoint.

```typescript
const invokerListen = (req: IRequest, res: IResponse) => {
  console.log(data);
};
await client.invoker.listen("method", invokerListen.bind(this), options);
```

## State Management

## Workflow history and rerun

Use `DaprWorkflowClient` to retrieve typed execution history and rerun a workflow from a history event. These operations require Dapr runtime 1.17 or later.

```typescript
import { DaprWorkflowClient, HistoryEvent } from "@dapr/dapr";

const client = new DaprWorkflowClient();
const history: HistoryEvent[] = await client.getWorkflowHistory("source-instance");
const scheduledEvent = history.find((event) => event.eventType.case === "taskScheduled");

if (scheduledEvent) {
  const newInstanceId = await client.rerunWorkflowFromEvent("source-instance", scheduledEvent.eventId, {
    newInstanceId: "rerun-instance",
    input: { value: "replacement" },
  });
  await client.waitForWorkflowCompletion(newInstanceId);
}
```

History events expose `eventId`, `timestamp`, and a typed `eventType` union. Narrow on `event.eventType.case` to access the corresponding payload, for example `event.eventType.value.input` for `"taskScheduled"`.

Rerunning creates a new instance; it does not modify the source instance. Omit `newInstanceId` to let the runtime generate an ID. Replacement `input` is JSON-serialized and applies to the activity targeted by the event, not the workflow's original input. Omitting input preserves the original activity input. Providing input (including `null`, `false`, `0`, or `""`) enables `overwriteInput` by default; set `overwriteInput: false` to preserve the original input explicitly. Setting `overwriteInput: true` without input requests that the runtime clear the activity input.

`rerunWorkflowFromEvent` rejects non-integer event IDs or IDs outside `0` through `4294967295` with `RangeError`, and an empty `newInstanceId` with `TypeError`. The runtime validates whether the source instance and event exist and whether the event can be rerun. Both history retrieval and rerun propagate runtime RPC errors as `ConnectError` from `@connectrpc/connect`, preserving the error code and message; they do not turn missing-instance errors into empty history or a successful rerun. Error codes and messages can differ between runtime versions. Unlike `getWorkflowState`, these methods do not normalize missing instances to `undefined`.

## Pub/Sub

## Bindings

## Actors

## Secrets

## Configuration

The configuration methods are created as a wrapper on the [Dapr Configuration API](https://docs.dapr.io/reference/api/configuration_api/). The Configuration API is currently only implemented for the gRPC client; calling any `client.configuration` method on the HTTP client throws an `HTTPNotSupportedError`.

### Getting configuration items

```typescript
const config = await client.configuration.get("config-store", ["myconfigkey1", "myconfigkey2"]);
console.log(config.items["myconfigkey1"]); // { key: "myconfigkey1", value: "...", version: "...", metadata: {} }
```

### Subscribing to configuration changes

Subscribe to be notified whenever configuration items change in the store. The callback is invoked with the items that changed; call `stop()` on the returned stream to unsubscribe.

```typescript
const stream = await client.configuration.subscribeWithKeys(
  "config-store",
  ["myconfigkey1", "myconfigkey2"],
  async (data) => {
    console.log("Configuration updated: ", data);
  },
);

// Later, stop listening for changes
stream.stop();
```

Use `client.configuration.subscribe(storeName, cb)` to subscribe to all keys in the store instead of a specific set, or `client.configuration.subscribeWithMetadata(storeName, keys, metadata, cb)` to pass store-specific metadata along with the subscription.
