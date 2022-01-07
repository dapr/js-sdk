# Changelog

## 2.x release

### v2.0.0

Version 2.0.0 brings a lot of changes to the Dapr JS SDK that were long due. Below an overview of the major contributions can be found, with a more detailed overview of the **Breaking Changes** under it.

* Actor Support has been added
* Actor Proxy has been added for Actor Access
* The HTTP Connection is now being reused to reduce the CONNRESET errors when intensively using the JS SDK 
* The [Metadata API](https://docs.dapr.io/reference/api/metadata_api/) is supported
* The [Health API](https://docs.dapr.io/reference/api/health_api/) is supported 

#### Breaking Changes

* `DaprServer.ts`: `startServer()`, `stopServer()` have been renamed to `start()` and `stop()` this means that `await server.startServer()` will now be called as `await server.start()`
* `DaprServer.ts`: `close()` has been removed in favor of `stop()`

#### Major Changes

* KeepAlive for HTTP has been added and a new method in the `DaprClient` has been added named `stop()` to stop the client and release the connections kept by the sockets.
* `healthz` endpoint was implemented as `client.health.isHealthy()` for gRPC this checks the `getMetadata` function since it does not have a Health PROTO.
* Server startup now ensures the Dapr Sidecar is healthy before starting
* Add metadata API for gRPC and HTTP

## 1.x release
