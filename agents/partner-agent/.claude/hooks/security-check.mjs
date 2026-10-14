// PreToolUse (Bash) hook:
// - asks the user before the paid Gemini workflow image is generated;
// - scans for secrets before git commit, git push, or gh pr create (gitleaks). Blocks if a
//   leak is found or gitleaks is missing. Secret values are redacted in all output.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

// Fail closed: an unexpected error blocks instead of silently allowing.
process.on("uncaughtException", (error) => {
  console.error(`Blocked: hook failed (${error.message}). Report this to the user.`);
  process.exit(2);
});

const input = JSON.parse(readFileSync(0, "utf8"));
const command = String(input.tool_input?.command ?? "");

// Paid Gemini image generation always needs the user's explicit approval.
if (command.includes("workflow-image.mjs") && !command.includes("--check")) {
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "ask",
        permissionDecisionReason:
          "This generates ONE workflow image with Gemini. It is not free (about $0.034 per image). Approve?",
      },
    }),
  );
  process.exit(0);
}

const isCommit = /\bgit\b[^;&|]*\bcommit\b/.test(command);
const isPush = /\bgit\b[^;&|]*\bpush\b/.test(command) || /\bgh\s+pr\s+create\b/.test(command);
if (!isCommit && !isPush) process.exit(0);

function gitleaks(args) {
  const run = spawnSync("gitleaks", [...args, "--redact", "--no-banner"], { encoding: "utf8" });
  if (run.error) {
    console.error("Blocked: gitleaks is not installed, so the secret scan cannot run. Ask the user how to proceed.");
    process.exit(2);
  }
  return run.status === 0 ? "" : `${run.stdout}${run.stderr}`.trim();
}

const findings = [];
if (isCommit) {
  findings.push(gitleaks(["protect", "--staged"])); // staged changes
  findings.push(gitleaks(["protect"])); // unstaged changes (for commit -a)
}
if (isPush) {
  const upstream = spawnSync("git", ["rev-parse", "--abbrev-ref", "@{upstream}"], { encoding: "utf8" });
  const range = upstream.status === 0 ? `${upstream.stdout.trim()}..HEAD` : "HEAD";
  findings.push(gitleaks(["detect", "--log-opts", range])); // commits not yet pushed
}

const report = findings.filter(Boolean).join("\n\n");
if (!report) process.exit(0);

console.error(
  `Blocked: gitleaks found possible secrets. Do not commit or push. Report this to the user and recommend rotating any exposed key.\n\n${report}`,
);
process.exit(2);
