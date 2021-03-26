# Dapr SDK for Javascript

This is the Dapr SDK for Javascript, based on the auto-generated proto client.<br>

For more info on Dapr and gRPC, visit [this link](https://docs.dapr.io/operations/configuration/grpc/).

This repo generates following package:
dapr.io

## Usage
Dapr javascript sdk package can be installed as:
```bash
npm install dapr-client
```

### Creating the client
```js
var dapr = require('dapr-client');
var messages = dapr.dapr_pb; 
var services = dapr.dapr_grpc;
var grpc = require('grpc');

const PORT = process.env.DAPR_GRPC_PORT || 50001;
var client = new services.DaprClient(`localhost:${PORT}`, grpc.credentials.createInsecure());
```

For usage, refer to [examples/simple/app.js](https://github.com/dapr/js-sdk/blob/master/examples/simple/app.js)


### Running the code locally.

From the root directory:

```bash
cd src
npm install
```

From the root directory:

```bash
cd examples/simple
npm install
```

```bash
dapr run --app-protocol grpc --dapr-grpc-port=50001 node app.js --components-path ./components
```

### Generate gRPC interface and proto buf stubs

1. Make the `protobuf.sh` executable
```bash
sudo chmod +x protobuf.sh
```

2. Run the `protobuf.sh` script
```bash
./protobuf.sh
```

### Use the package from local source
From the root directory:

```bash
cd examples/simple
npm install ../..
```

### Creating and publishing the package

1. Update the version in package.json

2. From the root directory:

```bash
npm pack
npm publish --access public
```
*Note* --access public will publish the package publicly.
For all publish options see https://docs.npmjs.com/cli/publish
