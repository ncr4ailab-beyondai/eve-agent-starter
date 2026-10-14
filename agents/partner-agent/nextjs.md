# nextjs.md — Next.js Development, Agent Skills, and MCP Guide

Central guide for Next.js work in this project. `CLAUDE.md` points here.

## Status

| Item | Status |
|---|---|
| Next.js app | None. This agent has no UI yet; this guide applies once one is added. |
| Target version | Next.js 16.4.0 (official docs, last updated 2026-10-06). Confirm against the installed version before relying on it. |
| `next-devtools` MCP (`.mcp.json`) | Configured. Server verified on 2026-10-13 (connects, 4 tools). Runtime tools need a running `next dev`. |
| `context7` MCP (`.mcp.json`) | Configured. Verified on 2026-10-13 with a real documentation lookup. |
| Skills | Installed in `.claude/skills/` (6 skills, listed below). `docs-diagrams` was skipped. |

## Official sources (check before coding)

1. https://nextjs.org/docs (llms index: https://nextjs.org/docs/llms.txt)
2. https://nextjs.org/docs/app/guides/ai-agents
3. https://nextjs.org/docs/app/guides/mcp
4. https://github.com/vercel/next.js/tree/canary/skills
5. https://github.com/vercel/next-devtools-mcp

Once Next.js is installed, the version-matched docs are at `node_modules/next/dist/docs/`. Prefer them over web pages.

## Agent skills

Official skills from `vercel/next.js`. All but `docs-diagrams` are installed in `.claude/skills/` (2026-10-13):

| Skill | What it does | When Claude Code should use it |
|---|---|---|
| `next-dev-loop` | Verifies runtime behavior after edits, using `/_next/mcp` and the browser. Needs a running `next dev`. | After editing app code, to confirm the change works at runtime. |
| `next-bundle-optimizer` | Finds oversized client bundles with Turbopack's analyzer. | When the user asks about slow initial load or bundle size. |
| `next-cache-components-adoption` | Enables Cache Components and fixes blocking routes. | Only when the user asks to adopt or migrate to Cache Components. Requires Next.js 16.3+ conventions. |
| `next-cache-components-optimizer` | Grows the static shell and adds `instant()` tests. | After Cache Components is adopted, for first-paint or navigation work. |
| `next-partial-prefetching-adoption` | Enables Partial Prefetching. | Only when the user asks to adopt it. Requires Cache Components. |
| `next-partial-prefetching-optimizer` | Tunes what navigations prefetch. | After Partial Prefetching is adopted. Requires Next.js 16.3+. |
| `docs-diagrams` | Draws diagrams for the Next.js docs site. | Not applicable to this project. |

Rules:
- Install or update skills only with the user's approval (`npx skills add vercel/next.js --list` shows what exists).
- Most skills need an existing Next.js app; start with `next-dev-loop` once one exists.

## MCP servers

- **Context7** (`.mcp.json`, key `context7`): current library documentation. See [CONTEXT.md](CONTEXT.md).
- **Next.js DevTools** (`.mcp.json`, key `next-devtools`): runs `npx -y next-devtools-mcp@latest`. It discovers a running `next dev` server and exposes runtime tools through `nextjs_index` and `nextjs_call`, including `get_errors`, `get_logs`, `get_routes`, `get_compilation_issues` and `compile_route`. It also points the agent at the bundled docs and the `agent-browser` CLI.
- Do not remove or overwrite other MCP servers when editing `.mcp.json`.
- After any change to `.mcp.json`, restart Claude Code and approve the project servers when prompted.

## Development standards (Next.js 16.4.0 docs)

**TypeScript and strictness**
- Use TypeScript (`.ts` / `.tsx`) and keep strict typing on.
- Type route props as async: `params` and `searchParams` are `Promise` values, so use `await params`.

**App Router architecture**
- Put routes in `app/`. A folder becomes a URL segment only when it contains `page` or `route`.
- Known file conventions: `layout`, `page`, `loading`, `error`, `not-found`, `global-error`, `route`, `template`, `default`.
- Use route groups `(name)` to organize without changing URLs. Use `_folder` for private folders. Colocate helpers safely inside `app/`.
- Dynamic segments use `[slug]`, `[...slug]` and `[[...slug]]`.

