# CONTEXT.md — Context7 Documentation Guide

Detailed instructions for looking up current library and API documentation with Context7. `CLAUDE.md` holds the short policy and points here.

## 1. Installation and configuration

The server is defined in this folder's `.mcp.json` (next to `next-devtools`):

```json
"context7": {
  "command": "npx",
  "args": ["-y", "@upstash/context7-mcp"]
}
```

- Source: official Context7 client guide, https://context7.com/docs/resources/all-clients (package `@upstash/context7-mcp`).
- Requires Node.js 18 or newer.
- No API key is stored in this file. Never add one to the repository.
- Optional remote endpoint from the same guide: `https://mcp.context7.com/mcp` with an `Authorization: Bearer <key>` header. Use it only if the key is supplied outside the repository.
- Claude Code asks for approval before it runs a project-scoped server. Approve it when prompted.

## 2. When Claude Code should use Context7

Use Context7 automatically when:

- the task uses a library, framework, SDK, or CLI whose API or configuration is unfamiliar or version-specific;
- a command, flag, or config key must be exact;
- an error relates to library behavior;
- the user asks for current documentation.

Skip Context7 for simple, well-understood tasks: refactoring, renaming, writing plain logic, or general programming concepts. Do not look up the same documentation twice in one session.

## 3. How to retrieve documentation

1. Resolve the library ID with the Context7 resolve tool (`resolve-library-id`, under the Context7 MCP server).
2. Query the documentation with the query tool (`query-docs`) using the resolved ID and a specific question.
3. Note the library version the answer applies to.

Tool names may carry a plugin or server prefix depending on how the server is loaded. Use whichever Context7 tools are currently listed.

## 4. Matching the project's dependency versions

- Read the installed version from the lockfile or manifest (for example `package-lock.json`, `pnpm-lock.yaml`, `pyproject.toml`, or `requirements.txt`) before trusting an API example.
- Prefer documentation for that version. If Context7 returns a different version, say so and check the official changelog.
- If no manifest exists yet, state that the version is unknown and ask before choosing one.

## 5. Avoiding outdated or invented APIs

- Do not invent commands, flags, or configuration keys. If unsure, look them up.
- Do not use deprecated methods. If documentation marks an API as deprecated, use its replacement.
- Verify critical commands and configuration against the official source before writing them into files.
- Prefer the official site or repository when Context7 and training knowledge disagree.

## 6. Fallback when Context7 is unavailable

If Context7 is disconnected or not authorized:

1. Say so in the reply.
2. Use the official documentation: the project's docs site, the package's repository README, or the official CLI help (`--help`).
3. Mark each command or config value as "checked against official docs" or "not verified". Do not present unverified items as checked.

## 7. Troubleshooting and connection checks

1. Run `/mcp` in an interactive Claude Code session. Confirm `context7` is listed and connected. If it asks for approval, approve the project server.
2. Confirm Node.js 18+ is available (`node --version`). The package is fetched by `npx`, so the first start needs network access.
3. Run one test lookup, for example resolve a well-known library such as `react` and query one function. A returned result counts as verified.
4. If the server does not start, check that `.mcp.json` is valid JSON and that the `npx` command runs from a terminal.
5. Report the status as Verified, Needs Setup, Failed, or Not Applicable. Do not claim it works until a lookup returns results in the current session.

## 8. Security

- Never print, log, commit, or paste API keys, tokens, or environment variable values.
- Do not change `.mcp.json` or install packages without the user's approval.
