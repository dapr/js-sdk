# Examples - Invocation

This example demonstrates how to use API Configuration.

## Run

```bash
# If it is not already, initialize DAPR on the system
dapr init

# Install dependenies
npm install

# Run the example
npm run start:dapr-http
```

## Switching from HTTP to gRPC

By default the example will run using HTTP. To use gRPC, do the following:
* Replace both occurrences of `process.env.DAPR_HTTP_PORT` with `process.env.DAPR_GRPC_PORT`
* Replace both occurrences of `CommunicationProtocolEnum.HTTP` with `CommunicationProtocolEnum.GRPC`
* Instead of `npm run start:dapr-http` run `npm run start:dapr-grpc`