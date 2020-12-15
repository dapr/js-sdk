import { Any } from 'google-protobuf/google/protobuf/any_pb';

var dapr = require('dapr-client');
var dapr_pb = dapr.dapr_pb;
var dapr_grpc = dapr.dapr_grpc;
var common_pb = dapr.common_pb;
var grpc = dapr.grpc;

// TODO: Get port from the environment.
// unfortunately for now clients don't have type info...
var client = new dapr_grpc.DaprClient(
    `localhost:50001`, grpc.credentials.createInsecure());

var event = new dapr_pb.PublishEventRequest();
event.setTopic('sith');
event.setPubsubName('pubsub');
event.setDataContentType('text/plain');
event.getMetadataMap().set('key', 'value');

const data = Buffer.from('lala');
event.setData(data);

client.publishEvent(event, (err, response) => {
    if (err) {
        console.log(`Error publishing! ${err}`);
    } else {
        console.log('Published!');
    }
});

// Invoke output binding named 'storage'
var binding = new dapr_pb.InvokeBindingRequest();
binding.setName('storage');
binding.setData(data);
binding.setOperation('create');
var metaMap = binding.getMetadataMap();
metaMap.set("key", "val");

client.invokeBinding(binding, (err, response) => {
    if (err) {
        console.log(`Error binding: ${err}`);
    } else {
        console.log('Bound!');
    }
});

// grcapp is not implemented yet
/*
var invoke = new InvokeServiceEnvelope();
invoke.setId('grpcapp');
invoke.setMethod('sith');
var serialized = new Any();
serialized.setValue(Buffer.from(JSON.stringify({
    name: 'test',
    message: {
        counter: 1
    }
})));
invoke.setData(serialized);

client.invokeService(invoke, (err, response) => {
    if (err) {
        console.log(`Error invoking service: ${err}`);
    } else {
        console.log('Invoked!');
    }
});
*/

var key = 'mykey';
var storeName = 'statestore';

var stateReq = new dapr_pb.SaveStateRequest();
stateReq.setStoreName(storeName);
var states = [new common_pb.StateItem()];
states[0].setKey(key);
states[0].setValue(Buffer.from('My State', 'utf-8'));

stateReq.setStatesList(states)

client.saveState(stateReq, (err, res) => {
    if (err) {
        console.log(`Error saving state: ${err}`);
    } else {
        console.log('Saved!');

        // saved, now do a get, promises would clean this up...
        var get = new dapr_pb.GetStateRequest();
        get.setStoreName(storeName)
        get.setKey(key);
        client.getState(get, (err, response) => {
            if (err) {
                console.log(`Error getting state: ${err}`);
            } else {
                console.log('Got!');
                console.log(String.fromCharCode.apply(null, response.getData()));

                // get done, now delete, again promises would be nice...
                var del = new dapr_pb.DeleteStateRequest();
                del.setStoreName(storeName)
                del.setKey(key);
                client.deleteState(del, (err, response) => {
                    if (err) {
                        console.log(`Error deleting state: ${err}`);
                    } else {
                        console.log('Deleted!');
                    }
                });
            }
        });
    }
});
