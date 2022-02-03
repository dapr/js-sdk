# Examples - Invocation

This example demonstrates how to use API Configuration.

## Run

```bash
# If it is not already, initialize DAPR on the system
dapr init

# Install dependencies
npm install

# Run the example
dapr run --app-protocol http
```

## Switching from HTTP to gRPC

By default, the example will run using HTTP. To use gRPC:

- Add `CommunicationProtocolEnum.GRPC` to the DaprClient object creation.
- Instead of `dapr run --app-protocol http`, run `dapr run --app-protocol grpc`
