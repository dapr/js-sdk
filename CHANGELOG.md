# Changelog

## 2.x release

### v2.0.0

Version 2.0.0 brings a lot of changes to the Dapr JS SDK that were long due. Below an overview of the major contributions can be found, with a more detailed overview of the **Breaking Changes** under it.

* Actor Support has been added
* Actor Proxy has been added for Actor Access
* The HTTP Connection is now being reused to reduce the CONNRESET errors when intensively using the JS SDK 

#### Breaking Changes

* `DaprServer.ts`: `startServer()`, `stopServer()` have been renamed to `start()` and `stop()` this means that `await server.startServer()` will now be called as `await server.start()`
* `DaprServer.ts`: `close()` has been removed in favor of `stop()`

#### Major Changes

* KeepAlive for HTTP has been added and a new method in the `DaprClient` has been added named `stop()` to stop the client and release the connections kept by the sockets.

## 1.x release
