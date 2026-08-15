/*
Copyright 2025 The Dapr Authors
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/**
 * OpenClaw plugin entry point for Dapr durable agent execution.
 *
 * This plugin patches the Agent class from @mariozechner/pi-agent-core so that
 * every Agent.prompt() call is orchestrated by a Dapr Workflow — each LLM call
 * and tool call becomes a durable activity with automatic crash recovery.
 *
 * Installation (canonical):
 *   openclaw plugin install @dapr/openclaw-plugin
 *
 * Installation (development):
 *   Add to openclaw.json:
 *   {
 *     "plugins": {
 *       "load": { "paths": ["/path/to/extensions/openclaw/plugin"] }
 *     }
 *   }
 *
 * Prerequisites:
 *   - Run OpenClaw via `dapr run -- openclaw gateway`
 *   - A Dapr state store configured for workflow persistence
 *
 * Environment variables:
 *   DAPR_HOST       Dapr sidecar host  (default: 127.0.0.1)
 *   DAPR_GRPC_PORT  Dapr sidecar gRPC port (default: 50001)
 *   DAPR_OPENCLAW_MAX_ITERATIONS  Max LLM↔tool turns per prompt (default: 100)
 */

import { realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

/**
 * Resolve `@mariozechner/pi-agent-core` from the gateway's own install tree.
 *
 * Why: importing pi-agent-core via bare specifier from this plugin's package
 * resolves to whatever copy Node finds in the plugin's node_modules ancestry,
 * which is often a DIFFERENT ESM module instance than the one the gateway
 * uses. Monkey-patching the wrong instance silently no-ops.
 *
 * How: anchor resolution at the running openclaw entry script (process.argv[1]).
 * `createRequire(<entry>)` makes Node walk up from that script's location,
 * finding pi-agent-core in the gateway's own node_modules tree regardless of
 * install layout (npm-global, brew, pnpm, project-local, bundled).
 *
 * Override with OPENCLAW_PATH if the entry script can't be detected.
 */
function resolveGatewayAgentCore() {
  if (process.env.OPENCLAW_PATH) {
    const req = createRequire(
      process.env.OPENCLAW_PATH.endsWith("/") ? process.env.OPENCLAW_PATH : process.env.OPENCLAW_PATH + "/",
    );
    return req.resolve("@mariozechner/pi-agent-core");
  }

  const entry = process.argv[1];
  if (!entry) {
    throw new Error(
      "[dapr] Cannot determine openclaw entry script (process.argv[1] is empty). Set OPENCLAW_PATH to the openclaw install directory.",
    );
  }
  const realEntry = realpathSync(entry);
  const gatewayRequire = createRequire(realEntry);
  return gatewayRequire.resolve("@mariozechner/pi-agent-core");
}

/** @type {{ disable: () => Promise<void> } | null} */
let extensionHandle = null;

export default {
  id: "dapr-durable-execution",
  name: "Dapr Durable Execution",
  description:
    "Durable agent execution powered by Dapr Workflows — crash recovery, replay, and per-operation checkpointing",
  configSchema: {},
  register(api) {
    api.registerService({
      id: "dapr-durable-execution",

      async start(ctx) {
        const daprHost = process.env.DAPR_HOST || "127.0.0.1";
        const daprPort = process.env.DAPR_GRPC_PORT || "50001";
        const maxIterations = parseInt(process.env.DAPR_OPENCLAW_MAX_ITERATIONS || "100", 10);

        ctx.logger.info(
          `[dapr] Enabling durable execution (sidecar: ${daprHost}:${daprPort}, maxIterations: ${maxIterations})`,
        );

        const agentCorePath = resolveGatewayAgentCore();
        ctx.logger.info(`[dapr] Importing Agent from gateway install: ${agentCorePath}`);
        const { Agent } = await import(pathToFileURL(agentCorePath).href);

        // Import our extension's enable/disable API (resolved relative to this plugin).
        const { enable, disable } = await import("@dapr/openclaw");

        await enable({
          agentClass: Agent,
          daprHost,
          daprPort,
          maxIterations,
        });

        extensionHandle = { disable };
        ctx.logger.info("[dapr] Durable execution enabled — all agent prompts are now Dapr Workflows");
      },

      async stop(ctx) {
        if (extensionHandle) {
          ctx.logger.info("[dapr] Disabling durable execution");
          await extensionHandle.disable();
          extensionHandle = null;
        }
      },
    });
  },
};
