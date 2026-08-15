# @dapr/openclaw — Durable agent execution for OpenClaw

Run [OpenClaw](https://github.com/openclaw/openclaw) agents on top of Dapr Workflows. Every LLM call and tool call becomes a durable activity, so an agent that crashes mid-conversation resumes from the last checkpoint when it comes back up — no re-charging the model for completed turns, no re-running side-effecting tools.

This package patches `Agent.runPromptMessages` from `@mariozechner/pi-agent-core` (the run loop OpenClaw uses) to delegate to a Dapr Workflow. The patch is delivered as an OpenClaw plugin, so you don't write integration code — install the plugin, run the gateway under `dapr run`, done.

---

## Prerequisites

- **Node.js** ≥ 20
- **OpenClaw CLI** on `PATH` (`npm install -g openclaw` or `brew install openclaw`)
- **Dapr CLI** initialized: `dapr init` (this brings up Redis as the default state/workflow store)
- **OpenAI API key** in `OPENAI_API_KEY` (or any other provider OpenClaw is configured for)

Verify:

```bash
openclaw --version
dapr --version
redis-cli ping        # should print PONG
```

---

## Install

```bash
openclaw plugins install @dapr/openclaw-plugin
```

This pulls `@dapr/openclaw-plugin` from npm (which transitively installs the `@dapr/openclaw` runtime). OpenClaw places it under its own plugin directory and registers it for discovery — no manual `plugins.load.paths` entry needed.

If you're working from a clone of this repo instead of npm, see [Local development](#local-development) below.

---

## Configure OpenClaw to enable the plugin

Edit `~/.openclaw/openclaw.json` (or whichever config OpenClaw is using):

```jsonc
{
  "gateway": { "mode": "local" },
  "agents": { "defaults": { "model": "openai/gpt-4o-mini" } },
  "plugins": {
    "entries": {
      "dapr-durable-execution": { "enabled": true }
    }
  }
}
```

**`plugins.entries["dapr-durable-execution"].enabled = true`** is required. Without it, OpenClaw loads the plugin but never starts its service, and durable execution is silently disabled.

---

## Run the gateway under Dapr

You must launch the gateway through `dapr run` so the plugin can talk to a Dapr sidecar:

```bash
dapr run \
  --app-id openclaw \
  --resources-path /absolute/path/to/extensions/openclaw/test/components \
  --dapr-grpc-port 50001 \
  --dapr-http-port 3500 \
  -- openclaw gateway --port 18789
```

`test/components/statestore.yaml` is a ready-made Redis state store with `actorStateStore: "true"` (required by Dapr Workflows). For production, point `--resources-path` at your own components directory.

You should see, among the startup logs:

```
[plugins] [dapr] Importing Agent from gateway install: .../node_modules/@mariozechner/pi-agent-core/dist/index.js
[plugins] [dapr] Durable execution enabled — all agent prompts are now Dapr Workflows
```

That confirms the patch attached to the same module instance the gateway uses.

---

## Drive an agent turn

Once the gateway is healthy, the documented `openclaw agent` command works exactly as before — the durability is invisible to the user:

```bash
export OPENCLAW_CONFIG_PATH=/absolute/path/to/openclaw.json   # same value as the gateway shell
openclaw agent --session-id demo-1 --message "What is the capital of France? Answer in one word."
```

> **Gotcha.** `openclaw agent` reads `OPENCLAW_CONFIG_PATH` (or falls back to `~/.openclaw/openclaw.json`) to find the gateway's auth token. If the CLI shell points at a different config than the gateway shell, you'll see `unauthorized: gateway token mismatch` and the CLI will silently **fall back to running the prompt in-process** (embedded mode, bypassing Dapr entirely). Either export `OPENCLAW_CONFIG_PATH` in every shell that runs an openclaw command, or modify your default `~/.openclaw/openclaw.json` in place.

Verify the request actually went through Dapr by tailing the gateway log — you should see:

```
[dapr] runPromptMessages intercepted — routing through Dapr Workflow
[dapr] Scheduling new workflow openclaw-demo-1
[dapr] Workflow openclaw-demo-1 finished (status=1)
```

If you don't see those lines, the CLI fell back to embedded mode and durability wasn't exercised.

---

## End-to-end crash-recovery demo

The repo includes a self-contained demo that proves the durability story: an agent runs two tools, the gateway is killed mid-conversation by a tool that calls `process.exit`, and a fresh gateway resumes the same workflow from history without re-running the completed tool.

### What's in the demo

- `test/plugins/crasher-tool/` — an OpenClaw plugin that registers two tools:
  - `get_weather(city)` — returns a fixed string, increments a counter.
  - `crasher()` — increments a counter; on the **first** invocation it logs `SIMULATING CRASH` and calls `process.exit(42)`. On the second invocation it returns success.
    Counters live in `/tmp/openclaw_cli_crash_state.json`, so they survive the crash.
- `test/e2e/run-cli-crash-e2e.sh` — a two-phase shell harness that orchestrates the demo and verifies the outcome.

### Run it

```bash
export OPENAI_API_KEY=sk-...
cd extensions/openclaw
bash test/e2e/run-cli-crash-e2e.sh
```

Make sure no other openclaw gateway is running on the default port — the script uses `18800` and refuses to share.

### What happens

```
Phase 1
  └── start "dapr run -- openclaw gateway"
  └── send: "Run system diagnostics: call get_weather AND call crasher. Then summarize."
       openclaw → OpenAI → tool calls
         get_weather("TestCity")  →  weather_count = 1, returns "72°F, sunny"
         crasher()                →  crasher_count = 1, process.exit(42)
       gateway dies; CLI returns non-zero
       Dapr workflow state is left in Redis with status RUNNING

Phase 2
  └── start a fresh "dapr run -- openclaw gateway"
  └── send the same prompt with the same idempotency key
       patch sees existing RUNNING workflow → resumes instead of starting new
       Dapr replays get_weather from history (NOT re-executed; weather_count stays at 1)
       Dapr re-dispatches crasher                  → crasher_count = 2, returns success
       LLM is called once more with both results, summarizes
       workflow completes; CLI returns 0
```

### Verifying

The script checks all of the following:

| Check                                    | Expected    | What it proves                                                     |
| ---------------------------------------- | ----------- | ------------------------------------------------------------------ |
| Phase 1 CLI exit                         | non-zero    | gateway crashed mid-flight                                         |
| Phase 2 CLI exit                         | 0           | resumed run finished normally                                      |
| `crasher_count`                          | 2           | failed activity was re-dispatched                                  |
| `weather_count`                          | **1**       | completed activity was replayed from Dapr history, not re-executed |
| Phase 2 response references tool outputs | yes         | LLM saw the replayed + retried results                             |
| Dapr workflow `runtimeStatus`            | `COMPLETED` | end-to-end durability path reached terminal state                  |

`weather_count == 1` is the key check — that's what tells you Dapr is replaying activities from the workflow event history rather than re-executing them. If you swap `get_weather` for a side-effecting tool (sending an email, charging a card), it stays at one delivery across the crash.

Expected output on success:

```
[cli-e2e] === VERIFICATION ===
[cli-e2e]   PASS  Phase 1 CLI failed (exit 1, as expected)
[cli-e2e]   PASS  Phase 2 CLI succeeded (exit 0)
[cli-e2e]   PASS  crasher invoked exactly twice (crash + retry)
[cli-e2e]   PASS  get_weather NOT re-executed (replayed from Dapr history)
[cli-e2e]   PASS  Phase 2 response references tool outputs
[cli-e2e]   PASS  Dapr workflow completed (via HTTP API)
[cli-e2e] >>> ALL CHECKS PASSED — pure-CLI crash recovery verified.
```

If something fails, the script tails both phase logs.

---

## Configuration knobs

| Env var                        | Default     | Purpose                                                                                                                            |
| ------------------------------ | ----------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `DAPR_HOST`                    | `127.0.0.1` | Dapr sidecar host                                                                                                                  |
| `DAPR_GRPC_PORT`               | `50001`     | Dapr sidecar gRPC port                                                                                                             |
| `DAPR_OPENCLAW_MAX_ITERATIONS` | `100`       | Hard cap on LLM↔tool turns per prompt                                                                                              |
| `OPENCLAW_PATH`                | (auto)      | Override the openclaw install root if auto-detection from `process.argv[1]` fails (rare; only matters for unusual install layouts) |

---

## How it works

When the plugin's service starts, it:

1. Resolves `@mariozechner/pi-agent-core` from the running gateway's own install tree (via `createRequire(realpathSync(process.argv[1]))`), so the patched prototype is the same ESM module instance the gateway uses.
2. Replaces `Agent.prototype.runPromptMessages` with a wrapper that:
   - Computes a deterministic workflow ID from the agent's `sessionId`.
   - Looks up that workflow ID in Dapr; if it's `RUNNING`, attaches to it (crash-recovery path).
   - Otherwise schedules a new workflow.
   - Waits for completion, then writes the resulting messages back into the agent's state.
3. Each LLM call and each tool call inside the workflow is its own Dapr activity. Once an activity has succeeded, Dapr records its output in the workflow event history; on replay after a crash, that activity is **not** re-executed — its prior output is fed back into the workflow.

Tool callbacks and the streaming model client live in the gateway process (they aren't serializable), so the workflow stores only the inputs/outputs and looks the implementations up in an in-memory registry keyed by workflow ID. After a restart, the registry is repopulated by the resuming `runPromptMessages` call before the workflow continues, with a brief retry window to handle ordering.

---

## Local development

To work from a clone of this repo instead of an npm-installed plugin:

```bash
# from extensions/openclaw/
npm install
npm run build
(cd plugin && npm install)
```

Then point OpenClaw at the local plugin directory in your config:

```jsonc
"plugins": {
  "load": {
    "paths": ["/absolute/path/to/extensions/openclaw/plugin"]
  },
  "entries": {
    "dapr-durable-execution": { "enabled": true }
  }
}
```

This is also how the bundled crash-recovery demo (`test/e2e/run-cli-crash-e2e.sh`) works — it generates a temporary `openclaw.json` with `plugins.load.paths` and runs the gateway against it.

---

## License

Apache-2.0
