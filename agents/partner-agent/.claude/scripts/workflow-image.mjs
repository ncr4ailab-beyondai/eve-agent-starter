// Generates ONE workflow image with Gemini for a planning session (used by the planner agent).
//   node .claude/scripts/workflow-image.mjs --check          is GEMINI_API_KEY configured? (no API call)
//   node .claude/scripts/workflow-image.mjs <plan-folder>    reads workflow-prompt.txt, writes workflow.<ext>
// One request, never retried. A plan folder that already has an image is refused unless
// --allow-another is passed (only after the user explicitly asks for another image).
// The key comes from the GEMINI_API_KEY environment variable or .env.local and is never printed.
// Docs: https://ai.google.dev/gemini-api/docs/image-generation (Interactions API).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseEnv } from "node:util";

const MODEL = "gemini-nano-banana-2.1";
const COST_NOTE =
  "Gemini image generation is not free: it has no free tier and costs about $0.034 per 1K image (Gemini API pricing, 2026-10-09).";
const IMAGE_TYPES = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

const args = process.argv.slice(2);
const envFileIndex = args.indexOf("--env-file");
const envFile =
  envFileIndex >= 0 ? args[envFileIndex + 1] : join(process.env.CLAUDE_PROJECT_DIR ?? process.cwd(), ".env.local");

function readApiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  try {
    return parseEnv(readFileSync(envFile, "utf8")).GEMINI_API_KEY ?? "";
  } catch {
    return "";
  }
}

// Sets the exit code instead of calling process.exit(), which can crash Node on Windows after fetch.
function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

// Finds the first {type: "image", data: <base64>} block anywhere in the response.
function findImage(node) {
  if (!node || typeof node !== "object") return undefined;
  if (node.type === "image" && typeof node.data === "string") return node;
  for (const value of Object.values(node)) {
    const image = findImage(value);
    if (image) return image;
  }
  return undefined;
}

async function main() {
  const apiKey = readApiKey();
  const missingKey =
    "GEMINI_API_KEY is not configured. Add GEMINI_API_KEY=<your key> to .env.local (create a key at https://aistudio.google.com/apikey). Never paste the key into chat.";

  if (args.includes("--check")) {
    if (!apiKey) return fail(missingKey);
    console.log(`GEMINI_API_KEY is configured. Model: ${MODEL}. ${COST_NOTE}`);
    return;
  }

  const planDir = args.find((arg, i) => !arg.startsWith("--") && args[i - 1] !== "--env-file");
  if (!planDir) return fail("Usage: node .claude/scripts/workflow-image.mjs <plan-folder> | --check");

  const existingImage = Object.values(IMAGE_TYPES)
    .map((ext) => join(planDir, `workflow.${ext}`))
    .find((file) => existsSync(file));
  if (existingImage && !args.includes("--allow-another")) {
    return fail(
      `This plan folder already has a workflow image (${existingImage}). Only one image is generated per planning session. ` +
        "Use --allow-another only after the user explicitly asks for another image.",
    );
  }

  const promptFile = join(planDir, "workflow-prompt.txt");
  if (!existsSync(promptFile)) return fail(`Missing ${promptFile}: write the image description there first.`);
  if (!apiKey) return fail(missingKey);

  let status = 0;
  let body = {};
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, input: [{ type: "text", text: readFileSync(promptFile, "utf8") }] }),
      signal: AbortSignal.timeout(120_000),
    });
    status = response.status;
    body = await response.json().catch(() => ({}));
  } catch (error) {
    body = { error: { message: error.message } };
  }

  const image = findImage(body);
  if (status !== 200 || !image) {
    const reason = body?.error?.message ?? (status === 200 ? "the response contained no image" : `HTTP ${status}`);
    return fail(`Image generation failed: ${reason}. It was not retried. Use the Mermaid diagram instead.`);
  }

  const imageFile = join(planDir, `workflow.${IMAGE_TYPES[image.mime_type] ?? "png"}`);
  writeFileSync(imageFile, Buffer.from(image.data, "base64"));
  console.log(`Saved ${imageFile} (model ${MODEL}).`);
}

await main();
