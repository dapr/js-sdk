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

## Workflow context and state

`WorkflowContext.getWorkflowName()` returns the registered workflow name, including
an explicit name supplied to `registerWorkflowByName`, and stays the same during replay.
`WorkflowActivityContext.getTaskExecutionId()` exposes Dapr's activity task execution
key (`taskExecutionId`). It returns `undefined` when the runtime supplies no key;
the SDK does not synthesize a key or change how activities are scheduled.
The existing `getWorkflowActivityId()` still returns the numeric task ID.

`WorkflowState.getInput<T>()`, `getOutput<T>()`, and `getCustomStatus<T>()`
deserialize payloads using the configured `IDaprSerializer` (JSON by default)
into the requested type (default `unknown`), without runtime type validation.
Configure the same serializer on `DaprWorkflowClient` and `WorkflowRuntime`;
workflow names and activity execution keys remain available with custom serializers.
Missing or empty serialized payloads return `undefined`; serialized
JSON `null`, `false`, `0`, and `""` are preserved with the default serializer.
Deserialization errors propagate; malformed JSON throws `SyntaxError` by default.
The engine's existing omission of `null` workflow output and custom
status is unchanged: omitted values deserialize as `undefined`.
Request payloads with `getWorkflowState(id, true)` or the existing `fetchPayloads`
argument on wait methods. The existing `serializedInput`, `serializedOutput`, and
`customStatus` properties remain serialized strings.

Every returned `WorkflowState` has `exists === true`, including pending, failed,
terminated, and completed instances. Missing or purged instances still return
`undefined`, not a placeholder state; use `state?.exists ?? false` to check
existence. State is a snapshot, so purging an instance does not mutate old snapshots.

`state.workflowFailureDetails?.getInnerFailure()` returns another
`WorkflowFailureDetails`. Call it recursively to inspect nested failures using
`getErrorType()`, `getErrorMessage()`, `getStackTrace()`, and `isNonRetriable`.
It returns `undefined` at the end of the chain. Nested details are preserved when
failed activities or child workflows fail their callers. The existing
`innerFailure` property still exposes the raw protobuf details for compatibility.

## Cross-application workflow tasks

`WorkflowContext.callActivity`, `callChildWorkflow`, and its alias `callSubWorkflow`
accept `targetAppId` and `propagationScope` in their existing options argument.
Register the named activity or workflow in the destination application's runtime.
Omitting `targetAppId` preserves local execution; omitting `propagationScope` shares
no history. These options are preserved on retries.

```typescript
import { HistoryPropagationScope, WorkflowContext } from "@dapr/dapr";

function* orderWorkflow(ctx: WorkflowContext): any {
  const stock = yield ctx.callActivity(
    "checkStock",
    { sku: "123" },
    {
      targetAppId: "inventory",
      propagationScope: HistoryPropagationScope.OWN_HISTORY,
    },
  );
  return yield ctx.callChildWorkflow("shipOrder", stock, undefined, {
    targetAppId: "shipping",
    propagationScope: HistoryPropagationScope.LINEAGE,
    retryPolicy: { firstRetryInterval: 1, maxNumberOfAttempts: 3 },
  });
}
```

With a supporting Dapr runtime (1.18 or later), `OWN_HISTORY` shares only the
calling workflow's history; `LINEAGE` also forwards its received ancestral
history. `NONE` is the default and does not forward inherited history.
History can contain sensitive inputs and outputs: opt in only for trusted callees.
Routing requires the calling app ID supplied by Dapr's workflow routing metadata;
if it is missing, a cross-app call fails explicitly instead of executing locally.

Both `WorkflowContext` and `WorkflowActivityContext` provide
`getPropagatedHistory()`, returning `undefined` when no ancestor history was
received. Otherwise, `history.chunks` is ordered oldest ancestor first and
immediate parent last. `PropagatedHistory` and `PropagatedHistoryEntry` are
type-only exports; the SDK creates and decodes these views internally.
The returned `PropagatedHistoryView` extends the original `PropagatedHistory`
interface without changing its `scope` or `chunks` contract. It adds:

- `events`: all decoded events in ancestor/chunk order, without deduplicating event IDs.
- `workflows`: chunks with `startEventIndex` and `eventCount` indexing that flattened array.
- `appIDs`: distinct app IDs in first-occurrence order.
- `getWorkflowByName(name)`: the oldest matching workflow chunk with offsets, or `null`.
- `getEventsByAppID(appId)`, `getEventsByInstanceID(id)`, and
  `getEventsByWorkflowName(name)`: events from all matching chunks, in order, or an empty array.

