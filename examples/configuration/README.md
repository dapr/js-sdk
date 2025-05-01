# Examples - Configuration

This example demonstrates how to use Configuration API.

## Prerequisites

In your Config store, create keys `key1` and `key2` to see the use of `get`.

```bash
docker exec dapr_redis redis-cli MSET key1 "foo" key2 "bar"
```

After the program starts, you can change the values of these keys to see use of `subscribe`.

```bash
docker exec dapr_redis redis-cli MSET key2 "bar2"
docker exec dapr_redis redis-cli MSET key1 "foobar"
```

## Run

```bash
# If it is not already, initialize DAPR on the system
dapr init

# Install dependencies
npm install

# Run the example directly using dapr run
dapr run --app-id example-config --app-port 50051 --app-protocol grpc --resources-path ./components -- npm run start

# or, using npm script
npm run start:dapr-grpc
```

## Sample output

```
{
  items: {
    key1: { key: 'key1', value: 'foo', version: '', metadata: {} },
    key2: { key: 'key2', value: 'bar2', version: '', metadata: {} }
  }
}
Subscribe received updates from config store:  {
  items: { key2: { key: 'key2', value: 'bar', version: '', metadata: {} } }
}
Subscribe received updates from config store:  {
  items: { key1: { key: 'key1', value: 'foobar', version: '', metadata: {} } }
}
```
