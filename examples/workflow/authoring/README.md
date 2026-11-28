# Examples - Dapr Workflow

## Running

### Activity Sequence example

```bash
# Install
npm install

# Run the example
npm run start:dapr:activity-sequence
```

### Fan out/Fan in example

```bash
# Install
npm install

# Run the example
npm run start:dapr:fanout-fanin
```

### Human Interaction in example

```bash
# Install
npm install

# Run the example
npm run start:dapr:human-interaction
```

### Compensation example

Shows the compensation (saga) pattern. The workflow books a flight, a hotel and a car. Each successful booking registers a matching cancellation. Booking the car fails on purpose, so the workflow catches the failed activity and runs the registered cancellations in reverse order (hotel, then flight), retrying each one with a retry policy.

```bash
# Install
npm install

# Run the example
npm run start:dapr:compensation
```

The workflow completes with `"Trip booking failed, compensation applied"`. For the same pattern in other SDKs, see the [Java compensation example](https://github.com/dapr/java-sdk/tree/master/examples/src/main/java/io/dapr/examples/workflows/compensation) and the [workflow patterns docs](https://docs.dapr.io/developing-applications/building-blocks/workflow/workflow-patterns/#compensation).

### Retry Policy example

Demonstrates automatic retries on workflow activities and child workflows using `RetryPolicy` (`firstRetryInterval`, `maxNumberOfAttempts`, `backoffCoefficient`, `maxRetryInterval`, and `retryTimeout`). Transient failures are retried with exponential backoff until they succeed.

```bash
# Install
npm install

# Run the example
npm run start:dapr:retry-policy
```

For details on each retry policy parameter, see the [Dapr workflow retry policies documentation](https://docs.dapr.io/developing-applications/building-blocks/workflow/workflow-features-concepts/#retry-policies).