**Server Components by default**
- Pages and layouts are Server Components unless marked otherwise. Fetch data on the server.
- Use `'use client'` only for state, event handlers, lifecycle hooks, browser APIs, or custom hooks that need them.
- Put `'use client'` on the smallest interactive component, not on large layouts.
- Pass only serializable props from Server to Client Components.
- Keep secrets in Server Components or Server Actions. Mark server-only modules with the `server-only` package.
- Only `NEXT_PUBLIC_` variables reach the browser. Do not use `process.env` secrets in Client Components.

**Server Actions and Route Handlers**
- Server Functions are reachable with direct POST requests. Check authentication and authorization inside every Server Action, not only in the UI.
- Put `'use server'` at the top of an async function, or at the top of a file that exports only actions.
- Use Server Actions for form submissions and mutations (`<form action={...}>`).
- Use `route.ts` Route Handlers for HTTP endpoints (webhooks, external clients).
- Revalidate after mutations with `revalidatePath` or `revalidateTag` from `next/cache`. Use `refresh()` to refresh the client router. Use `redirect` from `next/navigation` after a mutation. Call `revalidate` before `redirect`, because `redirect` stops execution.
- Model expected errors as return values with `useActionState`. Do not throw for expected validation errors.

**Data fetching and caching**
- Cache Components is the current model. New apps from `create-next-app` have `cacheComponents` and `partialPrefetching` enabled. To enable it manually, set both flags in `next.config.ts`. Set `partialPrefetching` explicitly to avoid a warning.
- Cache data with `'use cache'` plus `cacheLife(...)`. Tag with `cacheTag(...)` and revalidate with `updateTag` or `revalidateTag`.
- Wrap uncached, request-time data in `<Suspense>`. Components that use `cookies()`, `headers()` or `searchParams` also need `<Suspense>`.
- Do not use the older caching model (`caching-without-cache-components` guide) in new code unless the user asks.

**Error handling and loading states**
- Add `loading.tsx` for skeletons (a Suspense boundary) and `error.tsx` for route-level errors. `error.tsx` must be a Client Component (`'use client'`).
- `not-found.tsx` shows the 404 UI. Call `notFound()` from `next/navigation`.
- `global-error.tsx` must define its own `<html>` and `<body>`.
- Error boundaries do not catch errors in event handlers. Handle those with `try`/`catch` and state.

**Performance**
- Keep the static shell large: push async reads below `<Suspense>` boundaries.
- Use `next/image` for images and `next/font` for fonts (check the current docs before use).
- Use the `next-bundle-optimizer` skill for bundle audits, once installed.

**Accessibility**
- Use semantic HTML, labeled form fields, and `aria-live` for dynamic error messages.

**Security**
- Validate and authorize all input in Server Actions and Route Handlers.
- Keep `.env*` files out of Git (`.gitignore` already covers secrets; verify before committing).

## Project folder conventions

Use `src/` only if the project decides to. Keep routes in `app/` and shared code in folders such as `components/` and `lib/`. Keep config files (`next.config.ts`, `tsconfig.json`, `package.json`) at the project root. Keep `public/` for static files.

## Files Next.js generates

- `AGENTS.md`: `next dev` writes managed blocks between `<!-- BEGIN:nextjs-agent-rules -->` and `<!-- END:nextjs-agent-rules -->` markers. Do not remove or hand-edit those blocks. Keep any other content in that file.
- `next-env.d.ts`: do not commit it.
- Do not create `AGENTS.md` by hand. Let `create-next-app` or `next dev` generate it.

## Workflow for Next.js tasks

1. Read this file and check the installed Next.js version (`node_modules/next/package.json`) once it exists.
2. Check the matching official docs (`node_modules/next/dist/docs/`, or the official pages above) for any unfamiliar API.
3. Use Context7 for third-party libraries.
4. Use the relevant installed skill, if any.
5. Implement the change.
6. Verify at runtime with `next dev` and the `next-devtools` MCP tools (`get_errors`, `get_routes`). Do not claim a check passed unless it ran in this session.
7. Report each result as Verified, Needs Setup, Failed, or Not Applicable.
