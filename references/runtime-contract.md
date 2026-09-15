# Herdr → Pi runtime contract

**Status: design contract; v3 installed and live-qualified for the documented Pi/Herdr profile.**
See the [runtime guide](../runtime/README.md) for the actual `fsd_runtime` API and precise
passed/unqualified cases. Busy/idle wakeups, parallel worktree completion, repeated native
question-UI blockers and active-observer reload passed after the integration repairs.
This broader contract is not a claim that every acceptance scenario is live-qualified.
The local entrypoint is v3 with a private rollback backup. Already-running sessions retain
their loaded version until deliberately reloaded. Use the [operating policy](async-coordination.md)
for current work; deployment and live qualification remain separately scoped.

## Purpose and boundaries

Make FSD reliable inside an **ordinary Pi conversation**, with native workers visible
and individually accessible in Herdr. No dedicated launcher, extra reasoning agent,
external daemon, or new chat interface is required. Direct-only work must remain possible
without initializing worker observation.

Separate three responsibilities:

| Component | Owns | Does not own |
| --- | --- | --- |
| FSD skill / coordinator | Outcome, authority interpretation, direct/delegated strategy, staffing, assignments, review, acceptance, useful updates | Hand-timing receipt files and maintaining transport state in prose |
| Tested runtime library + thin Pi extension | Explicit dispatch execution, attempt identity, observation, bounded events, recovery records | Choosing tasks/models, accepting results, autonomously retrying/launching workers, or granting authority |
| Herdr | Native worker processes, visible panes/tabs, supported control and state APIs | Deciding whether an assignment meets the owner's outcome |

The adapter is inert until the coordinator explicitly opens an authorized mission in
the current session. Loading a skill/extension or reading status never opens a mission,
launches workers, approves trust, or starts background observation. Normal Herdr launch,
settings verification, and cleanup remain coordinator-controlled supported operations.
The first implementation need not wrap every Herdr command.

## Small coordinator-facing interface

These are **design requirements**, not the argument schema. The actual implementation
uses one `fsd_runtime` tool with these actions; consult its runtime guide. Prefer one compact tool
surface with structured inputs and short outputs over a family of shell/config rituals.
The tool records coordinator-supplied authority; a Boolean or config file is not proof
of owner consent and cannot override project, harness, or tool guards.

| Operation | Required behavior |
| --- | --- |
| `open` | Bind an approved mission/envelope revision and private state directory to this Pi session and Herdr host. Report verified capabilities and limitations. Initialize in an already-running conversation without manual config files or a per-mission reload. Do not start workers or dispatch work. |
| `submit` | Take a prepared assignment, exact verified worker, worker cwd/write scope, mission revision, unique attempt ID, and deadline. Persist registration, submit once through native Herdr, retain startup evidence, and establish observation as one bounded operation. Return an explicit started, already-settled, blocked, not-sent, or uncertain outcome plus evidence references. |
| `inspect` | Return bounded mission/assignment/attempt/event state and evidence paths. Make an explicit bounded live reconciliation when requested; never resend, accept work, or start a polling model. |
| `control` | Record coordinator-directed revision, pause/resume, cancellation, or supersession. Gate new affected dispatch immediately; keep observing unresolved in-flight work. Distinguish observer/dispatch changes from worker interruption, which requires explicit supported owned control and verified results. |
| `ack` | Acknowledge exact event IDs idempotently. This acknowledges receipt only: it does not accept results, stop workers, or discard observation of unresolved work. Return current event disposition so a stale notification cannot masquerade as live work. |
| `close` | Retire mission observation after reconciliation and worker cleanup, preserving evidence and explicit retained-resource/cleanup-blocker records. Never close the Pi conversation. Do not report workers stopped merely because observation ended. |

Keep one active mission per coordinator session initially, with **multiple independent
worker attempts** inside it. A second mission requires closing or explicitly handing off
the first. This avoids a general-purpose multi-project scheduler while supporting both
small tasks and hours-long parallel work. Historical missions must not exhaust a small
session-wide registration counter.

Write-ownership checks compare recorded assignment scopes, including coordinator-declared
direct work in a mixed mission. They are not a filesystem sandbox or proof that every
shell operation obeyed its scope. Preserve normal harness tools and project guards;
do not claim hard isolation merely because the adapter has a path registry.

## Dispatch semantics

The complexity belongs inside `submit`, not in a sequence of model turns:

