// PreToolUse hook: the planner agent only proceeds when GEMINI_API_KEY is configured.
// Checks presence only (via workflow-image.mjs --check); the key is never read aloud or printed.
// Other agents and the main session pass through.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Fail closed: an unexpected error blocks instead of silently allowing.
process.on("uncaughtException", (error) => {
  console.error(`Blocked: hook failed (${error.message}). Report this to the user.`);
  process.exit(2);
});

const input = JSON.parse(readFileSync(0, "utf8"));
if (input.agent_type !== "planner") process.exit(0);

const checkScript = fileURLToPath(new URL("../scripts/workflow-image.mjs", import.meta.url));
const check = spawnSync(process.execPath, [checkScript, "--check"], { encoding: "utf8" });
if (check.status === 0) process.exit(0);

console.error(
  "Blocked: the planner only runs when GEMINI_API_KEY is configured. " +
    "Ask the user to add GEMINI_API_KEY=<their key> to .env.local in this agent folder " +
    "(create a key at https://aistudio.google.com/apikey) and then restart. " +
    "Never ask for the key in chat. Stop now and tell the user this.",
);
process.exit(2);
