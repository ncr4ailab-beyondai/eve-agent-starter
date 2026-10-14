# AGENTS.md — partner-agent

This is a minimal eve agent with no UI or tools. It receives messages through eve's HTTP channel (`/eve/v1/session`) and replies using the configured model.

## Files

- `agent/instructions.md`: system prompt and agent behavior.
- `agent/agent.ts`: runtime configuration and model wiring.
- `agent/lib/model.ts`: provider settings and validation; provider tests are in `tests/model.test.ts`.
- `.env.local`: local secrets and provider selection; never commit or print values. `.env.example` and `SETTINGS.md` must stay in sync.

Providers are `azure`, `gateway`, and `omniroute`, selected with `MODEL_PROVIDER`. Each provider keeps its own settings. Restart the eve dev server after changing model settings.

## Commands (run in this folder)

- `npm test`: offline unit tests.
- `npm run typecheck` and `npm run lint`: required after code changes.
- `npm run test:live`: real provider calls; requires explicit authorization and configured credentials.
- `npm run dev`: interactive development; `npm run dev -- --no-ui` runs HTTP only, normally on port 2000. Use separate ports when running both agents.
- `npm run build`: full build; needs Docker or `just-bash` locally. `npx eve build --skip-sandbox-prewarm` checks compilation without sandbox prewarming.

TypeScript is pinned to 6.0.x for compatibility with the current eslint tooling. Confirm installed versions before changing dependencies.

## Documentation and workflow

Read `VERCELEVE.md`, `CONTEXT.md`, and relevant official documentation before code changes. Use `context7`; for a future Next.js UI, read `nextjs.md` and use the local skills in `.agents/skills/` and `next-devtools`. Keep Next.js generated instruction blocks intact.

Plan substantial agent changes first. Clarify missing prompt requirements, write a focused failing test for behavior changes, implement, simplify, and rerun unit tests, typecheck, and lint. Claude hooks and subagent commands are not Codex enforcement; perform the documented checks directly.

Follow `GITHUB.md` for delivery and security rules. Commits, pushes, pull requests, credentials, package installs, MCP changes, and deployments require explicit authorization unless the user already authorized the action. Never expose `.env.local` values. `eve deploy` targets production.

References: `README.md`, `SETTINGS.md`, `GITHUB.md`, `VERCELEVE.md`, `CONTEXT.md`, and `nextjs.md`. Where older guides mention `.claude/skills/` or Claude commands, use the Codex equivalents described in this `AGENTS.md`. The user's request to create these Codex instructions takes precedence over the older instruction against creating `AGENTS.md` manually.

## Project policies

## Repository

This repository contains independent Vercel eve agents in `agents/faq-agent/` and `agents/partner-agent/`. Each has its own dependencies, environment settings, and tests. Read this folder's `README.md` before changing it. Run commands from the relevant agent folder. Never create a nested Git repository.

## Documentation and implementation

- Before code changes, check current documentation for the libraries and APIs involved. Prefer the `context7` MCP and match `package.json` / `package-lock.json` versions; use installed documentation when available.
- For eve work, read the agent's `VERCELEVE.md` and current official docs at https://eve.dev/docs. Use eve for new AI agents unless requirements justify another framework.
- For Next.js work, read the agent's `nextjs.md`, check the installed version, and use the relevant skill in `.agents/skills/`. Use `next-devtools` for runtime checks with a running development server. These agents currently have no Next.js UI.
- Do not invent APIs, commands, or configuration. If an MCP or skill is unavailable, use official documentation and report the limitation. Name sources and checks actually used.
- Keep changes small and readable. Add dependencies or abstractions only when they serve a clear need.

## Workflow and validation

Plan substantial agent changes before implementation, including requirements, tools, credentials, and the workflow. Clarify missing prompt requirements before changing system instructions. For behavior changes, write a small failing test, implement the change, simplify it, then rerun the affected agent's unit tests, typecheck, and lint. Run live tests only when explicitly requested because they call real providers.

## Git and security

- Follow the relevant agent's `GITHUB.md`. Never commit, push, open or merge a pull request, or rewrite history without explicit permission for that action. Use the owner's Git identity; do not add AI authorship or attribution.
- Never print, log, or commit credentials or `.env.local` values. Errors identify setting names, never secret values. Use `.env.example` for placeholders.
- Before delivery, review the diff and scan for secrets. Before commit or push, run the documented security scan, checks, and dependency audit; report any unavailable checks honestly. Perform security review directly in Codex rather than claiming Claude's `/security-review` ran.
- Preserve uncommitted work. Do not edit, clean, or delete another worktree. Worktrees need their own ignored environment files and dependencies.
- Ask before package installations or updates, MCP changes, service or credential connections, and deployments unless already authorized by the user. `eve deploy` targets production.

## Codex setup

- MCP servers are configured in `.codex/config.toml`: `context7` and `next-devtools`. Project configuration loads only for trusted projects. Check registrations with `codex mcp list` or `/mcp` and restart the session after configuration changes.
- The six agent-local Next.js skills are in `.agents/skills/`, copied with all references and templates from this agent's `.claude/skills/` folder. Launch Codex from this agent folder to load its configuration and skills. Use only skills applicable to the task.
- Claude's `.claude/settings.json`, hooks, and agent definitions remain available for Claude but are not automatically executed by Codex. The workflow and checks above are instructions, not enforced Codex hooks.
- This `AGENTS.md` is maintained for Codex. If Next.js later adds generated instruction blocks, preserve those blocks and edit only project-owned content outside them.
