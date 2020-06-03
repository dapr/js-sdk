var dapr = require('dapr-client');
var messages = dapr.dapr_pb;
var services = dapr.dapr_grpc;
var commonMessages = dapr.common_pb;
var grpc = dapr.grpc;

// TODO: Get port from the environment.
var client = new services.DaprClient(
    `localhost:50001`, grpc.credentials.createInsecure());

var event = new messages.PublishEventRequest();
event.setTopic('sith');

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
var binding = new messages.InvokeBindingRequest();
binding.setName('storage');
binding.setData(data);
binding.setOperation('create')
var metaMap = binding.getMetadataMap();
metaMap.set("key", "val");

client.invokeBinding(binding, (err, response) => {
    if (err) {
        console.log(`Error binding: ${err}`);
    } else {
        console.log('Bound!');
    }
});

// receiver-app is not implemented yet
/*
var invoke = new messages.InvokeServiceRequest();
invoke.setId('receiver-app');
var msg = new commonMessages.InvokeRequest();
msg.setMethod('my-method');
var serialized = new proto.google.protobuf.Any();
serialized.setValue(Buffer.from(JSON.stringify({
    data: {
        orderId: 1
    }
}), 'utf-8'));
msg.setData(serialized);

// Comment this block if receiver-app is using gRPC protocol
msg.setContentType('application/json');
var ext = new proto.dapr.proto.common.v1.HTTPExtension();
ext.setVerb(commonMessages.HTTPExtension.Verb.POST);
msg.setHttpExtension(ext);

invoke.setMessage(msg);
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

var stateReq = new messages.SaveStateRequest();
stateReq.setStoreName(storeName);
var states = [new commonMessages.StateItem()];
states[0].setKey(key);
states[0].setValue(Buffer.from('My State', 'utf-8'));

stateReq.setStatesList(states)

client.saveState(stateReq, (err, res) => {
    if (err) {
        console.log(`Error saving state: ${err}`);
    } else {
        console.log('Saved!');

        // saved, now do a get, promises would clean this up...
        var get = new messages.GetStateRequest();
        get.setStoreName(storeName)
        get.setKey(key);
        client.getState(get, (err, response) => {
            if (err) {
                console.log(`Error getting state: ${err}`);
            } else {
                console.log('Got!');
                console.log(String.fromCharCode.apply(null, response.getData()));

                // get done, now delete, again promises would be nice...
                var del = new messages.DeleteStateRequest();
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