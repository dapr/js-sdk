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

- Add `CommunicationProtocolEnum.GRPC` to the DaprClient object creation. For example:

  ```javascript
    const client = new DaprClient(daprHost, process.env.DAPR_HTTP_PORT, CommunicationProtocolEnum.GRPC);
  ```

- Instead of running:

  ```bash
  # using dapr run
  dapr run --app-id example-invocation --app-port 50051 --app-protocol http npm run start

  # or npm script
  npm run start:dapr-http
  ```
  
  Run:

  ```bash
  # using dapr run
  dapr run --app-id example-invocation --app-port 50051 --app-protocol grpc npm run start

  # or npm script
  npm run start:dapr-grpc
  ```
