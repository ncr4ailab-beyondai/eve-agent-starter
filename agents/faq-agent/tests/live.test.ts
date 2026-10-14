// Live checks against the real model providers configured in .env.local.
// Run with `npm run test:live`. These make network calls and use real keys.
// A provider without credentials in .env.local is skipped.
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { generateText } from "ai";
import { describe, expect, it } from "vitest";
import { resolveModel } from "../agent/lib/model";

const settings = parseEnv(readFileSync(new URL("../.env.local", import.meta.url), "utf8"));

// Asks one provider for "pong", using the same settings the agent uses.
async function askPong(overrides: Record<string, string> = {}) {
  const env = { ...settings, ...overrides };
  if (env.MODEL_PROVIDER === "gateway") {
    // AI Gateway reads its key from process.env, as eve does at runtime.
    process.env.AI_GATEWAY_API_KEY ??= env.AI_GATEWAY_API_KEY;
  }
  const result = await generateText({
    model: resolveModel(env),
    prompt: "Reply with the single word: pong",
    maxRetries: 0,
    abortSignal: AbortSignal.timeout(60_000),
  });
  return { text: result.text.toLowerCase(), modelId: result.response.modelId };
}

describe("live model providers", { timeout: 90_000 }, () => {
  it("the provider selected in .env.local answers", async () => {
    expect((await askPong()).text).toContain("pong");
  });

  it.skipIf(!settings.AZURE_AI_CHATBOT_API_KEY)("Azure OpenAI answers", async () => {
    const reply = await askPong({ MODEL_PROVIDER: "azure" });

    expect(reply.text).toContain("pong");
    expect(reply.modelId).toContain(settings.AZURE_AI_CHATBOT_DEPLOYMENT_NAME ?? "");
  });

  it.skipIf(!settings.AI_GATEWAY_API_KEY)("Vercel AI Gateway answers", async () => {
    const reply = await askPong({ MODEL_PROVIDER: "gateway", GATEWAY_MODEL_ID: "openai/gpt-4o-mini" });

    expect(reply.text).toContain("pong");
  });

  it.skipIf(!settings.OMNIROUTE_API_KEY)("OmniRoute answers", async () => {
    const reply = await askPong({ MODEL_PROVIDER: "omniroute", OMNIROUTE_MODEL_ID: "auto/best-free" });

    expect(reply.text).toContain("pong");
  });
});
