import {
    DeleteStateEnvelope,
    GetStateEnvelope,
    InvokeBindingEnvelope,
    InvokeServiceEnvelope,
    PublishEventEnvelope,
    SaveStateEnvelope,
    StateRequest
} from 'dapr-client/dapr/dapr_pb';
import { DaprClient } from 'dapr-client/dapr/dapr_grpc_pb';
import { Any } from 'google-protobuf/google/protobuf/any_pb';

var dapr = require('dapr-client');
var grpc = dapr.grpc;

// TODO: Get port from the environment.
// unfortunately for now clients don't have type info...
var client = new DaprClient(
    `localhost:50001`, grpc.credentials.createInsecure());

var event = new PublishEventEnvelope();
event.setTopic('sith');

var data = new Any();
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
var binding = new InvokeBindingEnvelope();
binding.setName('storage');
binding.setData(data);

client.invokeBinding(binding, (err, response) => {
    if (err) {
        console.log(`Error binding: ${err}`);
    } else {
        console.log('Bound!');
    }
});


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

var key = 'mykey';
var storeName = 'statestore';

var state = new SaveStateEnvelope();
state.setStorename(storeName);
var req = new StateRequest();
req.setKey(key);

var value = new Any();
value.setValue(Buffer.from('My State'));
req.setValue(value);

state.addRequests(req);

client.saveState(state, (err, res) => {
    if (err) {
        console.log(`Error saving state: ${err}`);
    } else {
        console.log('Saved!');

        // saved, now do a get, promises would clean this up...
        var get = new GetStateEnvelope();
        get.setStorename(storeName)
        get.setKey(key);
        client.getState(get, (err, response) => {
            if (err) {
                console.log(`Error getting state: ${err}`);
            } else {
                console.log('Got!');
                console.log(String.fromCharCode.apply(null, response.getData().getValue()));

                // get done, now delete, again promises would be nice...
                var del = new DeleteStateEnvelope();
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


