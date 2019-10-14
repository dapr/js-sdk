# Dapr SDK for Javascript

This is the Dapr SDK for Javascript, based on the auto-generated proto client.<br>

For more info on Dapr and gRPC, visit [this link](https://github.com/dapr/docs/tree/master/howto/create-grpc-app).

This repo generates following package:
dapr.io

## Usage
Dapr javascript sdk package can be installed as:
```bash
npm install dapr.io
```

### Creating the client
```
var dapr = require('dapr-client');
var messages = dapr.dapr_pb; 
var services = dapr.dapr_grpc;
var grpc = require('grpc');

const PORT = process.env.DAPR_GRPC_PORT || 50001;
var client = new services.DaprClient('localhost:${PORT}`, grpc.credentials.createInsecure());
```

For usage, refer to [examples/simple/app.js](https://github.com/dapr/js-sdk/blob/master/examples/simple/app.js)


### Running the code locally.

From the root directory:

```
cd src
npm install
```

From the root directory:

```
cd examples/simple
npm install
```

```
dapr run --protocol grpc --grpc-port=50001 node app.js
```


TODO: Add more usage and update package name when finalized.
