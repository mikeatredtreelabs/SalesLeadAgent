---
description: Docs Sweep (Peter Steinberger) — audit docs against the current code, fix only real drift, verify, and commit directly.
argument-hint: [optional scope, e.g. "just the README" or "docs since last release"]
---

You are running the **Documentation Sweep Loop** on this project.

Optional scope from the user: **$ARGUMENTS** (if empty, sweep all project docs).

Core intent: **make sure the documentation reflects the current implementation.** Update
stale docs, verify the changes actually work, then commit them directly.

## Steps

1. **Find drift.** Review what has changed in the code recently (`git log --oneline -30`,
   `git diff` of recent work) and scan the codebase for anything the docs describe.
2. **Compare docs against reality.** Go through the project's documentation and check each
   claim against actual code, config, commands, routes, env vars, and runtime behavior.
   Cover at least:
   - `README*`
   - `docs/ARCHITECTURE.md` (and anything under `docs/`)
   - `AGENTS.md` / `CLAUDE.md`
   - `.env.local.example` (does it list every env var the code actually reads?)
   - setup/run instructions and any code samples or command snippets
3. **Fix only what's stale.** Update outdated content. Verify that documented commands,
   URLs, file paths, and code samples are correct — run/spot-check them where feasible.
4. **Verify.** Run `npm run lint` (and a build if docs touch build/config claims) so nothing
   you changed references something broken.
5. **Commit directly.** Commit the documentation updates with a clear message summarizing
   the discrepancies found and corrected. Branch first if currently on `main`. Then stop.

## What NOT to do

- **Do not open a pull request.** Commit the changes directly.
- **Do not stop and wait for review** — apply the fixes yourself.
- **Do not churn accurate docs.** Keep the scope tied to real implementation drift; never
  rewrite correct documentation just to create activity.
- Do not touch application/source code — this loop only updates documentation. If you find a
  code bug, note it in the final summary rather than fixing it here.

## Stopping condition

Stop when **"documentation matches the current implementation."** Then post a short summary:
which files changed, what drift was corrected, and any code issues you noticed but left alone.
