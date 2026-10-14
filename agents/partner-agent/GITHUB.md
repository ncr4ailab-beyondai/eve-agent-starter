# GITHUB.md — Git and GitHub Rules

These rules apply to every agent in this monorepo and to every Git worktree. There is one repository; never create a nested Git repository.

## Permission

- **AI agents never commit, push, or open pull requests without the owner's explicit permission for that action.** Prepare the change, run the checks below, show what would be committed, and ask.
- Never rewrite history (rebase, amend, force-push) without explicit approval.

## Authorship and attribution

- Commits use the owner's own Git identity only. Check with `git config user.name` and `git config user.email`.
- No AI tools as authors or co-authors: no `Co-Authored-By: Claude`, no "Generated with Claude Code", no AI signatures in commit messages or pull requests. Claude Code's attribution is turned off in `.claude/settings.json` (`"attribution": { "commit": "", "pr": "" }`).
- Never invent contributor identities.

## Commits

- One feature branch per change, created from `main`.
- Small, focused commits. Do not include other agents' folders or unrelated files.
- Messages: short, imperative, technical (for example `Add Azure OpenAI provider to faq-agent`).

## Before every commit or push (security)

1. `git status` and `git diff --staged`: only intended files, no `.env.local`, no build output.
2. Secret scan: `gitleaks protect --staged --redact` (staged files) or `gitleaks detect --redact` (history).
3. Run `/security-review` in Claude Code for code changes.
4. In each changed agent: `npm test`, `npm run typecheck`, `npm run lint`, and `npm audit`.
5. If a secret was exposed (committed, pushed, or pasted anywhere), stop, report it, and rotate the key. Deleting the file does not remove it from history.

## Secrets

- Real values live only in each agent's `.env.local`, which Git ignores. Commit only `.env.example` with empty or placeholder values.
- Never print, log, or paste secret values, including in pull requests and reports.

## Git worktrees

- Tracked files (code, `CLAUDE.md`, `GITHUB.md`, `.claude/settings.json`, `.claude/skills/`, `.gitignore`) are shared through Git and reach other worktrees after a commit and checkout.
- Untracked files are local to one worktree: `.env.local`, `node_modules/`, build output, and `.claude/settings.local.json`. Each new worktree needs its own `.env.local` and `npm install`.
- Never edit, clean, or delete another worktree, and never discard uncommitted changes in it.

## Pull requests

Every pull request must be understandable in 30 seconds, including by someone without a technical background: what was wrong, what changed, and why it is better.

- **Title:** short and descriptive (for example `Let agents switch between Azure, AI Gateway, and OmniRoute`).
- **Description:** use the template in `.github/pull_request_template.md`, which GitHub fills in automatically. Sections, in this order:
  1. **Summary:** one or two sentences on what the PR does and why it matters.
  2. **Before:** the previous behavior, problem, or limitation, and why a change was needed.
  3. **After:** how it works now and the real benefit.
  4. **What Changed:** short bullets with only the important changes, including any behavior or architecture change.
  5. **Verification:** what was tested or checked, and the result.
  6. **Security Review:** the secret scan, security review, and dependency audit that ran, their results, and any remaining concerns.
  7. **Reviewer Notes:** only when relevant: limitations, setup or migration steps, decisions to confirm.
  8. **Screenshots / Workflow Diagram:** before-and-after images for visible changes, or the approved workflow diagram for agent design changes.
- **Style:** plain English, short sections, no repeated information. Leave out a section's details if they don't matter to the reader.
- **Honesty:** never exaggerate improvements, and never claim a check passed unless it ran in this change.
- No AI attribution. Open, update, or merge a pull request only with the owner's approval.
