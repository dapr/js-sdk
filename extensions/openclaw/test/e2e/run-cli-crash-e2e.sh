#!/usr/bin/env bash
#
# Pure-CLI crash-recovery E2E: openclaw gateway + openclaw agent CLI only.
#
# No custom Agent.prompt() in user code. The gateway loads two OpenClaw plugins:
#   - extensions/openclaw/plugin           → Dapr durable execution
#   - extensions/openclaw/test/plugins/crasher-tool → crasher + get_weather tools
#
# Phase 1: start gateway; send a prompt via `openclaw agent`. The LLM calls
#          get_weather (succeeds) and crasher (process.exit 42 on first call).
#          Gateway dies mid-workflow; Dapr workflow state is in Redis.
#
# Phase 2: restart gateway; re-send the same prompt with the same --session-id.
#          Our patch detects the RUNNING workflow, Dapr replays get_weather
#          from history (tool NOT re-executed), re-dispatches crasher (now
#          succeeds), final LLM call summarizes, CLI returns the response.
#
# Prerequisites:
#   - openclaw on PATH
#   - dapr CLI + Redis (via `dapr init`)
#   - OPENAI_API_KEY in env
#   - Extension built (npm run build)
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPONENTS_DIR="$SCRIPT_DIR/../components"
DAPR_PLUGIN_DIR="$EXT_DIR/plugin"
CRASHER_PLUGIN_DIR="$EXT_DIR/test/plugins/crasher-tool"
STATE_FILE="/tmp/openclaw_cli_crash_state.json"

GATEWAY_PORT=18800
DAPR_GRPC_PORT=50011
DAPR_HTTP_PORT=3511
APP_ID="openclaw-cli-crash-e2e"
SESSION_ID="cli-crash-$(date +%s)"
PROMPT='Run system diagnostics: call get_weather with city "TestCity" AND call the crasher tool to report status. Always call both tools. Then summarize.'

# ─── Preflight ───────────────────────────────────────────────────────

if [ -z "${OPENAI_API_KEY:-}" ]; then
  echo "[cli-e2e] ERROR: OPENAI_API_KEY not set"
  exit 1
fi

OPENCLAW_BIN="$(which openclaw 2>/dev/null || true)"
[ -n "$OPENCLAW_BIN" ] || { echo "[cli-e2e] ERROR: openclaw not on PATH"; exit 1; }

command -v dapr >/dev/null || { echo "[cli-e2e] ERROR: dapr CLI not found"; exit 1; }

[ -f "$EXT_DIR/dist/index.js" ] || (cd "$EXT_DIR" && npm run build)
[ -d "$DAPR_PLUGIN_DIR/node_modules/@dapr/openclaw" ] || \
  { echo "[cli-e2e] ERROR: $DAPR_PLUGIN_DIR/node_modules/@dapr/openclaw missing — run 'npm install' in $DAPR_PLUGIN_DIR"; exit 1; }

# ─── Workspace + config ──────────────────────────────────────────────

WORK_DIR="$(mktemp -d -t openclaw-cli-crash-XXXXXX)"
CONFIG_FILE="$WORK_DIR/openclaw.json"
mkdir -p "$WORK_DIR/workspace"

cat > "$CONFIG_FILE" <<EOF
{
  "gateway": { "mode": "local" },
  "agents": { "defaults": { "model": "openai/gpt-4o-mini" } },
  "plugins": {
    "load": {
      "paths": [
        "$DAPR_PLUGIN_DIR",
        "$CRASHER_PLUGIN_DIR"
      ]
    },
    "entries": {
      "dapr-durable-execution": { "enabled": true },
      "crasher-tool":          { "enabled": true }
    }
  }
}
EOF

rm -f "$STATE_FILE"

export OPENCLAW_CONFIG_PATH="$CONFIG_FILE"
export OPENCLAW_STATE_DIR="$WORK_DIR"
export OPENCLAW_GATEWAY_PORT="$GATEWAY_PORT"
export CRASHER_STATE_FILE="$STATE_FILE"

# ─── Cleanup ─────────────────────────────────────────────────────────

