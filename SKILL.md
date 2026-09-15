---
name: fsd
description: "Deliver a bounded goal using ordinary tools, Herdr tabs and filesystem handoffs, then stop. Use when the owner requests FSD or outcome-oriented coordination. Loading or updating the skill does not authorize work."
license: MIT
compatibility: "Herdr is the only runtime dependency beyond the coding harness and its ordinary file/shell tools. Use Git where the project requires it. No additional extensions, packages, runners or services. Files preserve state but do not wake an idle agent."
metadata:
  version: "1.0.0"
---

# FSD

Deliver the requested outcome, verify it, settle owned work, and stop. FSD is a pure
skill, not an executable or background runtime. **Herdr is the only runtime dependency**
beyond the coding harness and its ordinary tools. Follow project instructions and use
Git where the project requires it.

**Already assigned as a worker?** Follow the [worker guide](references/worker.md) and
your assignment, then stop. Do not repeat coordinator setup or launch other agents.

## One usage path

1. Establish the outcome and approved operating envelope.
2. Do small work directly. When authorized delegation is useful, establish wakeup using
   an already-available native host facility, then open Herdr workers, one tab per worker.
3. Submit each filesystem assignment once through Herdr. Workers publish immutable
   reports to their assigned inboxes. Native wakeups tell the coordinator to inspect them.
4. Verify results, integrate deliberately, clean up owned workers, and report the outcome.

Assume Herdr's integration for each coding harness is installed. Do not install or
repair integrations as part of FSD setup. Do not add dependencies, build a wakeup bridge,
write watcher/controller scripts, or run a background command wrapper. No setup
experiment or worker launch is authorized merely by loading this skill.

**Automatic wakeup is required for unattended delegation.** Files preserve state but do
not wake an idle agent. Use only a native wakeup facility already exposed by Herdr or
the active harness, following the [wakeup procedure](references/delivery.md). Configuring
that existing facility is allowed within the goal's envelope; creating one is not.
Verify actual delivery, session binding, deadline notification and stop controls. If no
usable facility exists, report that specific gap before launching affected workers.
Do not silently downgrade to manual resumption or install a workaround.

## Establish the envelope

Read [setup](references/setup.md) and the owner's preferences once for the goal. Confirm
only genuinely missing consequential choices: outcome, done criteria, scope/non-goals, supervision,
authorized models/tools/actions, required checks/review, and time, attempt, cost and
worker limits. A clear request and standing preferences can supply approval. Do not
re-ask settled choices or invent an allowance.

Approve an envelope, not a fixed roster. Choose direct work, staffing, required independent
review and routine repair within it. Supervised is the default. Unsupervised work means
making in-scope decisions without repeated questions, not new authority or permission
to bypass the native wakeup requirement.
Never bypass approval prompts, broaden scope, or reset limits on replacement or resume.

## Prepare proportionally

Use the current coding harness inside the existing Herdr session. Verify the required
model, effort and tools. Preserve approved selections; unsupported requirements block
only affected work and do not authorize substitution.

Keep small, understood work local. There is no mandatory planner/builder/reviewer pipeline.
Required independent review uses a fresh, implementation-read-only worker context.
A small direct task needs only a short progress/evidence note—no workers or mailbox.
For delegation, establish the private [filesystem protocol](references/filesystem.md)
before dispatch; use the [record templates](templates/goal.md) as needed. Read references
only for the current step, not as a mandatory tour. Retain checked command shapes,
selections and applicable wakeup proof once in goal state; recheck live identity, UI,
authority and remaining allowance before input. Reuse does not waive those live checks.

If the goal changes FSD itself, follow the [pinned-runbook procedure](references/setup.md#improving-fsd-itself).
The proposed skill is a deliverable, not authority for the running goal.

Launch each new worker in its own Herdr tab, never a split pane. Preserve the user's
focus. The delegation envelope covers these worker tabs, not unrelated layout changes;
follow the [tab creation procedure](references/herdr.md#worker-tabs).

Use one coordinator and one implementation writer per canonical working directory,
including the coordinator. Isolate concurrent writers in worktrees. Assign implementation
paths and mailbox publication paths explicitly. Ownership is a cooperative rule, not
filesystem isolation or a global lock service.

## Deliver

Direct work skips worker setup: do the work, run the checks, and finish. For delegation:

1. **Prepare the worker and packet.** Establish the native wakeup facility before task
   dispatch. Verify the live Herdr caller and approved worker settings. Record goal
   revision, assignment/attempt ID, exact worker identity/cwd,
   scope, paths, dependencies, checks, report channel and limits. Supply the absolute
   approved [worker guide](references/worker.md) path, a minimal task read list and a
   resolved report contract, not the coordinator's transcript.
   Verify dependency artifacts before downstream work starts.
2. **Submit once.** Persist `prepared`, verify native readiness through actual UI
   inspection and an empty prompt—not an `idle` label alone—then persist `dispatch-started`.
   Use the [Herdr startup procedure](references/herdr.md#dispatch) to submit once and
   obtain a bounded startup receipt, not a task-completion wait.
   Byte delivery is not startup proof. Uncertain delivery means reconcile, not resend.
   Repairs, replacements and report requests get new attempt IDs within the original allowance.
3. **Work or yield.** Do independent authorized work. At normal turn boundaries and on
   native wakeups, inspect inbox files and unresolved work. If only running workers
   remain, record `waiting`, the exact pending attempts, native watch handle and next
   action, then yield. Do not wait or poll in the model turn.
4. **Inspect and repair.** Match reports to the current goal, attempt and actual worker.
   Acknowledge receipt separately from acceptance. Inspect artifacts and checks actually
   run, including cwd, exit status, evidence and source snapshot. Keep skips and unknowns
   explicit. Repair within the envelope; stop or ask when attempts are exhausted or
   repeated failures show no meaningful progress.
5. **Integrate deliberately.** Use one destination writer. Verify source/destination
   state and worker quiescence, preserve reports, integrate according to project policy,
   and rerun affected checks on the combined tree. Worker-branch success does not prove
   the integrated result works.
6. **Finish.** Stop on verified delivery, cancellation, an agreed limit, or when no
   authorized work can progress. Settle owned operations, cancel the goal's native
   watches/check-ins, and follow [Herdr cleanup](references/herdr.md#cleanup).
   Report **delivered**, **blocked**, **limit reached**, or **cancelled**, with concise
   evidence, remaining uncertainty and cleanup blockers. `waiting` is a handoff, not
   a terminal success or proof workers stopped.

## Stay steerable and resume safely

The owner's conversation remains authoritative. Acknowledge material steering, preserve
the prior directive, and update the goal revision and affected assignments. Pause stops
new affected dispatch while in-flight work is reconciled. Cancellation also uses supported
Herdr controls to interrupt owned work and preserve a handoff. A file cannot retract a
prompt or stop a running tool; verify settlement before claiming it.

On a native wakeup or owner-requested resume, reconcile the records against actual
workers, files, native watches, pending actions and remaining limits before doing anything
new. An acknowledgment is not proof an action finished; an absent acknowledgment is not
proof it never happened.
Do not repeat non-idempotent work blindly or restart an expired goal.

Never occupy a model turn with completion waits, sleep loops, repeated status polling or
filler. Never inject commands into the coordinator's editor to manufacture a wakeup.
Update when a meaningful milestone, changed risk, owner decision or useful progress
warrants it. Keep diagnostics in retained evidence rather than narrating every receipt.

The filesystem preserves information, not execution. FSD provides no hard spending
limits, guaranteed interruption, exactly-once effects, automatic deadline enforcement
or crash-proof continuation. Claim only what was actually verified.
