# Changelog

## 1.7.0 — 2026-09-18

- Simplification pass over the 1.5.0–1.6.0 material, no rule or fact changed. The Pi
  coordinator page is now `references/pi.md`, shaped like `codex.md` (prerequisite,
  check the tools, dispatch and observe, dated record with its "for that run" scope),
  so coordinators on other harnesses no longer read Pi's tool parameters every goal;
  setup.md keeps one Baseline sentence. delivery.md states the auto-exit rule generically
  ("disable any output-inactivity auto-exit the facility offers"), lists facilities as
  pointers, adds "a verification recorded in these references" to what availability may
  not be inferred from, and drops the Pi-specific "unavailable" example for a
  harness-neutral one. What counts as a worker selection is defined once under role
  files; the assignment template asks for the selection's source and binds
  `worker_kind` through its placeholder and the launch legend's `HARNESS`. herdr.md
  links to the qualified-harness list instead of copying it. Tests pin one short phrase
  per rule at its canonical file.

## 1.6.0 — 2026-09-17

- Pi worker waits are qualified: in goal `sh-compat-01` (2026-09-17, Herdr 0.9.1, Pi
  0.85.1) a builder's settled-state wait returned with its report already in the inbox
  and a status read three seconds later showed `done`, so `pi` leaves the
  pair-with-inbox list; `agy` (unreliable) and `codex` (unverified) remain on it. The
  same goal — the first Pi coordinator on 1.5.0 — armed the wait and the inbox watch as
  documented (background dispatch with quiet auto-exit off and the tool timeout above the
  wait's, a file-watch monitor, no blocking shell waits) but skipped the wait-output
  redirect, dismissed sessions with a literal `"true"`, never read the owner's
  preferences file, and ran no per-session facility probe. SKILL.md and setup.md now
  name the preferences path and bind each worker selection to its `roles.<name>` entry
  or the owner's direction, with the packet's `worker_kind` required to match;
  delivery.md states that a verification recorded in the references is contract
  evidence, not the session's proof. Observation dates are local, with goal ids.

## 1.5.0 — 2026-09-17

- Pi coordinators require the `pi-interactive-shell` extension, installed once by the
  owner and verified (never installed) by the coordinator. Pi's built-in shell tool
  returns only when its command exits, so without it a coordinator can wait only by
  holding the turn (observed 2026-09-14: 24 blocking waits of 60–300 s in one goal); with
  it, a background dispatch completes as a new turn and file watches cover the inboxes
  (verified 2026-09-15 with pi-interactive-shell 0.15.2, including delivery after the
  turn ended, an immediate exit, and a notified watch timeout). setup.md names the
  per-call settings that keep a silent wait alive, the handle and stop parameters, the
  deferred loader, the evidence redirect and the post-install reload; delivery.md states
  that an exit-only shell tool is not a facility and dates Codex's lack of a verified one;
  a missing tool is an unavailable facility while direct work continues. README and
  SKILL.md state the prerequisite; tests pin it and keep the extension's name out of
  every document except setup, SKILL.md and the README.

## 1.4.0 — 2026-09-17

- Codex coordinators now default to bounded active-turn waits through existing terminal
  tools. No separate mode approval or extra service is needed. The guide retains exact
  terminal handles, distinguishes them from code-mode cells, reconciles reports on
  timeout and settles owned observations before cleanup. Other coordinators retain
  native wakeup, and an explicit idle-resumption requirement still needs a verified
  facility. Harness-specific owner preferences override generic coordination defaults.
- Live Codex verification covered one native-reporting worker, timeout collection,
  cancellation, report capture and cleanup. The observation timed out before the worker
  finished and the final native status was `done`; it does not qualify the worker's
  settled-state wait or automatic idle resumption.
- Delivery: the settled-state wait is primary only on harnesses where it is qualified
  (Claude Code so far), superseding 1.3.0's "stays primary everywhere". A full `agy` wait
  returned a transient `done` between tool calls while the worker was still running
  (observed 2026-09-17, Herdr 0.9.1, Antigravity CLI 1.2.5), so it is unreliable; `codex`
  and `pi` waits are unverified. On those harnesses pair the wait with inbox observation
  (primary when the worker reports to an inbox) or visible-output inspection on each wake;
  the dispatch recipe in herdr.md points at the rule, and tests pin it.

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
