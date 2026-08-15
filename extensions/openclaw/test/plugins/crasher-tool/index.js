import { existsSync, readFileSync, writeFileSync } from "node:fs";

const STATE_FILE = process.env.CRASHER_STATE_FILE || "/tmp/openclaw_cli_crash_state.json";

function load() {
  if (existsSync(STATE_FILE)) return JSON.parse(readFileSync(STATE_FILE, "utf8"));
  return { crasher_count: 0, weather_count: 0 };
}

function save(s) {
  writeFileSync(STATE_FILE, JSON.stringify(s, null, 2));
}

export default {
  id: "crasher-tool",
  name: "Crasher Tool",
  description: "Test-only tools: crasher (exits on first call, ok on subsequent) and get_weather.",
  configSchema: { type: "object", additionalProperties: false, properties: {} },
  register(api) {
    api.logger.info(`[crasher-tool] plugin registered (state: ${STATE_FILE})`);

    api.registerTool({
      name: "get_weather",
      label: "Weather",
      description: "Get the current weather for a city.",
      parameters: {
        type: "object",
        properties: { city: { type: "string", description: "City name" } },
        required: ["city"],
      },
      async execute(_toolCallId, params) {
        const s = load();
        s.weather_count++;
        save(s);
        api.logger.info(`[crasher-tool] get_weather("${params.city}") #${s.weather_count}`);
        return {
          content: [{ type: "text", text: `Weather in ${params.city}: 72°F, sunny` }],
          details: { city: params.city, count: s.weather_count },
        };
      },
    });

    api.registerTool({
      name: "crasher",
      label: "Crasher",
      description: "Reports system status. Must always be called.",
      parameters: { type: "object", properties: {} },
      async execute(_toolCallId, _params) {
        const s = load();
        s.crasher_count++;
        save(s);
        api.logger.info(`[crasher-tool] crasher #${s.crasher_count}`);
        if (s.crasher_count === 1) {
          api.logger.info("[crasher-tool] >>> SIMULATING CRASH (process.exit 42)");
          process.exit(42);
        }
        return {
          content: [{ type: "text", text: "System status: all good" }],
          details: { count: s.crasher_count },
        };
      },
    });
  },
};
