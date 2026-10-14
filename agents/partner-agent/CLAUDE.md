# CLAUDE.md — partner-agent

Minimal eve agent with no UI and no tools. It receives a message over eve's HTTP channel (`/eve/v1/session`) and returns a reply from the configured model.

## Where to change what

| To change | Edit |
|---|---|
| What the agent says and how it behaves | `agent/instructions.md` |
| Agent runtime config (tools, model wiring) | `agent/agent.ts` |
| Model providers and their settings | `agent/lib/model.ts` (+ tests in `tests/model.test.ts`) |
| Which provider and model to use | `.env.local` (never committed; template: `.env.example`) |
| User-facing settings help | `SETTINGS.md` (keep in sync with `.env.example`) |

**Providers** (`MODEL_PROVIDER` in `.env.local`): `azure` (Azure OpenAI v1, Responses API, `AZURE_AI_CHATBOT_*` settings), `gateway` (Vercel AI Gateway, `GATEWAY_MODEL_ID` like `openai/gpt-4o-mini`), `omniroute` (local OmniRoute, `OMNIROUTE_MODEL_ID` like `auto/best-free`). Each provider keeps its own settings, so switching changes only `MODEL_PROVIDER`. eve resolves the model when it compiles `agent/agent.ts`, so restart `npm run dev` after changing settings.

## Development workflow (subagents in `.claude/agents/`)

For code changes, the main conversation coordinates these steps and uses only the agents a task needs:

0. `planner`: when an agent is designed or substantially changed, plan first (requirements, eve docs, tools, credentials, workflow diagram). Best started with `claude --agent planner` so it can ask questions directly.
1. `prompt-engineer`: only when a system prompt must be written. It returns questions when requirements are missing; ask the user, then call it again with the answers.
2. `testing`: write the smallest failing test (RED).
3. `coding`: make it pass with the simplest code (GREEN). A hook blocks its code edits until it has checked documentation.
4. `refactoring`: simplify without changing behavior.
5. `testing`: rerun the checks.
6. `github`: security review and delivery, only with the user's permission.

Hooks in `.claude/settings.json` (scripts in `.claude/hooks/`) enforce the docs check, block finishing while tests, typecheck, or lint fail, and scan for secrets before `git commit`, `git push`, and `gh pr create`. Commits, pushes, and pull requests also require approval.

## Commands (run in this folder)

- `npm test`: offline unit tests.
- `npm run test:live`: real calls to every provider with credentials in `.env.local`.
- `npm run typecheck`, `npm run lint`.
- `npm run dev`: interactive terminal; `npm run dev -- --no-ui` for HTTP only (port 2000).
- `npm run build`: full build. Locally it needs Docker or `just-bash` for the sandbox; `npx eve build --skip-sandbox-prewarm` checks compilation without it.

TypeScript is pinned to 6.0.x because `typescript-eslint` 8 supports TypeScript `<6.1.0`.

## Before any code change (mandatory)

1. **Context7 MCP:** look up current docs for every library, framework, or API the change touches.
2. **Installed versions:** match `package.json` / `package-lock.json`. Prefer docs in `node_modules` (for eve: `node_modules/eve/docs/`).
3. **Official docs:** eve (https://eve.dev/docs), Vercel (https://vercel.com/docs/getting-started-with-vercel), and the provider's docs. Use the Vercel plugin skills (`vercel:*`) where relevant.
4. **Next.js skills and MCP:** use the skills in `.claude/skills/` and the `next-devtools` MCP server when the change involves Next.js.
5. Name the sources used in the reply. If Context7, an MCP server, or a skill is unavailable, say so, use the official docs instead, and never claim a check that did not run.

Skip lookups only for non-code questions that are well understood. Never invent APIs, commands, or configuration options.

## Rules

- **Simple first:** small, readable changes; no new files, abstractions, or dependencies without a clear need.
- **Tests:** Red → Green → Refactor for behavior changes. Keep tests small; run `npm test`, typecheck, and lint before finishing.
- **Secrets:** never print, log, or commit keys or `.env.local` values. Errors name settings, never their values.
- **Approval required** before installing or updating packages, changing MCP configuration, connecting services or credentials, or deploying. `eve deploy` targets production. Skills may suggest installs (for example `next-dev-loop` suggests a global `agent-browser`); ask first.
- **Git:** follow [GITHUB.md](GITHUB.md). Never commit, push, or open a pull request without explicit permission. No AI co-author or attribution lines. Scan for secrets before every commit. Pull requests use the Before → After format in GITHUB.md.

## References

- [README.md](README.md): what this agent does and how to set it up, run, and test it.
- [SETTINGS.md](SETTINGS.md): plain-language settings guide and error help.
- [GITHUB.md](GITHUB.md): Git, GitHub, security, and worktree rules.
- [VERCELEVE.md](VERCELEVE.md): how this agent uses eve, and eve facts verified for this project.
- [CONTEXT.md](CONTEXT.md): how to use Context7.
- [nextjs.md](nextjs.md): Next.js standards, skills, and MCP (for when a Next.js UI is added).
- `.claude/settings.json` pre-approves the `context7` and `next-devtools` MCP servers from `.mcp.json` once this folder is trusted. Check with `/mcp`.
