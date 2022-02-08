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

## Switching to gRPC

By default, the example will run using HTTP. To use gRPC:

- Add `CommunicationProtocolEnum.GRPC` to the DaprClient object creation.
- Instead of `dapr run --app-protocol http`, run `dapr run --app-protocol grpc`