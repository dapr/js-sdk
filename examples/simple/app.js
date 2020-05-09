var dapr = require('dapr-client');
var messages = dapr.dapr_pb;
var services = dapr.dapr_grpc;
var grpc = dapr.grpc;

// TODO: Get port from the environment.
var client = new services.DaprClient(
    `localhost:50001`, grpc.credentials.createInsecure());

var event = new messages.PublishEventEnvelope();
event.setTopic('sith');

var data = new proto.google.protobuf.Any();
data.setValue(Buffer.from('lala'));
event.setData(data);

client.publishEvent(event, (err, response) => {
    if (err) {
        console.log(`Error publishing! ${err}`);
    } else {
        console.log('Published!');
    }
});

// Invoke output binding named 'storage'
var binding = new messages.InvokeBindingEnvelope();
binding.setName('storage');
binding.setData(data);

client.invokeBinding(binding, (err, response) => {
    if (err) {
        console.log(`Error binding: ${err}`);
    } else {
        console.log('Bound!');
    }
});


var invoke = new messages.InvokeServiceEnvelope();
invoke.setId('grpcapp');
invoke.setMethod('sith');
var serialized = new proto.google.protobuf.Any();
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

var key = 'mykey';
var storeName = 'statestore';

var state = new messages.SaveStateEnvelope();
state.setStorename(storeName);
var req = new messages.StateRequest();
req.setKey(key);

var value = new proto.google.protobuf.Any();
value.setValue(Buffer.from('My State'));
req.setValue(value);


state.addRequests(req);

client.saveState(state, (err, res) => {
    if (err) {
        console.log(`Error saving state: ${err}`);
    } else {
        console.log('Saved!');

        // saved, now do a get, promises would clean this up...
        var get = new messages.GetStateEnvelope();
        get.setStorename(storeName)
        get.setKey(key);
        client.getState(get, (err, response) => {
            if (err) {
                console.log(`Error getting state: ${err}`);
            } else {
                console.log('Got!');
                console.log(String.fromCharCode.apply(null, response.getData().getValue()));

                // get done, now delete, again promises would be nice...
                var del = new messages.DeleteStateEnvelope();
                del.setStorename(storeName)
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


