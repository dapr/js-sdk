# Examples - PubSubs

This example demonstrates how to use the PubSub API.

## Run

```bash
# If it is not already, initialize DAPR on the system
dapr init

# Install dependenies
npm install

# Start a RabbitMQ Container.
# note: mgmt interface at http://localhost:15672
docker run -d --rm --hostname my-rabbitmq --name my-rabbitmq \
    -e RABBITMQ_DEFAULT_USER=test-user -e RABBITMQ_DEFAULT_PASS=test-password \
    -p 0.0.0.0:5672:5672 -p 0.0.0.0:15672:15672 \
    rabbitmq:3-management

# Run the example directly using dapr run
dapr run --app-id example-pubsub --app-port 50051 --app-protocol http --components-path ./components npm run start

# or, using npm script
npm run start:dapr-http
```

## Switching to gRPC

By default, the example uses HTTP. To use gRPC instead:

- Add `CommunicationProtocolEnum.GRPC` to the DaprServer and DaprClient object creations and update the client port to `DAPR_GRPC_PORT`:

  ```typescript
  const server = new DaprServer({
    serverHost,
    serverPort,
    communicationProtocol: CommunicationProtocolEnum.GRPC,
    clientOptions: {
      daprHost,
      daprPort: process.env.DAPR_GRPC_PORT,
    },
  });

  const client = new DaprClient({
    daprHost,
    daprPort: process.env.DAPR_GRPC_PORT,
    communicationProtocol: CommunicationProtocolEnum.GRPC,
  });
  ```

- To run:

  ```bash
  # Using dapr run
  dapr run --app-id example-pubsub --app-port 50051 --app-protocol grpc --components-path ./components npm run start

  # or, using npm script
  npm run start:dapr-grpc
  ```
