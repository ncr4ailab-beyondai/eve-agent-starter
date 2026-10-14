import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SCRIPT = join(import.meta.dirname, "../.claude/scripts/env-check.mjs");
const SECRET = "sk-test-value-must-never-print";

function run(example: string, local: string | undefined, extraNames: string[] = []) {
  const dir = mkdtempSync(join(tmpdir(), "env-check-"));
  const examplePath = join(dir, ".env.example");
  const localPath = join(dir, ".env.local");
  writeFileSync(examplePath, example);
  if (local !== undefined) writeFileSync(localPath, local);
  const result = spawnSync(
    process.execPath,
    [SCRIPT, "--example", examplePath, "--local", localPath, ...extraNames],
    { encoding: "utf8" },
  );
  return { ...result, output: result.stdout + result.stderr };
}

describe("env-check", () => {
  it("reports each setting from .env.example as present, empty, or missing", () => {
    const { status, stdout } = run("A_KEY=\nB_KEY=placeholder\nC_KEY=\n", `A_KEY=${SECRET}\nB_KEY=\n`);

    expect(status).toBe(0);
    expect(stdout).toMatch(/^present\s+A_KEY$/m);
    expect(stdout).toMatch(/^empty\s+B_KEY$/m);
    expect(stdout).toMatch(/^missing\s+C_KEY$/m);
  });

  it("also checks extra names passed as arguments", () => {
    const { stdout } = run("A_KEY=\n", `A_KEY=x\nSLACK_BOT_TOKEN=${SECRET}\n`, ["SLACK_BOT_TOKEN", "GITHUB_TOKEN"]);

    expect(stdout).toMatch(/^present\s+SLACK_BOT_TOKEN$/m);
    expect(stdout).toMatch(/^missing\s+GITHUB_TOKEN$/m);
  });

  it("reports every name as missing when .env.local does not exist", () => {
    const { status, stdout } = run("A_KEY=\n", undefined);

    expect(status).toBe(0);
    expect(stdout).toMatch(/^missing\s+A_KEY$/m);
    expect(stdout).toMatch(/\.env\.local not found/);
  });

  it("never prints a value", () => {
    const { output } = run("A_KEY=\n", `A_KEY=${SECRET}\nOTHER=${SECRET}\n`, ["OTHER"]);

    expect(output).not.toContain(SECRET);
  });
});