GATEWAY_PGID=""
cleanup() {
  echo ""
  echo "[cli-e2e] Cleaning up..."
  [ -n "$GATEWAY_PGID" ] && kill -TERM -"$GATEWAY_PGID" 2>/dev/null || true
  dapr stop --app-id "$APP_ID" 2>/dev/null || true
  lsof -ti :"$GATEWAY_PORT" 2>/dev/null | xargs -r kill 2>/dev/null || true
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

lsof -ti :"$GATEWAY_PORT" 2>/dev/null | xargs -r kill 2>/dev/null || true

# ─── Helpers ─────────────────────────────────────────────────────────

start_gateway() {
  local phase="$1"
  echo ""
  echo "[cli-e2e] Phase $phase: starting 'dapr run -- openclaw gateway' ..."
  # Start in its own process group so we can kill the whole tree on cleanup.
  set -m
  dapr run \
    --app-id "$APP_ID" \
    --resources-path "$COMPONENTS_DIR" \
    --dapr-grpc-port "$DAPR_GRPC_PORT" \
    --dapr-http-port "$DAPR_HTTP_PORT" \
    --log-level warn \
    -- "$OPENCLAW_BIN" gateway --port "$GATEWAY_PORT" \
    > "$WORK_DIR/phase${phase}.log" 2>&1 &
  GATEWAY_PGID=$!
  set +m

  # Wait for gateway health (up to 90s — plugins take time to load)
  for i in $(seq 1 45); do
    if curl -sf "http://localhost:$GATEWAY_PORT/health" > /dev/null 2>&1; then
      echo "[cli-e2e] Gateway healthy."
      # Give the Dapr workflow runtime a moment to register
      sleep 3
      return 0
    fi
    # If the dapr process already exited, bail
    if ! kill -0 "$GATEWAY_PGID" 2>/dev/null; then
      echo "[cli-e2e] ERROR: gateway process exited during startup."
      tail -40 "$WORK_DIR/phase${phase}.log"
      return 1
    fi
    sleep 2
  done
  echo "[cli-e2e] ERROR: gateway did not become healthy in 90s."
  tail -60 "$WORK_DIR/phase${phase}.log"
  return 1
}

wait_for_gateway_exit() {
  local phase="$1"
  echo "[cli-e2e] Phase $phase: waiting for gateway to exit..."
  for _ in $(seq 1 30); do
    if ! kill -0 "$GATEWAY_PGID" 2>/dev/null; then
      echo "[cli-e2e] Phase $phase: gateway exited."
      return 0
    fi
    sleep 1
  done
  echo "[cli-e2e] Phase $phase: gateway still alive after 30s — killing."
  kill -TERM -"$GATEWAY_PGID" 2>/dev/null || true
  sleep 3
  kill -KILL -"$GATEWAY_PGID" 2>/dev/null || true
  return 0
}

# ─── Phase 1: crash ──────────────────────────────────────────────────

echo ""
echo "============================================================"
echo " Phase 1: gateway + CLI prompt, crasher triggers process.exit"
echo "============================================================"

start_gateway 1

echo "[cli-e2e] Phase 1: sending prompt via 'openclaw gateway call agent' ..."
# Build params JSON — we use `gateway call agent` (not `openclaw agent`) so the
# CLI never falls back to embedded-local execution when the gateway dies.
# Same idempotencyKey is re-used in phase 2 so both calls target the same workflow.
IDEMPOTENCY_KEY="cli-crash-key-$(date +%s)"
PARAMS_JSON=$(jq -n --arg m "$PROMPT" --arg s "$SESSION_ID" --arg k "$IDEMPOTENCY_KEY" \
  '{message:$m, sessionId:$s, sessionKey:$s, idempotencyKey:$k, timeout:90, deliver:false}')
set +e
PHASE1_RESPONSE=$(openclaw gateway call agent \
  --params "$PARAMS_JSON" \
  --expect-final \
  --timeout 120000 2>&1)
PHASE1_EXIT=$?
set -e
echo "[cli-e2e] Phase 1 CLI exit: $PHASE1_EXIT"
echo "[cli-e2e] Phase 1 CLI output (first 20 lines):"
echo "$PHASE1_RESPONSE" | head -20
echo "----"

wait_for_gateway_exit 1
GATEWAY_PGID=""
sleep 3

# ─── Phase 2: resume ─────────────────────────────────────────────────

echo ""
echo "============================================================"
echo " Phase 2: restart gateway, re-send same prompt, expect resume"
echo "============================================================"

start_gateway 2

echo "[cli-e2e] Phase 2: re-sending same prompt via 'openclaw gateway call agent' ..."
set +e
PHASE2_RESPONSE=$(openclaw gateway call agent \
  --params "$PARAMS_JSON" \
  --expect-final \
  --timeout 120000 2>&1)
PHASE2_EXIT=$?
set -e
echo "[cli-e2e] Phase 2 CLI exit: $PHASE2_EXIT"
echo "[cli-e2e] Phase 2 CLI output (first 30 lines):"
echo "$PHASE2_RESPONSE" | head -30
echo "----"

# ─── Verification ────────────────────────────────────────────────────

echo ""
echo "[cli-e2e] === VERIFICATION ==="

PASS=true
check() {
  local cond="$1" label="$2"
  if [ "$cond" = "true" ]; then
    echo "[cli-e2e]   PASS  $label"
  else
    echo "[cli-e2e]   FAIL  $label"
    PASS=false
  fi
}

# 1. Phase 1 CLI should NOT succeed (gateway died mid-flight)
[ "$PHASE1_EXIT" -ne 0 ] && check true "Phase 1 CLI failed (exit $PHASE1_EXIT, as expected)" \
                       || check false "Phase 1 CLI exited 0 (expected non-zero)"

# 2. Phase 2 CLI should succeed
[ "$PHASE2_EXIT" -eq 0 ] && check true "Phase 2 CLI succeeded (exit 0)" \
                       || check false "Phase 2 CLI exited $PHASE2_EXIT (expected 0)"

# 3. Counters: crasher=2, weather=1
if [ -f "$STATE_FILE" ]; then
  CRASHER_COUNT=$(jq -r '.crasher_count' "$STATE_FILE")
  WEATHER_COUNT=$(jq -r '.weather_count' "$STATE_FILE")
  echo "[cli-e2e]   crasher_count=$CRASHER_COUNT  weather_count=$WEATHER_COUNT"
  [ "$CRASHER_COUNT" = "2" ] && check true "crasher invoked exactly twice (crash + retry)" \
                           || check false "crasher_count=$CRASHER_COUNT (expected 2)"
  [ "$WEATHER_COUNT" = "1" ] && check true "get_weather NOT re-executed (replayed from Dapr history)" \
                           || check false "weather_count=$WEATHER_COUNT (expected 1)"
else
  check false "State file exists"
fi

# 4. Phase 2 response mentions both tools' results
if echo "$PHASE2_RESPONSE" | grep -qi "72\|sunny\|TestCity\|good\|status"; then
  check true "Phase 2 response references tool outputs"
else
  check false "Phase 2 response references tool outputs"
fi

# 5. Dapr workflow COMPLETED
# The gateway generates its own internal sessionId (UUID) rather than using
# the CLI's --session-id, so we extract the actual workflow ID from the phase 2
# log instead of guessing it. We also accept the workflow-finished log line
# from our patch (status=1 → COMPLETED in WorkflowRuntimeStatus enum) as proof.
WF_ID=$(grep -oE 'openclaw-[0-9a-f-]{36}' "$WORK_DIR/phase2.log" 2>/dev/null | head -1 || true)
if [ -n "$WF_ID" ]; then
  echo "[cli-e2e]   Detected workflow ID: $WF_ID"
  WF_STATE=$(curl -sf "http://localhost:$DAPR_HTTP_PORT/v1.0-beta1/workflows/dapr/$WF_ID" 2>/dev/null || echo "{}")
  WF_STATUS=$(echo "$WF_STATE" | jq -r '.runtimeStatus // "UNKNOWN"')
  echo "[cli-e2e]   Dapr workflow status (HTTP API): $WF_STATUS"
  if [ "$WF_STATUS" = "COMPLETED" ]; then
    check true "Dapr workflow completed (via HTTP API)"
  elif grep -q "finished (status=1)" "$WORK_DIR/phase2.log"; then
    check true "Dapr workflow completed (via patch log: status=1 = COMPLETED)"
  else
    check false "Workflow status is $WF_STATUS (expected COMPLETED)"
  fi
else
  if grep -q "finished (status=1)" "$WORK_DIR/phase2.log"; then
    check true "Dapr workflow completed (via patch log: status=1 = COMPLETED)"
  else
    check false "Could not detect workflow ID or completion log in phase 2"
  fi
fi

echo ""
if [ "$PASS" = "true" ]; then
  echo "[cli-e2e] >>> ALL CHECKS PASSED — pure-CLI crash recovery verified."
else
  echo "[cli-e2e] >>> SOME CHECKS FAILED"
  echo ""
  echo "[cli-e2e] Phase 1 log (tail):"
  tail -60 "$WORK_DIR/phase1.log" 2>/dev/null || true
  echo ""
  echo "[cli-e2e] Phase 2 log (tail):"
  tail -60 "$WORK_DIR/phase2.log" 2>/dev/null || true
  exit 1
fi
