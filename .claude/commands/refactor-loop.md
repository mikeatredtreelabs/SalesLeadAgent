---
description: Architecture Refactoring Loop (Peter Steinberger) — iterate on architecture with per-step live-test, autoreview, and commit until satisfactory.
argument-hint: [target area / refactor goal]
---

You are running the **Architecture Refactoring Loop** on this project.

Refactor goal from the user: **$ARGUMENTS**

If that goal is empty or vague, STOP and ask the user two things before touching any code:
what area to refactor, and what "satisfactory" means concretely. An open-ended goal
makes this loop run forever.

## Pre-work (once, before the first change)

1. Define the destination explicitly and write it down: module boundaries, dependency
   direction (what may import what), naming/layering conventions, test expectations, and
   any performance thresholds. This is the definition of "satisfactory".
2. Note existing risks (fragile areas, missing tests, tight coupling).
3. Create a progress file — default `refactor-salesleadagent.md` in the OS temp dir
   (move it into the repo instead if you want it to survive a team handoff). Seed it with
   the objectives, constraints, risks, and an empty running log.

## The loop — repeat until the stopping condition

Do these in order every iteration. Do not skip or batch steps.

1. **One significant step.** Make exactly ONE substantial, reviewable change toward the
   target. Keep it small enough to verify and cleanly revert.
2. **Live-test.** Confirm the system still actually works:
   - the dev server on :3000 recompiles with no errors (or run `npm run build`), and
   - `npm run lint` is clean, and
   - exercise the affected page/route/API path.
   A failing build, lint, or feature is a **stop-and-fix**, not a "continue".
3. **Autoreview.** Run the project's review skill on the working diff: `/code-review high`
   (use `max` for large structural changes). Address real findings; re-test if you edit code.
4. **Commit.** Commit the verified step with a message describing the architectural change.
   Branch first if currently on `main`. Then update the progress file: what changed, key
   decisions, obstacles hit, and the next step.
5. **Reassess.** Ask: is the architecture satisfactory (per the pre-work definition) AND do
   all checks pass? If yes → STOP. If no → go back to step 1.

## Stopping condition

Stop when **"the architecture is satisfactory and checks pass."** Then post a short summary:
what changed, what improved, and anything deferred.

## Rules

- One architectural change per verified commit — never batch unverified changes.
- Keep the progress file current so the work survives a context reset or handoff.
- If you find the goal drifting or expanding, pause and re-confirm scope with the user.
