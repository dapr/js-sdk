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
Each chunk exposes `appId`, `instanceId`, `workflowName`,
and decoded protobuf `events`. Payload fields such as `input` and `result` remain
serialized JSON. The original `rawEvents`, `rawSignatures`, and
`signingCertChains` are also available; the SDK does **not** verify signatures.
Received history is informational context, never replayed as the callee's own history.

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
