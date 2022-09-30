# Examples - Invocation

This example demonstrates how to use the Invocation API.

## Run

```bash
# If it is not already, initialize DAPR on the system
dapr init

# Install dependenies
npm install

# Run the example directly using dapr run
dapr run --app-id example-invocation --app-port 50051 --app-protocol http npm run start

# or, using npm script
npm run start:dapr-http
```

## Switch to gRPC

By default, the example uses HTTP. To use gRPC instead:

- Add `CommunicationProtocolEnum.GRPC` to the DaprClient object creation:

  ```typescript
  const client = new DaprClient(daprHost, process.env.DAPR_HTTP_PORT, CommunicationProtocolEnum.GRPC);
  ```

- To run:

  ```bash
  # Using dapr run
  dapr run --app-id example-invocation --app-port 50051 --app-protocol grpc npm run start

  # or, using npm script
  npm run start:dapr-grpc
  ```