1. Verify the active mission revision, limits, installed transport, exact worker
   incarnation, its own canonical cwd, readiness, and absence of a human draft. Reject
   overlapping submissions/write ownership. Coordinator and worker cwds may differ;
   multiple worktrees are expected, not an identity mismatch.
2. Durably register the attempt, prepared-packet identity, exact pre-dispatch baseline,
   and original deadline before the side effect. Scope identity to Pi session, Herdr
   host/session, native worker session/process incarnation, and pane/terminal identity;
   a label or pane number alone is insufficient. Preserve the receipt/evidence path.
3. Perform the native prompt submission with a short bounded startup acknowledgment,
   capped by remaining time. Capture the real response/timestamps in code and confirm
   post-submission activity. Old idle/done cannot satisfy a new assignment. Fast
   completion around registration/submission must still be collected.
4. Establish asynchronous observation and return without waiting for worker completion.
   A separate model call must not be needed to save/confirm the receipt within a fixed
   30-second window. Startup bounds belong to the operation, not model response latency.

This is a **single recoverable operation**, not an atomic transaction across Pi, disk,
and Herdr. A crash can occur after submission but before receipt persistence. Persist
that uncertainty, reconcile the original attempt, and never blindly replay it.

Reusing an attempt ID with an identical packet returns its recorded status or requests
reconciliation; it never submits again. Reusing the ID with different inputs is an error.
An authorized new repair/submission gets a new attempt linked to its predecessor after
ownership and side effects are reconciled. Definitive not-sent and uncertain are distinct.
Transport exceptions, timeout, or a process exit do not by themselves prove nondelivery.

