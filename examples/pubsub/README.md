# Examples - PubSubs

This example demonstrates how to use the PubSub API.

## Run

```bash
# If it is not already, initialize DAPR on the system
dapr init

# Install dependenies
npm install

# Start a RabbitMQ Container (for the binding example part)
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

By default, the example will run using HTTP. To use gRPC:

- Add `CommunicationProtocolEnum.GRPC` to the DaprClient object creation.
- Instead of `dapr run --app-protocol http`, run `dapr run --app-protocol grpc`