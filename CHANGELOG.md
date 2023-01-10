# Changelog

## 3.x release

### v3.0.0

#### Breaking Changes

##### GENERAL: Serialization changed and data is correctly being serialized now

Previously when sending data, it oculd happen that it was incorrectly serialized. This has been resolved and a new serializer is in place that will automatically detect the Content Type for the data on the HTTP Protocol and serialize accordingly. Objects will be send as `application/json`, Cloud Events as `applications/cloudevents+json`, Strings as `text/plain` and others as `application/octet-stream`.

As an example, when performing `client.invoke` with `"hello world"` as data instead of an object, the `JSON.serialize` method would be called and we would receive `'"hello world"'` (notice the `'`). Now due to the new serializer we will correctly return the string type.

## 2.x release

### v2.0.1

#### Actors

To make development easier, Actors can now be called in 2 ways:

1. By creating an actor through a helper method in the `DaprClient` class, removing the need of needing to know how a builder works.

```typescript
const actor = await client.actor.create<DemoActorSayImpl>(DemoActorSayImpl);
const res = await actor.sayMulti(123, "123", { hello: "world 123" }, [1, 2, 3]);
```

2. By utilizing the Actor builder, where we create a Proxy object that does this for us.

```typescript
const builder = new ActorProxyBuilder<DemoActorSayImpl>(DemoActorSayImpl, client);
const actor = builder.build(ActorId.createRandomId());
const res = await actor.sayMulti(123, "123", { hello: "world 123" }, [1, 2, 3]);
```

Behind the hoods, method #1 will utilize method #2

### v2.0.0

Version 2.0.0 brings a lot of changes to the Dapr JS SDK that were long due. Below an overview of the major contributions can be found, with a more detailed overview of the **Breaking Changes** under it.

- Actor Support has been added
- Actor Proxy has been added for Actor Access
- The HTTP Connection is now being reused to reduce the CONNRESET errors when intensively using the JS SDK
- The [Metadata API](https://docs.dapr.io/reference/api/metadata_api/) is supported
- The [Health API](https://docs.dapr.io/reference/api/health_api/) is supported
- The `/v1.0/shutdown` [API endpoint](https://docs.dapr.io/operations/hosting/kubernetes/kubernetes-job/) is now supported by calling `await client.sidecar.shutdown()`

#### Breaking Changes

- `DaprServer.ts`: `startServer()`, `stopServer()` have been renamed to `start()` and `stop()` this means that `await server.startServer()` will now be called as `await server.start()`
- `DaprServer.ts`: `close()` has been removed in favor of `stop()`

#### Major Changes

- KeepAlive for HTTP has been added and a new method in the `DaprClient` has been added named `stop()` to stop the client and release the connections kept by the sockets.
- `healthz` endpoint was implemented as `client.health.isHealthy()` for gRPC this checks the `getMetadata` function since it does not have a Health PROTO.
- Server startup now ensures the Dapr Sidecar is healthy before starting
- Add metadata API for gRPC and HTTP
- Add the SDK implementation for gRPC and HTTP for shutting down the Sidecar through the SDK

## 1.x release
