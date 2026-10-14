import { createAzure } from "@ai-sdk/azure";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";

type Settings = Record<string, string | undefined>;
type Options = { fetch?: typeof globalThis.fetch };

const OMNIROUTE_DEFAULT_URL = "http://localhost:20128/v1";
const DEFAULT_CONTEXT_WINDOW = 128_000;

// Reads a required setting. Errors name the key, never a value.
function required(env: Settings, key: string): string {
  const value = env[key];
  if (!value) throw new Error(`Missing setting: ${key}`);
  return value;
}

// Reads a required setting that must be an https URL, so keys never travel unencrypted.
function requiredHttpsUrl(env: Settings, key: string): string {
  const value = required(env, key);
  if (!URL.canParse(value) || new URL(value).protocol !== "https:") {
    throw new Error(`${key} must be a valid https URL`);
  }
  return value;
}

// Builds the model selected by MODEL_PROVIDER in .env.local.
// Azure uses the v1 endpoint and the Responses API, as Microsoft recommends.
// Vercel AI Gateway uses a "provider/model" id string, which eve routes
// through AI Gateway with AI_GATEWAY_API_KEY or Vercel OIDC credentials.
// `options.fetch` lets tests replace the network.
export function resolveModel(env: Settings, options: Options = {}): LanguageModel {
  switch (env.MODEL_PROVIDER) {
    case "gateway": {
      const modelId = required(env, "GATEWAY_MODEL_ID");
      if (!modelId.includes("/")) {
        throw new Error("GATEWAY_MODEL_ID must be a provider/model id, such as openai/gpt-4o-mini");
      }
      return modelId;
    }

    case "azure":
      return createAzure({
        baseURL: requiredHttpsUrl(env, "AZURE_AI_CHATBOT_OPENAI_ENDPOINT"),
        apiKey: required(env, "AZURE_AI_CHATBOT_API_KEY"),
        fetch: options.fetch,
      })(required(env, "AZURE_AI_CHATBOT_DEPLOYMENT_NAME"));

    case "omniroute":
      return createOpenAICompatible({
        name: "omniroute",
        baseURL: env.OMNIROUTE_BASE_URL || OMNIROUTE_DEFAULT_URL,
        apiKey: env.OMNIROUTE_API_KEY,
        fetch: options.fetch,
      }).chatModel(required(env, "OMNIROUTE_MODEL_ID"));

    default:
      throw new Error("MODEL_PROVIDER must be 'azure', 'gateway', or 'omniroute'");
  }
}

// eve needs the context window for models it has no catalog data for.
// AI Gateway models are in eve's catalog, so they need no default.
export function resolveContextWindow(env: Settings): number | undefined {
  const raw = env.MODEL_CONTEXT_WINDOW;
  if (!raw) return env.MODEL_PROVIDER === "gateway" ? undefined : DEFAULT_CONTEXT_WINDOW;

  const tokens = Number(raw);
  if (!Number.isInteger(tokens) || tokens <= 0) {
    throw new Error("MODEL_CONTEXT_WINDOW must be a positive whole number");
  }
  return tokens;
}
