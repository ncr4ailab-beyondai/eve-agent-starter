// Enforces "check current docs before writing code" for the coding subagent.
// Registered in .claude/settings.json; other agents and the main session pass through.
//   docs-check.mjs record   (PostToolUse) remembers that this agent run looked up docs
//   docs-check.mjs require  (PreToolUse)  blocks code edits until that happened
// A docs lookup is a Context7 query-docs call, a WebFetch, or reading docs
// bundled in node_modules (for example node_modules/eve/docs/).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Fail closed: an unexpected error blocks instead of silently allowing.
process.on("uncaughtException", (error) => {
  console.error(`Blocked: hook failed (${error.message}). Report this to the user.`);
  process.exit(2);
});

const input = JSON.parse(readFileSync(0, "utf8"));
if (input.agent_type !== "coding") process.exit(0); // only the coding agent is gated

const markerDir = join(tmpdir(), "claude-docs-check");
const marker = join(markerDir, `${input.session_id}-${input.agent_id ?? "main"}`);
const tool = input.tool_name ?? "";
const path = String(input.tool_input?.file_path ?? input.tool_input?.notebook_path ?? "").replaceAll("\\", "/");

if (process.argv[2] === "record") {
  const isDocsLookup =
    (tool.includes("context7") && tool.endsWith("query-docs")) ||
    tool === "WebFetch" ||
    (tool === "Read" && path.includes("/node_modules/") && path.includes("/docs/"));
  if (isDocsLookup) {
    mkdirSync(markerDir, { recursive: true });
    writeFileSync(marker, new Date().toISOString());
  }
  process.exit(0);
}

const isCode = /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(path);
if (!isCode || existsSync(marker)) process.exit(0);

console.error(
  "Blocked: check current documentation before editing code. " +
    "Use Context7 (resolve-library-id, then query-docs), the official docs (WebFetch), " +
    "or the docs bundled in node_modules for the libraries this change touches. Then retry the edit.",
);
process.exit(2);
