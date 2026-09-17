# Changelog

## 1.3.0 — 2026-09-17

- Attempt dispositions: `not-started` for a delivered prompt the provider refused before
  any model work (usage cap, credentials, outage). It, `not-sent`, and an owner
  `cancelled` attempt with no work product are uncounted; the rule lives in
  filesystem.md's dispatch section. A refused selection is not resubmitted without owner
  steering, and a refusal after work began is `incomplete` and counts. Preferences'
  `fallback.when` names `harness-unavailable`, `model-limit` or `auth-failure`; a fallback
  fires only after the attempt is recorded and disclosed (observed 2026-09-17: a hardened
  Claude reviewer settled in seconds on "You've reached your Fable limit").
- Dispatch: the submitting `agent prompt` command writes its own receipt to
  `evidence/<attempt>.receipt.json` (stdout) and `.receipt.err` (stderr, exit status)
  under `set -C`, propagating Herdr's exit status, so a tool result lost to an interrupt
  is reconciled from the files and an existing receipt is never overwritten; empty
  receipts mean `uncertain`. The block is tagged and run by `npm test` against a stub.
- Packets written ahead of dispatch keep the template's `REPLACE` placeholders for
  binding fields, resolve them in one pass and assert none remain before input; the
  pre-input check also confirms `revision` and `deadline` still match `goal.md`.
- The assignment template names the eight report header keys (a worker will not open a
  second template to learn them) with identity values kept in the front matter only and
  `event_id`, `kind`, `created_at` and `worker_session` set by the worker; role files
  defer to the packet instead of re-listing keys; setup notes that a harness without a
  system-prompt flag takes the role through the packet's read list, never a first prompt.
- Trust dialogs: read the default and the read-back before answering; Claude Code's has
  started on "No, exit", Antigravity's on "Yes".
- Delivery: a bounded, `sh`/`zsh`-portable inbox poll the host's facility can run as a
  supplement where it has no filesystem watcher; it exits on the first new report or at
  its deadline, like `agent wait`, and fails loudly on bad input; run by `npm test`. The
  Antigravity observation (a blocked-only wait never fired, the inbox observation
  delivered) does not demote the settled-state wait, which stays primary everywhere.
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
