import { APICallError, generateText, type LanguageModel } from "ai";
import { describe, expect, it } from "vitest";
import { resolveContextWindow, resolveModel } from "../agent/lib/model";

// Gateway models are plain id strings; direct providers are model objects.
function describeModel(model: LanguageModel) {
  return typeof model === "string"
    ? { provider: "gateway", modelId: model }
    : { provider: model.provider, modelId: model.modelId };
}

const AZURE = {
  MODEL_PROVIDER: "azure",
  AZURE_AI_CHATBOT_API_KEY: "test-key-not-real",
  AZURE_AI_CHATBOT_OPENAI_ENDPOINT: "https://navio-chatbot.openai.azure.com/openai/v1",
  AZURE_AI_CHATBOT_DEPLOYMENT_NAME: "gpt-4o-mini",
};

// Minimal Azure OpenAI Responses API reply.
function responsesReply(text: string) {
  return {
    id: "resp_test",
    object: "response",
    created_at: 1_760_000_000,
    status: "completed",
    model: "gpt-4o-mini",
    output: [
      {
        type: "message",
        id: "msg_test",
        status: "completed",
        role: "assistant",
        content: [{ type: "output_text", text, annotations: [] }],
      },
    ],
    usage: { input_tokens: 5, output_tokens: 1, total_tokens: 6 },
  };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("resolveContextWindow", () => {
  it("defaults to 128000 tokens", () => {
    expect(resolveContextWindow({})).toBe(128_000);
  });

  it("reads MODEL_CONTEXT_WINDOW", () => {
    expect(resolveContextWindow({ MODEL_CONTEXT_WINDOW: "32000" })).toBe(32_000);
  });

  it("rejects a value that is not a positive whole number", () => {
    expect(() => resolveContextWindow({ MODEL_CONTEXT_WINDOW: "lots" })).toThrow(
      /MODEL_CONTEXT_WINDOW/,
    );
  });

  it("leaves the window to eve's catalog for Vercel AI Gateway models", () => {
    expect(resolveContextWindow({ MODEL_PROVIDER: "gateway" })).toBeUndefined();
  });

  it("still honors MODEL_CONTEXT_WINDOW for Vercel AI Gateway models", () => {
    expect(
      resolveContextWindow({ MODEL_PROVIDER: "gateway", MODEL_CONTEXT_WINDOW: "64000" }),
    ).toBe(64_000);
  });
});

describe("resolveModel: Vercel AI Gateway", () => {
  it("returns the gateway model id so eve routes it through AI Gateway", () => {
    const model = resolveModel({
      MODEL_PROVIDER: "gateway",
      GATEWAY_MODEL_ID: "openai/gpt-4o-mini",
    });

    expect(describeModel(model)).toEqual({ provider: "gateway", modelId: "openai/gpt-4o-mini" });
  });

  it("requires GATEWAY_MODEL_ID", () => {
    expect(() => resolveModel({ MODEL_PROVIDER: "gateway" })).toThrow(/GATEWAY_MODEL_ID/);
  });

  it("requires a provider/model id", () => {
    expect(() =>
      resolveModel({ MODEL_PROVIDER: "gateway", GATEWAY_MODEL_ID: "gpt-4o-mini" }),
    ).toThrow(/GATEWAY_MODEL_ID/);
  });
});

describe("resolveModel: OmniRoute", () => {
  it("builds an OmniRoute chat model from settings", () => {
    const model = describeModel(
      resolveModel({ MODEL_PROVIDER: "omniroute", OMNIROUTE_MODEL_ID: "auto" }),
    );

    expect(model.provider).toContain("omniroute");
    expect(model.modelId).toBe("auto");
  });

  it("requires OMNIROUTE_MODEL_ID", () => {
    expect(() => resolveModel({ MODEL_PROVIDER: "omniroute" })).toThrow(/OMNIROUTE_MODEL_ID/);
  });
});

describe("switching providers", () => {
  it("each provider uses its own model setting, so only MODEL_PROVIDER changes", () => {
    const env = { GATEWAY_MODEL_ID: "openai/gpt-4o-mini", OMNIROUTE_MODEL_ID: "auto/best-free" };

    expect(describeModel(resolveModel({ ...env, MODEL_PROVIDER: "gateway" })).modelId).toBe(
      "openai/gpt-4o-mini",
    );
    expect(describeModel(resolveModel({ ...env, MODEL_PROVIDER: "omniroute" })).modelId).toBe(
      "auto/best-free",
    );
  });
});

describe("resolveModel: settings validation", () => {
  it("rejects an unknown provider", () => {
    expect(() => resolveModel({ MODEL_PROVIDER: "other" })).toThrow(/MODEL_PROVIDER/);
  });

  it.each([
    "AZURE_AI_CHATBOT_API_KEY",
    "AZURE_AI_CHATBOT_OPENAI_ENDPOINT",
    "AZURE_AI_CHATBOT_DEPLOYMENT_NAME",
  ])("names a missing %s", (key) => {
    expect(() => resolveModel({ ...AZURE, [key]: undefined })).toThrow(new RegExp(key));
  });

  it("rejects an endpoint that is not an https URL", () => {
    expect(() =>
      resolveModel({ ...AZURE, AZURE_AI_CHATBOT_OPENAI_ENDPOINT: "http://example.com/openai/v1" }),
    ).toThrow(/AZURE_AI_CHATBOT_OPENAI_ENDPOINT/);
    expect(() =>
      resolveModel({ ...AZURE, AZURE_AI_CHATBOT_OPENAI_ENDPOINT: "not a url" }),
    ).toThrow(/AZURE_AI_CHATBOT_OPENAI_ENDPOINT/);
  });

  it("never puts the API key in a validation error", () => {
    const call = () => resolveModel({ ...AZURE, AZURE_AI_CHATBOT_DEPLOYMENT_NAME: undefined });

    expect(call).toThrow();
    expect(call).not.toThrow(new RegExp(AZURE.AZURE_AI_CHATBOT_API_KEY));
  });
});

describe("resolveModel: Azure OpenAI", () => {
  it("uses the configured deployment", () => {
    const model = describeModel(resolveModel(AZURE));

    expect(model.provider).toContain("azure");
    expect(model.modelId).toBe("gpt-4o-mini");
  });

  it("calls the v1 Responses endpoint with the key header and deployment", async () => {
    let request: { url: string; headers: Headers; body: { model: string } } | undefined;
    const fetch = async (url: string | URL | Request, init?: RequestInit) => {
      request = {
        url: String(url),
        headers: new Headers(init?.headers),
        body: JSON.parse(String(init?.body)),
      };
      return jsonResponse(responsesReply("pong"));
    };

    const result = await generateText({
      model: resolveModel(AZURE, { fetch }),
      prompt: "ping",
    });

    expect(result.text).toBe("pong");
    expect(request?.url).toBe("https://navio-chatbot.openai.azure.com/openai/v1/responses");
    expect(request?.headers.get("api-key")).toBe(AZURE.AZURE_AI_CHATBOT_API_KEY);
    expect(request?.body.model).toBe("gpt-4o-mini");
  });

  it("surfaces an authentication failure without leaking the key", async () => {
    const fetch = async () =>
      jsonResponse({ error: { code: "401", message: "Access denied due to invalid key." } }, 401);

    const error = await generateText({
      model: resolveModel(AZURE, { fetch }),
      prompt: "ping",
      maxRetries: 0,
    }).catch((e: unknown) => e);

    expect(APICallError.isInstance(error)).toBe(true);
    expect((error as APICallError).statusCode).toBe(401);
    expect(String((error as Error).message)).not.toContain(AZURE.AZURE_AI_CHATBOT_API_KEY);
  });

  it("surfaces an API error", async () => {
    const fetch = async () =>
      jsonResponse({ error: { code: "server_error", message: "Internal error." } }, 500);

    const error = await generateText({
      model: resolveModel(AZURE, { fetch }),
      prompt: "ping",
      maxRetries: 0,
    }).catch((e: unknown) => e);

    expect(APICallError.isInstance(error)).toBe(true);
    expect((error as APICallError).statusCode).toBe(500);
  });

  it("stops waiting when the request times out", async () => {
    const fetch = (_url: string | URL | Request, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
      });

    await expect(
      generateText({
        model: resolveModel(AZURE, { fetch }),
        prompt: "ping",
        maxRetries: 0,
        abortSignal: AbortSignal.timeout(50),
      }),
    ).rejects.toThrow(/timed out|abort/i);
  });
});
