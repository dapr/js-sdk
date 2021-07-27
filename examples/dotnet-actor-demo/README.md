# Demo Actor

## Description

This demo actor is created to ensure we can test our examples

## Running

Start the Actor implementation through:

```bash
cd DemoActorService/
dotnet restore
dapr run --app-id=dapr-demo-actor --app-port=10000 --dapr-http-port=10001 --dapr-grpc-port=10002 -- dotnet run
```