Workflow names can repeat across instances. Use the instance-ID filter to select
one instance; the workflow-name filter includes all matching instances.
These helpers do not deserialize payload JSON or change the original signed bytes.
The existing `propagationScope` options and enum values are the scheduling API;
no separate scope factories or chainable builders are needed.

```typescript
const history = ctx.getPropagatedHistory();
if (history) {
  const ancestor = history.getWorkflowByName("payment");
  const events = ancestor ? history.getEventsByInstanceID(ancestor.instanceId) : [];
  console.log(history.appIDs, events);
}
```

Each chunk exposes `appId`, `instanceId`, `workflowName`,
and decoded protobuf `events`. Payload fields such as `input` and `result` remain
serialized JSON. The original `rawEvents`, `rawSignatures`, and
`signingCertChains` are also available; the SDK does **not** verify signatures.
Received history is informational context, never replayed as the callee's own history.

## Detached workflows

With Dapr runtime 1.19 or later, `WorkflowContext.scheduleNewDetachedWorkflow`
schedules a workflow with no parent relationship. Unlike `callChildWorkflow`,
yielding its already-completed `Task<string>` returns the scheduled instance ID,
not the workflow's result. The caller does not wait for execution or receive
completion or failure notifications. Recursive termination of the caller does not
terminate the detached instance.

Detached workflow inputs use the configured serialization provider, just like
activity and child workflow inputs. Without a provider, inputs retain the default
JSON serialization behavior.

```typescript
function* orderWorkflow(ctx: WorkflowContext, order: unknown): any {
  const instanceId = yield ctx.scheduleNewDetachedWorkflow("shipOrder", order);
  return { shipmentWorkflowId: instanceId };
}
```

Arguments follow `DaprWorkflowClient.scheduleNewWorkflow`: workflow name or
function reference, optional input, optional instance ID, and optional `startAt`
date. The final `DetachedWorkflowOptions` argument supports `targetAppId` for
cross-application scheduling. Retries and history propagation are not supported.
Omitted IDs are generated deterministically; do not use random IDs or wall-clock
dates inside workflow code. For a delay, derive `startAt` from
`ctx.getCurrentUtcDateTime()`. Explicit IDs must be non-empty and must not be
scheduled twice in the same execution turn.

Creation is committed with the caller's workflow actions, including when the
caller completes in that turn. As with activities and child workflows,
`continueAsNew` discards uncommitted actions from the current turn; schedule the
detached workflow in the new generation or yield a durable task before continuing
as new. Replay consumes the recorded `detachedWorkflowInstanceCreated` event without
scheduling another instance. The returned ID is not confirmation that the runtime
has started the workflow. Use `DaprWorkflowClient` outside the workflow to inspect
or manage it independently.

Existing custom engine contexts do not need to implement the new method unless
they support detached scheduling; the base implementation throws an explicit
unsupported-operation error.

## Workflow cancellation and timeouts

`WorkflowContext.createTimer` and `waitForExternalEvent` return a `CancellableTask`.
This is a type-only interface extending `Task` with `cancel()` and read-only
`isCanceled`; there is no public constructor or task-settlement API.
Call `cancel()` from deterministic workflow code (for example, after another task
wins `whenAny`). Cancellation is idempotent and has no effect on completed tasks.
A canceled task completes with `TaskCanceledError`; yielding it or calling
`getResult()` throws that error. `whenAny` returns the winning task even if it
was canceled or timed out; inspect its result to observe the error.

```typescript
import { TaskTimeoutError, WorkflowContext } from "@dapr/dapr";

function* approvalWorkflow(ctx: WorkflowContext): any {
  const reminder = ctx.createTimer(30);
  const approval = ctx.waitForExternalEvent<boolean>("approval", {
    timeoutInSeconds: 300,
  });
  const winner = yield ctx.whenAny([reminder, approval]);
  if (winner === approval) {
    reminder.cancel();
  } else {
    yield ctx.callActivity("sendReminder");
  }
  try {
    return yield approval;
  } catch (error) {
    if (error instanceof TaskTimeoutError) {
      return false;
    }
    throw error;
  }
}
```

External-event timeouts use durable timers and workflow time, not wall-clock
JavaScript timers. `timeoutInSeconds` must be finite and non-negative; zero
schedules a timer due immediately. A buffered event is consumed without scheduling
a timeout. If the event and timeout race, their order in workflow history decides
the winner. Canceling or timing out an event wait removes only that waiter; future
events remain available to other waiters or are buffered as usual.

