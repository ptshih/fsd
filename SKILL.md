---
name: fsd
description: "Deliver a bounded goal using ordinary tools, Herdr tabs and filesystem handoffs, then stop. Use when the owner requests FSD or outcome-oriented coordination. Loading or updating the skill does not authorize work."
license: MIT
compatibility: "Herdr is the only runtime dependency beyond the coding harness and its ordinary file/shell tools. Use Git where the project requires it. No additional extensions, packages, runners or services. Files preserve state but do not wake an idle agent."
metadata:
  version: "1.2.0"
---

# FSD

Deliver the requested outcome, verify it, settle owned work, and stop. FSD is
instructions, not a runtime. **Herdr is the only runtime dependency** beyond the coding
harness and its ordinary tools. Assume Herdr's integration for each coding harness is
installed; build or install nothing to make FSD run. Loading this skill authorizes no work.

**Already assigned as a worker?** Follow the [worker guide](references/worker.md) and
your assignment, then stop. Do not repeat coordinator setup or launch other agents.

## One usage path

1. Establish the outcome and an approved operating envelope.
2. Do small work directly. For authorized delegation, establish an already-available native
   host facility for wakeup once, then open one Herdr tab per worker.
3. Submit each assignment once. Workers publish immutable reports to assigned inboxes,
   or report natively when hardened read-only; native wakeups tell the coordinator to
   inspect them.
4. Verify, integrate deliberately, clean up owned workers, report the outcome, stop.

**Automatic wakeup is required for unattended delegation.** Files preserve state but do
not wake an idle agent. Use only a facility Herdr or the harness already exposes, per
the [wakeup procedure](references/delivery.md). If none is usable, report that gap
before launching workers; never fall back to manual resumption or a workaround.

## Establish the envelope

Read [setup](references/setup.md) and the owner's preferences once per goal. Confirm only
consequential choices that are genuinely missing: outcome, done criteria, scope and
non-goals, supervision, authorized models/tools/actions, required checks or review, and
time, attempt, cost and worker limits. A clear request plus standing preferences can
supply approval; do not re-ask settled choices or invent an allowance.

Approve an envelope, not a roster: choose direct work, staffing, independent review and
repair within it. Supervised is the default; unsupervised means deciding in-scope
questions without asking, not new authority. Limits never reset on replacement or resume; only a `not-started` refusal or an
owner-steering cancellation with no work product goes uncounted.
Then name yourself in Herdr: rename your agent to `fsd-<slug>` and, when your tab is
dedicated to the goal, your tab to `FSD <slug>` ([procedure](references/herdr.md#name-the-coordinator)).

## Prepare proportionally

Use the approved model, effort and tools in the current Herdr session; an unsupported
requirement blocks only the affected work and does not authorize substitution.

Keep small, understood work local: a short progress/evidence note, no workers or
mailbox. There is no mandatory planner/builder/reviewer pipeline; when delegation earns
its cost, pick the smallest [composition](references/compositions.md) that fits. Required independent
review uses a fresh worker that is read-only with respect to the implementation.

For delegation, pin the installed skill into the goal's `runbook/` and set up the private
[filesystem protocol](references/filesystem.md) before dispatch, using the
[record templates](templates/goal.md) as needed. Give each worker one of the five
[role files](agents/reviewer.md) in `agents/` ([how they work](references/setup.md#role-files))
so the packet carries only the task. Read references only for the current step. Retain checked commands, selections
and wakeup proof in goal state, but recheck live identity, UI, authority and remaining
allowance before every input ([details](references/setup.md#prepare-once-then-recheck-live-state)).

Launch each new worker in its own Herdr tab, never a split pane, preserving the user's
focus ([procedure](references/herdr.md#worker-tabs)). One implementation writer per
working directory, including the coordinator; concurrent writers get worktrees.

If the goal changes FSD itself, follow the [pinned-runbook procedure](references/setup.md#improving-fsd-itself);
the proposed skill is a deliverable, not authority for the running goal.

## Deliver

Direct work: do it, run the checks, finish. Delegation (a complete trace:
[example](references/example.md)):

1. **Prepare the packet.** Establish the wakeup facility first, once per goal. Record
   the assignment, attempt and role file. Give the worker the absolute
   [worker guide](references/worker.md) path, a minimal read list and a resolved report
   contract, not the coordinator's transcript.
2. **Submit once.** Persist `prepared`, verify readiness through actual UI inspection
   and an empty prompt—not an `idle` label alone—persist `dispatch-started`, then follow
   [Herdr dispatch](references/herdr.md#dispatch) for a bounded startup receipt written
   to the attempt record by the submitting command itself, then
   arm the worker's settled-state wait. Uncertain delivery means reconcile, not resend.
3. **Work or yield.** Do independent work. At turn boundaries and on wakeups, inspect
   inboxes, worker panes and unresolved work. If only running workers remain, record `waiting` with
   the pending attempts, wait/watch handles and next action, then yield. Never wait, sleep,
   poll or type into the editor to manufacture a wakeup.
4. **Inspect and repair.** Match reports to goal, attempt and actual worker. Acknowledge
   receipt separately from acceptance; accept only on inspected artifacts and checks
   actually run. Repair within the envelope; stop or ask when attempts are exhausted or
   failures show no progress. A dispatch the provider refused before any work is
   `not-started`, not an attempt ([details](references/herdr.md#inspect-results-and-prompts)).
5. **Integrate deliberately.** One destination writer. Verify worker quiescence,
   integrate per project policy, and rerun affected checks on the combined tree.
   Worker-branch success does not prove the integrated result. If the owner waives
   required review, record the waiver and meet the
   [self-review floor](references/compositions.md#waived-review) first.
6. **Finish.** Stop on verified delivery, cancellation, an agreed limit, or when no
   authorized work can progress. Settle owned operations, cancel goal-owned watches, and
   run [Herdr cleanup](references/herdr.md#cleanup). Report **delivered**, **blocked**,
   **limit reached** or **cancelled** with concise evidence and remaining uncertainty.
   `waiting` is a handoff, not success or proof that workers stopped.

## Steer and resume

The owner's conversation is authoritative: on material steering, preserve the prior
directive and publish a new revision. An attempt the owner cancels before it produced any
work product is recorded, not counted; a revision that changes a role's selection states
the allowance for the new selection. Pause stops new dispatch while in-flight work is
reconciled; cancellation uses supported Herdr controls and verifies settlement, since a
file cannot stop a running tool. On any wakeup or resume, reconcile records against
actual workers, files, watches and remaining limits before acting; never blindly repeat
non-idempotent work. Report at meaningful milestones; keep diagnostics in evidence.

FSD provides no hard spending limits, guaranteed interruption, exactly-once effects,
automatic deadline enforcement or crash-proof continuation. Claim only what was verified.
