# partner-agent

A minimal AI agent built with [eve](https://eve.dev). It responds to partner messages briefly and helpfully. It has no user interface and no tools: you send it a message over HTTP (or type in the terminal) and it replies using the configured AI model.

## Features

- Replies through eve's built-in HTTP API (`/eve/v1/session`).
- Three interchangeable AI services, chosen with one setting: Azure OpenAI (`gpt-4o-mini`), Vercel AI Gateway, or OmniRoute.
- Clear error messages for missing or wrong settings. Secrets never appear in errors or logs.

## Requirements

- Node.js 24 or newer.
- Credentials for at least one AI service (see [SETTINGS.md](SETTINGS.md)).

## Setup

```bash
npm install
copy .env.example .env.local     # macOS/Linux: cp .env.example .env.local
```

Open `.env.local`, choose the service with `MODEL_PROVIDER`, and fill in that service's section. [SETTINGS.md](SETTINGS.md) explains every setting with examples. `.env.local` holds secrets: it is ignored by Git and must never be shared or committed.

## Run

```bash
npm run dev                # interactive terminal: type a message, press Enter
npm run dev -- --no-ui     # HTTP only, on http://localhost:2000
```

Send a message over HTTP:

```bash
curl -X POST http://localhost:2000/eve/v1/session -H "Content-Type: application/json" -d "{\"message\":\"What is an FAQ?\"}"
```

The reply streams from `GET /eve/v1/session/<sessionId>/stream`. Restart `npm run dev` after changing `.env.local`.

## Test

```bash
npm test            # offline unit tests
npm run test:live   # real calls to each AI service that has credentials in .env.local
npm run typecheck
npm run lint
```

## Project structure

| Path | Purpose |
|---|---|
| `agent/instructions.md` | What the agent says and how it behaves |
| `agent/agent.ts` | eve configuration (no tools, model wiring) |
| `agent/lib/model.ts` | Picks the AI service and model from the settings |
| `tests/` | Unit tests (`model.test.ts`) and live tests (`live.test.ts`) |
| `.env.example` | Settings template (copy to `.env.local`) |
| `SETTINGS.md` | Plain-language settings guide |
| `CLAUDE.md`, `GITHUB.md` | Rules for Claude Code and for Git/GitHub |

## Development agents (Claude Code)

Open Claude Code **in this folder** (`agents/partner-agent`). It then loads five helper agents from `.claude/agents/` and the safety hooks from `.claude/settings.json`.

| Agent | Model | Use it to |
|---|---|---|
| `planner` | Opus 5.5 | Plan an agent before building it: asks questions, checks current eve docs, picks tools, lists credentials, and draws the workflow (Mermaid, plus one optional Gemini image after your approval). |
| `prompt-engineer` | Haiku 5.5 | Write or redesign the agent's system prompt (`agent/instructions.md`). It asks for missing requirements first. |
| `testing` | Opus 5.5 | Write the smallest failing test (RED) and verify checks afterwards. |
| `coding` | Opus 5.5 | Make the test pass with the simplest code (GREEN). Must look up current docs first. |
| `refactoring` | Sonnet 5.5 | Simplify without changing behavior (REFACTOR). |
| `github` | Sonnet 5.5 | Security review, commit, push, and pull request, only with your permission. |

Ask in plain words, for example "use the testing agent to ...", or type `@` and pick the agent. For planning, start the planner as the main agent so it can ask you questions: `claude --agent planner`. The planner needs `GEMINI_API_KEY` in `.env.local` (see SETTINGS.md); a hook stops it until the key is there. Run `/mcp` once to approve the Context7 server.

**Enforced by hooks** (`.claude/hooks/`):
- The `coding` agent cannot edit code until it has looked up documentation (Context7, official docs, or docs in `node_modules`).
- Work cannot finish while `npm test`, `npm run typecheck`, or `npm run lint` fails for changed code.
- `git commit`, `git push`, and `gh pr create` are scanned for secrets with gitleaks first, and Claude Code asks for your approval.

**Example:** "Make the agent refuse questions that are not about our product."
1. `prompt-engineer` asks about tone, fallback, and examples, then rewrites `agent/instructions.md`.
2. `testing` adds a failing test where the behavior can be checked in code (RED).
3. `coding` reads the eve docs and makes it pass (GREEN).
4. `refactoring` tidies the change; `testing` reruns the checks.
5. `github` scans for secrets and, with your approval, opens a pull request in the Before → After format.

## Other agents

This agent is independent. It shares no code or runtime with the other agents in `agents/`; each has its own settings, dependencies, and tests.
