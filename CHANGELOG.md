# Changelog

## Unreleased

- Attempt dispositions: `not-started` for a dispatch the provider refused before any
  model work (usage cap, credentials, outage) and an owner-steering cancellation with no
  work product; neither consumes the role's allowance. Preferences' `fallback.when`
  names `harness-unavailable`, `model-limit` or `auth-failure`; a fallback fires only
  after the refused attempt is recorded and disclosed (observed 2026-09-17: a hardened
  Claude reviewer settled in seconds on "You've reached your Fable limit").
- Dispatch: the submitting `agent prompt` command writes its own receipt into the attempt
  record, so a tool result lost to an interrupt is reconciled from the file, not guessed.
- Packets written ahead of dispatch mark late-bound fields `SET_AT_DISPATCH` and resolve
  them in one pass, asserting none remain before input.
- Role files name the full report header (`event_id` and `kind` were missing), the
  assignment template spells the header out with values, and setup notes that a harness
  without a system-prompt flag takes the role as its first prompt or read-list entry.
- Trust dialogs: Claude Code's defaults to "No, exit", Antigravity's to "Yes"; read the
  default before answering.
- Delivery: a portable one-second inbox poll for hosts without a filesystem watcher, and
  the observation that the inbox watch, not the settled-state wait, delivered an
  Antigravity worker's report.
- Compositions: a "Waived review" floor for when the owner waives independent review.
- README: demo animation under `assets/` illustrating the review loop, badges, and a
  repository description and topics on GitHub. `check.mjs` admits `.gif`/`.png` only
  under `assets/`; the package `files` list is unchanged.
- Evidence capture rule: one footer line before dispatch; a native report from identity
  header to verdict; nothing wider unless diagnosing a defect.
- Cleanup: exit Claude Code workers with both ctrl+c presses in one `agent send-keys`
  call; a second press sent as a separate command arrives after the confirmation
  window and does not exit (observed 2026-09-16).

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
