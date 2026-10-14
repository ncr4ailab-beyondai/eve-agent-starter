// Stop / SubagentStop hook: work is not complete while checks fail.
// If this agent's code changed, runs npm test, typecheck, and lint in the agent folder.
// Skips when no code changed, or when these exact changes already passed.
import { execSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Fail closed: an unexpected error blocks instead of silently allowing.
process.on("uncaughtException", (error) => {
  console.error(`Blocked: hook failed (${error.message}). Report this to the user.`);
  process.exit(2);
});

const input = JSON.parse(readFileSync(0, "utf8"));
const agentDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const changedFiles = execSync(
  "git ls-files --modified --deleted --others --exclude-standard -- agent tests package.json tsconfig.json eslint.config.mjs",
  { cwd: agentDir, encoding: "utf8" },
)
  .split("\n")
  .filter(Boolean);
if (changedFiles.length === 0) process.exit(0);

// Skip if these exact file contents already passed.
const hash = createHash("sha256");
for (const file of [...new Set(changedFiles)].sort()) {
  const full = join(agentDir, file);
  hash.update(file + (existsSync(full) ? readFileSync(full) : "deleted"));
}
const cacheDir = join(tmpdir(), "claude-test-check");
const cacheFile = join(cacheDir, createHash("sha256").update(agentDir).digest("hex"));
const key = hash.digest("hex");
if (existsSync(cacheFile) && readFileSync(cacheFile, "utf8") === key) process.exit(0);

const failures = [];
for (const script of ["test", "typecheck", "lint"]) {
  const run = spawnSync("npm", ["run", script], { cwd: agentDir, encoding: "utf8", shell: true });
  if (run.status !== 0) {
    const output = `${run.stdout}${run.stderr}`.trim().split("\n").slice(-15).join("\n");
    failures.push(`npm run ${script} failed\n${output}`);
  }
}

if (failures.length === 0) {
  mkdirSync(cacheDir, { recursive: true });
  writeFileSync(cacheFile, key);
  process.exit(0);
}

const report = `Checks failed, so the work is not complete:\n\n${failures.join("\n\n")}`;
if (input.stop_hook_active) {
  // Already blocked once: stop looping, but tell the user plainly.
  console.log(JSON.stringify({ systemMessage: `Warning: ${report}` }));
  process.exit(0);
}
console.error(`${report}\n\nFix the cause (delegate code fixes to the coding agent), rerun the checks, then finish.`);
process.exit(2);
