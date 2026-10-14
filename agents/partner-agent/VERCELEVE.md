# VERCELEVE.md — How This Agent Uses eve

eve is a filesystem-first framework for durable backend AI agents: instructions, tools, and channels are files that eve compiles and runs. This project uses eve for all new AI agents unless requirements justify something else.

## Check the docs first

eve changes often. Before changing eve code, config, or commands, read the docs bundled with the installed version in `node_modules/eve/docs/` (start with `README.md`), and https://eve.dev/docs for anything newer. Mark anything not checked in the current session as unverified.

## How this agent is set up (verified with eve 0.78.0)

- **Files:** `agent/instructions.md` (required) and `agent/agent.ts` (`defineAgent`). No tools, channels, or memory files.
- **No tools:** `defaultTools: false` removes eve's `bash`, `read_file`, and `write_file`. The agent only replies.
- **HTTP channel:** eve's default `/eve/v1` routes. With no `agent/channels/eve.ts`, the default auth accepts local development and rejects production traffic. Add real auth before any production use.
- **Model:** `agent/lib/model.ts` returns an AI SDK model for Azure and OmniRoute, or a `provider/model` string for AI Gateway (eve routes strings through AI Gateway).
- **Context window:** eve needs `modelContextWindowTokens` for models outside its AI Gateway catalog. Azure and OmniRoute use `MODEL_CONTEXT_WINDOW` (default 128000). Gateway models need none.
- **Compile time:** eve evaluates `agent/agent.ts` while compiling, so provider settings must be present when building, and `npm run dev` must be restarted after settings change. `eve dev` loads `.env.local` automatically. `eve info` does not (checked), so pass settings as environment variables for `eve info` and `eve build`.
- **Dev extensions:** `npm run dev` passes `--no-default-extensions` to turn off eve's self-modification subagent, which this reply-only agent does not need.
- **Build:** a full `eve build` prepares a sandbox and needs Docker or `just-bash` locally. `eve build --skip-sandbox-prewarm` checks compilation.

## Deployment

`eve deploy` deploys to production. Every production deploy needs explicit approval. Credentials for deployments: AI Gateway uses Vercel OIDC or `AI_GATEWAY_API_KEY`; Azure and OmniRoute need their settings as Vercel environment variables.

## Security

- Never print, log, or commit keys or environment values. Names only.
- Keep tools least-privilege; gate sensitive tools with approval if tools are added.
