# Development

The notes below help for developing the library locally.

## Installation

Run the following commands to configure the library

> ⚠ Make sure to have Dapr installed

```bash
npm install
npm run test
```

## Running the Library

The command below runs the build process and will rebuild each time we change a file. This comes in handy when checking issues.

```bash
npm run start:dev
```

## Publishing Package Package Maintenance

For publishing a new version, we update the version in `package.json` and we run `./publish.sh`

A custom script is utilized here since we have 2 libraries in one for HTTP and gRPC

## Running Tests

Tests are written per protocol layer: http or grpc. This is done because Dapr requires endpoints to be registered for for pubsub and bindings, making us having to start up the test, initialize those endpoints and then run. Since Dapr is a sidecar architecture, we thus have to start 2 test suites seperately.

```bash
# Start MQTT for Binding tests
# Dashboard: http://localhost:18083 (user: admin, pass: public)
# Ports: 1883 = TCP MQTT Port | 8081 = HTTP API | 8083 = MQTT/SSL Port | 8883 = MQTT/Websocket/SSL Port | 8084 = MQTT/Websocket Port | 18083 = Dashboard
docker run -d --rm --name emqx -p 1883:1883 -p 8081:8081 -p 8083:8083 -p 8883:8883 -p 8084:8084 -p 18083:18083 emqx/emqx

# Start gRPC tests
npm run test:e2e:grpc:main

# Start HTTP tests
npm run test:e2e:http:main
npm run test:e2e:http:actors
```

## Publishing

Publishing is automated in the CI/CD pipeline. Each time a version is release (GitHub ref starting with `refs/tags/v`) then the pipeline will deploy the package as described in [build.yml](./.github/workflows/build.yml).