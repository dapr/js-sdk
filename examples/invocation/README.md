# Examples - Invocation

This example demonstrates how to use the Invocation API.

## Run

```bash
# If it is not already, initialize DAPR on the system
dapr init

# Install dependenies
npm install

# Run the example
dapr run --app-protocol http
```

## Switching to gRPC

By default, the example will run using HTTP. To use gRPC:

- Add `CommunicationProtocolEnum.GRPC` to the DaprClient object creation.
- Instead of `dapr run --app-protocol http`, run `dapr run --app-protocol grpc`