Cancellation is **SDK-local**, not runtime cancellation: the workflow protocol
has no cancel-timer action. A canceled timer (including a losing timeout timer)
may still be scheduled and fire in Dapr; its late firing is ignored by the SDK.
Cancellation must replay the same way on each execution. Do not use an
`AbortSignal`, `setTimeout`, or other nondeterministic callback to cancel tasks
inside a workflow. This does not cancel activities or child workflows.

All `DaprWorkflowClient` RPC methods accept an optional `AbortSignal` as their
last argument. Existing positional arguments are unchanged:

```typescript
const controller = new AbortController();
const waiting = client.waitForWorkflowCompletion(instanceId, true, 60, controller.signal);
controller.abort();
await waiting; // Rejects with ConnectError, code Code.Canceled.
```

Signals cancel the local RPC, **not the workflow**. An already accepted request
(including scheduling, raising an event, or termination) cannot be rolled back.
Use `terminateWorkflow` explicitly to request workflow termination.
Both client wait methods enforce their timeout as a transport deadline, canceling
the outstanding RPC on expiry instead of leaving it running. They reject with
`ConnectError` and `Code.DeadlineExceeded` on timeout (previously a generic
`Error("Timeout")`); wait timeouts must be greater than zero and no greater than
2147483.647 seconds. `stop()` performs no RPC and does not accept a signal.

## State Management

## Binary Store

`client.binaryStore` implements the Dapr Binary Store alpha API over HTTP and
gRPC, following the .NET SDK's binary file operations. It requires Dapr 1.19
or later (for prereleases, use 1.19.0-rc.3 or later) and a configured binary
store component, for example:

```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: binarystore
spec:
  type: binarystore.in-memory
  version: v1
  metadata:
    - name: maxSize
      value: "8Mi"
    - name: maxTotalSize
      value: "32Mi"
```

The in-memory component loses its files when the sidecar stops. Its per-file
and total-capacity limits apply independently of SDK upload chunk sizes.

```typescript
import { createReadStream, createWriteStream } from "node:fs";
import { DaprClient } from "@dapr/dapr";

const client = new DaprClient(); // HTTP; gRPC is also supported
await client.binaryStore.setBinaryFile("binarystore", "document.bin", Buffer.from([0, 128, 255]));
const bytes = await client.binaryStore.getBinaryFileBytes("binarystore", "document.bin");

await client.binaryStore.setBinaryFile("binarystore", "document.bin", createReadStream("document.bin"), {
  overwrite: true,
  chunkSize: 32 * 1024,
});
await client.binaryStore.getBinaryFile("binarystore", "document.bin", createWriteStream("download.bin"));

for await (const chunk of client.binaryStore.getBinaryFileChunks("binarystore", "document.bin")) {
  // Process each Buffer without loading the complete file into memory.
}
await client.binaryStore.deleteBinaryFile("binarystore", "document.bin");
await client.stop();
```

Uploads accept `Uint8Array` (including `Buffer`) or a binary Node.js `Readable`.
Empty files are supported. Upload chunks default to 32 KiB; `chunkSize` must be
a positive safe integer. Files are **not** overwritten unless `overwrite: true`
is supplied. Downloads expose ordered `Buffer` chunks, buffer the complete file
with `getBinaryFileBytes`, or write with backpressure using `getBinaryFile`.
The destination is ended on success and destroyed on failure; upload streams
are consumed and may be destroyed on cancellation or failure.

All methods accept an options object with `signal: AbortSignal` for cancellation.
Breaking out of a chunk download closes the response stream. Runtime failures,
including duplicate files, missing files or stores, and size limits, reject
instead of returning empty content. gRPC preserves `ConnectError` codes; HTTP
errors include the status and runtime response body.

Nested names such as `folder/document.bin` are supported. Empty names, leading
or trailing slashes, empty segments, `.` or `..` segments, and the characters
`\ * ? [ ] #` are rejected. Names are URL-encoded for HTTP, not treated as URLs.

Run the Docker-backed integration suite with a compatible runtime:

```powershell
$env:DAPR_RUNTIME_VERSION = "1.19.0-rc.4"
npm run test:e2e:binarystore
```

The suite exercises both protocols and cross-protocol reads using an authenticated
sidecar. It is included in `test:e2e:all` and skipped on runtimes older than 1.19.

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
