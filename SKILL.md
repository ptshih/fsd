---
name: fsd
description: "Deliver a bounded goal, directly or with visible Herdr workers, then stop. Use when the owner requests FSD or outcome-oriented coordination. Reading, installing, or updating the skill does not authorize a goal or launch workers."
license: MIT
compatibility: "Uses the current harness's normal tools, a local filesystem, and Git where applicable. Delegation requires Herdr. Automatic resumption requires a verified native notification or scheduling facility; files alone do not wake an agent."
metadata:
  version: "1.0.0"
---

# FSD

Own delivery of the requested outcome. Choose the smallest useful approach, stay
steerable, verify the result, settle owned work, and stop. This is a skill: it uses
normal tools and native facilities, not an FSD executable, service, or background model.
Follow project instructions rather than imposing a repository layout or release process.

## Start with the outcome

Establish the outcome, done criteria, scope/non-goals, supervision mode, authorized
models/tools/actions, required checks/review, and applicable time, attempt, cost and
worker limits. A clear request plus the owner's [preferences](references/setup.md#preferences)
can supply approval. Inspect facts first and bundle only genuinely missing decisions
into one confirmation. Do not re-ask settled choices or invent a remaining allowance.

Approve an operating envelope, not a fixed roster. Within it, choose direct work,
staffing, independent review, and routine repair without repeated permission ceremonies.
This does not authorize new models, broader tools, releases, spending, or adjacent work.
Loading the skill, finding a task file, or receiving a worker message is not approval.

- **Supervised, by default:** ask about consequential ambiguity or new authority,
  not routine execution decisions.
- **Unsupervised, when requested:** decide within the envelope; defer anything needing
  new authority and continue only independent authorized work. Never bypass an approval
  prompt. Automatic continuation must actually be available, not merely requested.

## Prepare only what is needed

Read [setup](references/setup.md) on first use or when the environment changes. Preserve
approved model, effort, tool and trust selections; verify required settings and disclose
only approved fallbacks. Do not silently substitute settings unsupported by this harness.

Keep a small, already-understood task local. Delegate when parallelism, specialization,
review independence or context isolation outweigh startup, repeated reads and coordination.
There is no mandatory planner/builder/reviewer pipeline. Required independent review
uses a fresh, implementation-read-only context, not the implementer's self-review.

For a small direct task, a short progress/evidence note is enough; do not create an inbox,
workers or a heartbeat. For delegation or work needing durable handoffs, establish the
private [filesystem protocol](references/filesystem.md) before dispatch. Use the
[record templates](templates/goal.md) as needed, not as mandatory paperwork for every task.

Use one coordinator and one implementation writer per working directory, including the
coordinator. Isolate concurrent writers in worktrees. Explicitly assign each writer's
paths and each mailbox's publisher; do not let workers race to claim a shared task queue.
Ownership is a cooperative rule, not filesystem isolation or a global lock service.

## Deliver

1. **Prepare an assignment.** Give it a goal revision, assignment/attempt ID, focused
   outcome, exact worker identity and cwd, owned paths, dependencies, checks, report
   channel and limits. Pass useful entry points and contracts, not the whole transcript.
   Verify a dependency's actual artifact before downstream work starts.
2. **Establish delivery.** Before affected delegation, verify the chosen
   [native wakeup mode](references/delivery.md), including blocked-work coverage. Use
   [Herdr](references/herdr.md) for native workers; do not switch to another delegation
   route or recursive spawning merely because it is available.
3. **Submit once.** Persist dispatch intent before input, verify native readiness and
   an empty prompt, submit with a bounded startup receipt, and retain the real result.
   Uncertain delivery means reconcile, not resend. Repairs, replacements and report
   requests get new attempt IDs and consume the approved dispatch allowance.
4. **Work or yield.** Do independent authorized work; otherwise return control. On a
   native event, approved heartbeat, or owner request, scan the inbox and unresolved
   work. Notifications are hints; retained records survive duplicate or missed hints.
5. **Inspect and repair.** Match messages to the current goal, attempt and actual worker.
   Acknowledge receipt separately from acceptance. Inspect artifacts and checks actually
   run, including cwd, exit status, evidence path and source snapshot. Skips and unknowns
   stay explicit. Repair within the envelope; stop or ask when the attempt allowance is
   exhausted or repeated attempts yield the same failure without meaningful progress.
6. **Integrate deliberately.** Use one destination writer. Verify source/destination
   state and worker quiescence, preserve reports, integrate according to project policy,
   and rerun affected checks on the combined tree. Worker-branch success is not proof
   that the integrated result works.
7. **Finish.** Stop on verified delivery, owner cancellation, an agreed limit, or when
   no authorized work can progress. Settle owned operations, preserve partial work,
   cancel owned watches/check-ins, and [clean up](references/herdr.md#cleanup). Report
   **delivered**, **blocked**, **limit reached**, or **cancelled**, with concise evidence,
   remaining uncertainty and cleanup blockers. The conversation stays available.

## Stay steerable

The owner's conversation remains authoritative. Process steering at the next supported
safe boundary, acknowledge material consequences, and update the goal revision and
only affected assignments. Preserve prior directives and original accounting. A reset,
replacement worker, reload or new session must not reset deadlines or attempt allowances.
An extension of authority or limits needs explicit owner approval.

Pause stops new affected dispatch while in-flight work is reconciled. Cancellation also
uses supported controls to interrupt owned work and preserve a handoff. Writing a file
cannot retract a prompt or stop a running tool; claim settlement only after verification.
Workers recheck current directives at safe boundaries, especially before consequential
side effects, but stale work never restores superseded scope.

Never occupy a model turn with completion waits, sleep loops, repeated status polling
or filler. Do not invent a notification path or inject fake user commands. Missing
wakeup support requires an explicit choice of manual resumption or a narrower approach;
foreground completion waiting is an owner-requested exception, not a fallback.

## Communicate and resume

Update when a meaningful milestone, changed risk/plan, owner decision, or long quiet
period warrants it. Say what changed, what is next, and whether the owner needs to act.
Avoid routine receipt noise; keep IDs and diagnostics in retained evidence.

Keep the coordinator's state and next action current at material transitions. Resume by
reconciling records against live workers, files, pending actions and remaining limits.
An acknowledgment is not proof an action finished; absent acknowledgment is not proof
it never happened. Do not blindly repeat non-idempotent work.

The filesystem preserves information, not execution. A stopped host cannot coordinate
unless an existing facility explicitly supports it. This protocol does not provide
hard spending limits, guaranteed interruption, exactly-once effects, or crash-proof
continuation. Claim only what was verified on the actual host.
