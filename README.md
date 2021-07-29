# Dapr Node.js SDK

This is an unofficial [Dapr](https://dapr.io) Node.js SDK that allows interfacing with Dapr applications. The release is to demonstrate the possible way of structuring the SDK for community use.

> **Note:** This library is not ready for production yet

This SDK utilizes gRPC to communicate with the Daprd process

## Examples

For an example of the library, see the [Examples folder](/examples)

## Usage

### Simple PubSub Listener

To create a simply pub sub listener, we can now execute the following:

```javascript
import { DaprClient, DaprServer } from "@dapr/js-sdk";

// Subscribe
const server = new DaprServer(daprHost, daprPort, daprInternalServerPort);
server.pubsub.subscribe("pubsub-name", "topic", async (data: any) => console.log(data))
await server.startServer();

// Publish
const client = new DaprClient(daprHost, daprPort);
client.pubsub.publish("pubsub-name", "topic", { hello: "world" });
```

### General

We can utilize the library as shown in the code snippet below. Once implemented, start up your application with the `dapr run` command.

**Dapr Run:**

```bash
dapr run --app-id hello-world --app-port 4000 --dapr-http-port 3500 --components-path ./components/ npm run start:dev
```

**Library:**

```javascript
import { DaprClient, DaprServer } from "@dapr/js-sdk";

// Dapr ConnectionInfo
// daprUrl: the url to the Dapr Sidecar
// daprPort: the port to the Dapr Sidecar
const daprHost = "127.0.0.1";
const daprPort = 3500; 

// Internal Server Port
// This library spins up an internal webserver running restana
// We use this internal webserver for listening to dapr specific actions (e.g. method invocation, pub/sub, ...)
// Note: make sure to utilize --app-port <daprInternalServerPort> if you don't run your own web server
// Note 2: you can also set this port through the environment variable DAPR_INTERNAL_SERVER_PORT
const serverHost = "127.0.0.1";
const serverPort = 4000; 

const client = new DaprClient(daprHost, daprPort);
const server = new DaprServer(serverHost, serverPort);

// NOTE: This has to be executed AFTER all server calls are done.
// This is due to Dapr requiring that routes are registered before the server is started
// See the Usage - Simple PubSub Listener for more information
await server.startServer(); // start the internal server

// Pub / Sub
// Note: /dapr/subscribe will be called on the provided "daprInternalServerPort". 
// if you are running an extra HTTP server, make sure to utilize a different port. Dapr will not wait till your app started, which is not required since the library takes care of Dapr related functionality internally.
server.pubsub.subscribe("pubsub-name", "topic", async (data: any) => console.log(data))
await client.pubsub.publish("pubsub-name", "topic", { hello: "world" });

// State
const keys = [{ "key": "value" }, { "key2": "value2" }]; // IKeyValuePair[]
await client.state.save("store-name", );
await client.state.get("store-name", "key");
await client.state.delete("store-name", "key");
await client.state.getBulk("store-name", [ "key1", "key2" ]);

const stateOperations = [
  {
    operation: "upsert",
    request: {
      key: "key1",
      value: "myData"
    }
  }
]
await client.state.transaction("store-name", stateOperations)

// Binding
await client.binding.receive("binding-name", async (data: any) => console.log(data))
await client.binding.send("binding-name", "create", { hello: "world" });

// Invoke
await client.invoker.invoke("app-id", "method", HttpMethod.POST, { hello: "world" });
await client.invoker.listen("method", async (data: { body: object, query: string }) => console.log(data.body), { method: HttpMethod.POST });

// Secrets
await client.secret.get("secret-store-name", "key");
await client.secret.getBulk("secret-store-name", [ "key1", "key2" ]);

// Actors
await client.actor.invoke("GET", "actor-type", "actor-id", "method");
await client.actor.stateTransaction("actor-type", "actor-id", [{
  operation: "upsert",
  request: {
    key: "key1",
    value: "myData"
  }
}])
await client.actor.stateGet("actor-type", "actor-id", "key");
await client.actor.reminderCreate("actor-type", "actor-id", "name");
await client.actor.reminderGet("actor-type", "actor-id", "name");
await client.actor.reminderDelete("actor-type", "actor-id", "name");
await client.actor.timerCreate("actor-type", "actor-id", "name");
await client.actor.timerDelete("actor-type", "actor-id", "name");
```

## Development

The notes below help for developing the library locally.

### Installation

Run the following commands to configure the library

> ⚠ Make sure to have Dapr installed

```bash
npm install
npm run test
```

### Running the Library

The command below runs the build process and will rebuild each time we change a file. This comes in handy when checking issues.

```bash
npm run start:dev
```

### Publishing Package Package Maintenance

For publishing a new version, we update the version in `package.json` and we run `./publish.sh`

A custom script is utilized here since we have 2 libraries in one for HTTP and gRPC

### Running Tests

Tests are written per protocol layer: http or grpc. This is done because Dapr requires endpoints to be registered for for pubsub and bindings, making us having to start up the test, initialize those endpoints and then run. Since Dapr is a sidecar architecture, we thus have to start 2 test suites seperately.

```bash
# Start MQTT for Binding tests
# Dashboard: http://localhost:18083 (user: admin, pass: public)
# Ports: 1883 = TCP MQTT Port | 8081 = HTTP API | 8083 = MQTT/SSL Port | 8883 = MQTT/Websocket/SSL Port | 8084 = MQTT/Websocket Port | 18083 = Dashboard
docker run -d --rm --name emqx -p 1883:1883 -p 8081:8081 -p 8083:8083 -p 8883:8883 -p 8084:8084 -p 18083:18083 emqx/emqx

# Start gRPC tests
npm run test:dapr:grpc

# Start HTTP tests
npm run test:dapr:http
```

## Reference

### Service Invocation

The service invocation methods are created as a warpper on the [Dapr Service Invocation API](https://docs.dapr.io/reference/api/service_invocation_api/).

#### Invoking a method

```javascript
await client.invoker.invoke("app-id", "method", { hello: "world" });
```

#### Listening to a method call

On top of the invoking, this SDK also implements a trivial way to listen to app invocations. Instead of creating your own web server, you can simply run the following commands which will listen to calls coming in on the provided endpoint.

```javascript
const invokerListen = (req: IRequest, res: IResponse) => { console.log(data); }
await client.invoker.listen("method", invokerListen.bind(this), options)
```

### State Management

### Pub/Sub

### Bindings

### Actors

### Secrets
