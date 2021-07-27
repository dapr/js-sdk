# Examples - Hello World

## Running

```bash
# Install
npm install

# Start a RabbitMQ Container (for the binding example part)
# note: mgmt interface at http://localhost:15672 
docker run -d --rm --hostname my-rabbitmq --name my-rabbitmq \
    -e RABBITMQ_DEFAULT_USER=test-user -e RABBITMQ_DEFAULT_PASS=test-pass \
    -p 0.0.0.0:5672:5672 -p 0.0.0.0:15672:15672 \
    rabbitmq:3-management


# MQTT Broker
# Dashboard: http://localhost:18083
# User: admin
# Pass: public
# 1883 = TCP MQTT Port
# 8081 = HTTP API
# 8083 = MQTT/SSL Port
# 8883 = MQTT/Websocket/SSL Port
# 8084 = MQTT/Websocket Port
# 18083 = Dashboard
docker run -d --name emqx -p 1883:1883 -p 8081:8081 -p 8083:8083 -p 8883:8883 -p 8084:8084 -p 18083:18083 emqx/emqx


# Start the Dapr Actor
cd examples/dotnet-actor-demo/DemoActorService
dapr run --app-id=dapr-demo-actor --app-port=10000 --dapr-http-port=10002 -- dotnet run

# Run this Example
cd examples/http/hello-world
npm run start:dapr
```