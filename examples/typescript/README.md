The dapr cli creates components/statestore.yaml and components/pubsub.yaml under the current folder if it's not already present. This example also needs a binding component so create a bindings.yaml file under components folder in current directory with the following content:

```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: storage
spec:
  type: bindings.redis
  metadata:
  - name: redisHost
    value: localhost:6379
  - name: redisPassword
    value: ""
  - name: actorStateStore
    value: "true"
```

Install dependencies using the following command
```bash
npm install
```

Run the following command to start the app
```bash
dapr run --app-id nodeapp --app-protocol grpc --dapr-grpc-port=50001 ./node_modules/.bin/ts-node app.ts
```

