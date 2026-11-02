# Examples - Hello World

## Running

```bash
# Install
npm install

# Start a RabbitMQ Container (for the binding example part)
# note: mgmt interface at http://localhost:15672
docker run -d --rm --hostname my-rabbitmq --name my-rabbitmq \
    -e RABBITMQ_DEFAULT_USER=test-user -e RABBITMQ_DEFAULT_PASS=test-password \
    -p 0.0.0.0:5672:5672 -p 0.0.0.0:15672:15672 \
    rabbitmq:3-management

# Run the example
npm run start:dapr
```

## Handling missing state

When retrieving state with `client.state.get()`, the requested key may not exist.

The example demonstrates this by deleting `key-2` and then attempting to retrieve it:

```typescript
await client.state.delete("state-redis", "key-2");

const resStateDelete = await client.state.get("state-redis", "key-2");

if (resStateDelete === "") {
  console.log("[Dapr-JS][Example][State] State 'key-2' does not exist");
} else {
  console.log(
    "[Dapr-JS][Example][State] State 'key-2' retrieved:",
    resStateDelete,
  );
}
```

When the requested state does not exist, the HTTP state API returns `204 No Content`. The JavaScript SDK treats this as a successful response and returns an empty string.

Other HTTP errors, such as `400` or `500`, are returned as errors and should be handled separately.
