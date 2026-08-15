# @dapr/openclaw-plugin

OpenClaw plugin that enables Dapr-backed durable execution for agent runs.

Install via the OpenClaw CLI:

```bash
openclaw plugins install @dapr/openclaw-plugin
```

Then enable it in `~/.openclaw/openclaw.json`:

```json
{
  "plugins": {
    "entries": {
      "dapr-durable-execution": { "enabled": true }
    }
  }
}
```

Run the gateway under Dapr:

```bash
dapr run -- openclaw gateway
```

See the full guide and crash-recovery demo at [@dapr/openclaw](https://github.com/dapr/js-sdk/tree/main/extensions/openclaw#readme).

Licensed under Apache-2.0.
