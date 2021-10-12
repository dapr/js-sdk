#!/bin/bash
echo "Starting Docker"
sudo service docker start

# Start MQTT for Binding tests
# Dashboard: http://localhost:18083 (user: admin, pass: public)
# Ports: 1883 = TCP MQTT Port | 8081 = HTTP API | 8083 = MQTT/SSL Port | 8883 = MQTT/Websocket/SSL Port | 8084 = MQTT/Websocket Port | 18083 = Dashboard
echo "Starting MQTT Broker for specific Bindings"
docker run -d --rm --name emqx -p 1883:1883 -p 8081:8081 -p 8083:8083 -p 8883:8883 -p 8084:8084 -p 18083:18083 emqx/emqx

# Start gRPC tests
echo "Running gRPC tests"
npm run test:e2e:grpc:main

# Start HTTP tests
echo "Running HTTP tests"
npm run test:e2e:http:main
npm run test:e2e:http:actors