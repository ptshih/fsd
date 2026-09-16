# Changelog

## Unreleased

- README: demo animation under `assets/` illustrating the review loop, badges, and a
  repository description and topics on GitHub. `check.mjs` admits `.gif`/`.png` only
  under `assets/`; the package `files` list is unchanged.
- Evidence capture rule: one footer line before dispatch; a native report from identity
  header to verdict; nothing wider unless diagnosing a defect.

## 1.2.0 — 2026-09-16

- Goal records default to `$XDG_STATE_HOME/fsd/goals/<project-slug>/<goal-id>/`, outside
  every repository; never under a project's `.agents/`, which other tools scan.
- Every delegated goal pins the installed skill into `<goal>/runbook/` and reads from that
  copy, so updating the installed skill cannot change a running goal.
- SKILL.md links role files directly (one hop, per the Agent Skills guidance).

## 1.1.0 — 2026-09-16

- SKILL.md condensed to the positive procedure; caveats live in the references.
- Role files under `agents/`: scout, builder, workhorse, reviewer, judge — per-harness
  launch arguments, hardened read-only variants, fixed report shapes. Model routing stays
  in owner preferences.
- Herdr's settled-state `agent wait`, run through the host's background facility, is the
  primary wake; the inbox watch is the fallback.
- Worker escalation: publish a `question`, go idle, receive the reply as a new attempt.
- Launch recipe pinned; hardened Claude workers start with the shell alias bypassed
  (`herdr pane run … "command claude …"`); Codex writers get `--add-dir` for the inbox.
- Coordinator names its agent and dedicated tab at goal start and restores them at close.
- Compositions (parallel review, review loop, scout/build/review, judge, mechanical batch)
  and a worked example from a live goal.
- Lessons from live smoke goals across Claude Code, Pi and Codex folded into the
  references and pinned by tests.

## 1.0.0 — 2026-09-15

- First release as a pure skill: Herdr tabs, filesystem handoffs, native wakeup.