The adapter uses verified native APIs; do not patch Pi internals, fabricate receipts,
accept trust prompts, or silently change launch flags/models/tools to make submission
succeed. Native setup/approvals follow [Herdr policy](herdr.md#native-approvals-and-trust).

## Observation and delivery

- Observe each active worker independently through supported Herdr events or bounded
  native waits outside the model turn. One worker's completion must not replace another's
  watch. Recheck identity and sequence around collection; do not follow a reused pane.
- The inspected Herdr 0.9.0 schema exposes `events.subscribe`. That alone does not prove
  replay guarantees or assignment correlation. Choose transport based on verified
  behavior; switching away from native waits is not itself a reliability improvement.
- Separate attempt lifecycle from notification lifecycle. An attempt can require
  attention and later continue; an acknowledged blocker must not lose its watch or
  original deadline. Completion is a candidate until the coordinator checks evidence.
- Use Pi's supported custom-message API with `triggerTurn: true` for idle wakeups.
  Deliver urgent blockers, failures, and deadlines using supported safe-boundary
  steering; routine completions may use coalesced follow-ups when deferral is harmless.
  A completed dependency that now needs coordinator action must not wait indefinitely
  behind unrelated direct work. Verify actual queue behavior rather than treating
  successful enqueue as consumption.
- Keep machine events distinct from human instructions. Do not use fabricated user
  messages, editor writes, pasted reports, or synthetic Enter keys. Never capture a
  human draft in diagnostics. Preserve normal Pi user steering and cancellation;
  events carry evidence, not permission or new assignments.
- Include mission/revision, assignment/attempt, worker identity, kind, observed time,
  stable event ID, and evidence path. Bound payloads and coalesce duplicate transitions
  without hiding distinct workers, failures, or attempts. Human notices are short;
  coordinator-authored progress updates follow the skill, not every transport event.
- Persist pending/enqueued/acknowledged/retired dispositions. Enqueue is not acknowledgment;
  replay pending events at least once after reconciliation, using stable IDs. Late or
  already-queued retired events cannot revive work, undo steering, or trigger dispatch.
  Acknowledgment of a retired event remains harmless and reports its retired status.

## Steering, limits, and recovery

The normal Pi conversation remains the steering interface. No additional supervisor
model or custom editor is needed. The coordinator translates clear owner direction
into revised assignments or explicit controls; the adapter records the revision and
rejects submissions against superseded revisions. It does not infer authority from a
worker report or decide what the owner's words mean.

Pause gates new affected work while retaining observation/evidence. Cancellation or
supersession must not silently release a worker's write ownership while it is still
running. Reconcile native interruption and partial results before replacement. Unrelated
work may continue only when the coordinator says it remains authorized.

Retries, checkpoints, reloads, and replacement workers retain original run limits and
consumption. Only explicit owner-authorized revisions may change the envelope; record
old/new limits and the basis without resetting usage. Unknown usage is not an allowance.
A deadline event is not worker termination; hard time/spend enforcement is out of scope
unless separately implemented and authorized. Allow settling/cleanup after a limit
without treating that as permission for another implementation attempt.

Keep human `state.md` separate from adapter-owned machine records, preferably under the
mission's private `runtime/` directory. Use atomic record replacement or a recoverable
journal, owner-private filesystem permissions, and repository ignore rules as applicable.
Retain evidence and archive bounded records without a small lifetime checkpoint cap.
If capacity/persistence fails, expose the failure; do not discard unresolved records or
claim the notification was delivered. No credentials or raw reasoning belong in state.

On reload/restart, reconcile pending attempts, live identities, latest mission revision,
notification dispositions, and remaining limits before resuming observation or allowing
new dispatch. Never replay prompts automatically. Session replacement (`/new`, `/fork`,
or another session) must not silently inherit an old mission's control authority.
Rebinding requires explicit reconciliation; recorded pane IDs are not current ownership.

Shutdown retires this session's timers/subscriptions/observer processes, not its workers.
Persist enough for a later handoff, but do not promise unattended coordination after the
host stops. Missing delivery must surface through an available verified human path;
quiet failure is not acceptable. Closing a mission retains its evidence and leaves the
ordinary conversation ready for the owner's next request.

## Implementation and migration constraints

- Keep the runtime core, thin Pi adapter, tests, and operating documentation in one
  versioned source package. Installation should not depend on a developer's home path
  or test files stored only in private mission state. Private records remain outside
  the published package. This design does not itself install or enable a package.
- Inject transport, storage, clock, and notification boundaries for tests. Use public
  Pi APIs and supported Herdr commands; resolve executable/capability information rather
  than hardcoding a user's binary path. Fail clearly on unsupported hosts.
- Preserve the existing tested identity, stale-event, fast-completion, cancellation,
  and reload behavior. The inspected local bridge passed 35 isolated tests during
  design review; those tests and retained live receipts validate that version's scope,
  not this proposed API or parallel/worktree operation.
- Inventory and settle or explicitly hand off existing observations before upgrading.
  Preserve their configs, receipts, notifications, and original deadlines. No automated
  adoption of historical records as new assignments, active-mission mutation on document
  update, or silently resubmitted work. Retain a known-good version for deliberate rollback
  after reconciling any newer state; rollback must not resurrect retired attempts.

## Acceptance scenarios before release

Exercise the actual library and extension, with bounded live qualification where noted:

1. Open/close a fresh mission in an existing Pi conversation without config-file editing
   or a per-mission reload. Outside a mission the adapter is inert. Direct-only delivery
   works without workers/observers. Run a second mission after the first without stale
   authority or exhausting retained-history limits.
2. Submit once, including instant completion before the operation returns. Reject stale
   ready state, duplicate IDs with different packets, and coordinator/worker identity
   mismatches. Retrying an uncertain request never duplicates a prompt.
3. Monitor two simultaneous workers in different worktrees. Complete them in either
   order and deliver both results independently. Reject overlapping writer ownership.
4. Show **real idle wakeup** and **real busy safe-boundary delivery** with an untouched
   unsent human draft. Verify actual acknowledgment, not just a mocked send API. Normal
   owner steering remains usable while workers and coordinator direct work are active.
5. Pause, steer, cancel, and supersede during work and during pending submission. Verify
   affected dispatch gates, partial-work retention, actual worker state, continued
   observation where needed, and rejection of obsolete mission revisions.
6. Deliver duplicates/out-of-order events and reused pane/native-session identities.
   Acknowledge before and after retirement. None may duplicate acceptance, dispatch,
   closure, or restore superseded scope.
7. Surface a real approval prompt, worker exit, transport failure, expired deadline,
   and storage/delivery failure. No automatic approval, resubmission, or claimed worker
   termination. Blocker acknowledgment must not discard ongoing observation.
8. Reload/disconnect/restart before submission, after submission but before receipt
   persistence, while watching, and after enqueue but before acknowledgment. Reconcile
   without prompt replay, deadline reset, draft mutation, or cross-session adoption.
9. Inspect reports and executed checks before coordinator acceptance. On completion or
   cancellation, verify disposable workers are cleaned up through supported controls,
   observations retired, evidence retained, cleanup failures disclosed, and Pi left open.
10. Migrate existing v2 records without losing evidence or changing limits, verify repeated
    checkpoints beyond the old small registry cap, and test same-process dependency
    reloads against the installed Pi loader. Re-qualify capabilities after upgrades.

Release only the capabilities actually exercised. Until then, the proposed interface
must stay explicitly separate from current operational instructions.
