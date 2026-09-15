# FSD runtime v3

**Installed and live-qualified for bounded, supervised Pi/Herdr missions on this host.**
Tested profile: Pi 0.85.1, Herdr 0.9.0/protocol 22, managed Pi integration v8, and native
Pi workers with the saved model/effort/tool/trust settings. Real busy/idle wakeups, two
worktree workers, combined dispatch, independent completion, writer-overlap rejection,
original-deadline delivery, and owned-worker cleanup passed.

The initial idle-probe, CLI argument-order, and question-UI reporting defects were
repaired and re-tested. A live worker completed **blocked → acknowledged → resumed →
blocked → declined → completed**, with coordinator reload during the first blocked span.
Observation and the original deadline survived; fresh delivery probes passed and no
assignment was resent. Both accepted fixture modules passed together in a new integration
worktree; the read-only worker made no file changes. Disposable worker panes were removed.

This is a qualified operating profile, not blanket unattended/crash-proof certification.
Hard spend/time enforcement and automatic interruption are not implemented. Post-input
ambiguous-failure recovery, abrupt-host-crash recovery, active-work owner cancellation,
and other harness/device profiles still need separate live qualification.

The local entrypoint points to this checkout's v3 runtime, with a private v2 rollback
backup. Already-running Pi sessions retain their loaded version until deliberately reloaded.
Loading the skill alone does not install the extension, approve a mission, or start workers.

A thin Pi TUI extension plus a tested library: ordinary conversations, visible native
Herdr workers, no daemon, SDK-hosted coordinator, reasoning model, or worker launcher.
The [skill](../SKILL.md) owns staffing, steering, integration, acceptance, and cleanup.

## Components and checks

- `index.ts`: public Pi tool/session/message APIs and explicit activation.
- `ui-blocked.ts`: passive Pi prompt-lifecycle bridge to Herdr's existing blocked counter.
- `core.ts`: mission/attempt state, combined dispatch, observation, reconciliation.
- `transport.ts`: bounded native Herdr commands; no shell interpolation.
- `storage.ts`: owner-private, atomic, fsynced records and exclusive leases.
- `legacy.ts`: read-only v1/v2 inventory; never silently adopts old work.

```sh
npm test
npm run check
npm run test:herdr-wire        # optional: installed Herdr CLI, isolated fake socket
node scripts/install-local.mjs  # read-only plan, not installation
```

Run these from the checkout root. Node >=22.19 is required. Entrypoint and same-process
reload tests use the installed Pi/Jiti implementation, discovered through `PATH` or
`PI_PACKAGE_DIR`; they mock the interactive host and native workers. Core tests need
only Node. Tests use temporary files and fake workers, not your live Herdr session.
No dependency installation is necessary on a supported Pi host. The optional wire check
uses the actual Herdr CLI (currently protocol 22 / 0.9) against a private fake socket,
never the live server: it verifies real positional prompt parsing and request schemas,
including leading-dash/shell-like text. These checks are not an end-to-end worker-delivery
qualification or a TypeScript static-type audit. The 89-test suite additionally exercises
Pi's actual UI wrapper and production entrypoint wiring. When the managed Herdr Pi
integration is installed, a host-contract test runs an unchanged copy against an isolated
socket; it is explicitly skipped when absent.

## Native Pi UI bridge

Pi's `ui_prompt_start`/`ui_prompt_end` events describe one outer blocking span around
`select`, `confirm`, `input`, `editor`, and `custom`. Herdr integration v8 listens instead
to the `herdr:blocked` extension bus. The bridge connects these existing interfaces after
TUI session startup, contributing and releasing only its own counter entry. Herdr retains
ownership of native identity, report ordering, socket delivery and working/idle state.

The bridge does not inspect or forward prompt titles/input, answer questions, approve
operations, alter tools/trust, or introduce polling. Its passive telemetry works in
ordinary Herdr/Pi conversations without opening an FSD mission. The managed Herdr file
is not edited. Existing Pi processes need deliberate reload; new processes load the
bridge from the installed entrypoint.

This covers extension UI lifecycle events, not every possible terminal/subprocess prompt.
Startup trust occurs before this session-bound bridge; retain the native readiness and
actual-screen checks, even when Herdr reports idle/interactive-ready. Other harnesses and
integration versions require their own capability checks. Inspect the real question
before acting; a blocked event never supplies permission.

## Installation and migration

For a fresh device, this is a Pi package (`package.json` exports the extension and
skill). Explicitly install its local directory with Pi's package manager after
reviewing configuration and avoiding duplicate skill/extension registrations.
Install/authenticate Herdr and worker harnesses separately; preserve role preferences.

For the previously installed local bridge, `scripts/install-local.mjs` prints a
read-only inventory and the entrypoint hash. Only after reviewing all legacy sessions,
use `node scripts/install-local.mjs --apply REVIEWED_SHA256`. This explicit operation:

1. Refuses unsettled legacy observations/probes or a changed entrypoint hash.
2. Saves original bridge files, hashes, and complete legacy inventory in a private
   backup outside discovery directories.
3. Replaces only the old `index.ts` with a relative TypeScript re-export of this
   checkout's `runtime/index.ts`. It leaves the original core and state untouched.
4. Does **not** reload Pi, stop/promote workers, modify defaults, or claim qualification.

The installer is for POSIX local files, not an atomic fleet-wide migration. Stop other
coordinators from registering new legacy work during the reviewed replacement window.
Keep this checkout at its installed path. Deliberately reload only after reconciling
live work. To roll back, first settle/hand off v3 work, preserve its records, restore
`index.ts` from the recorded backup, then deliberately reload. Neither bridge observes
the other's live attempts. Never copy private observations into this repository.

## Actual tool: `fsd_runtime`

Six actions, one active mission per coordinator session. All mutating actions require
an active Herdr/Pi TUI binding. Status outside a mission is inert. The adapter is not
an authorization source: the coordinator records the real approved operating envelope.

### `open`

Supply `missionId`, an absolute `missionPath`, and an `envelope`:

```json
{
  "action": "open",
  "missionId": "parser-fix",
  "missionPath": "/canonical/project/.agents/fsd/parser-fix",
  "envelope": {
    "goal": "Fix the parser regression",
    "doneCriteria": "Regression tests and integrated checks pass",
    "scope": "Parser implementation/tests; preserve public API",
    "authorityBasis": "Owner requested this outcome with these limits",
    "limits": "At most two concurrent workers; approved selections only",
    "usage": "Elapsed/consumed usage retained; no automatic spend enforcement",
    "deadline": "REPLACE WITH APPROVED FUTURE ISO TIMESTAMP",
    "maxWorkers": 2,
    "kinds": ["pi", "claude"],
    "workspaces": ["/canonical/project", "/canonical/parser-worktree"]
  }
}
```

Initial deadlines must be within 24 hours; maxWorkers is 1–16. Direct-only work need
not open this runtime. Repository-local mission storage must be ignored and contain
no tracked files. Private state excludes worker write scopes. The runtime creates
`missionPath/runtime/` and a private session pointer under
`~/.local/state/fsd/herdr-pi-v3/`.

### Delivery qualification

For busy delivery, use `control` with `operation: "probe"` (`probeWhen: "now"`, the
default; optional `delayMs` 0–5000). For idle delivery, use `probeWhen: "idle"` without
a delay, then yield. The idle probe waits for Pi's actual `agent_settled` boundary and
checks `ctx.isIdle()`; a guessed timer cannot establish that the model has finished.
On actual receipt, `ack` its exact `eventId`. The event records idle-at-enqueue and
whether the draft remained unchanged; enqueue alone does not qualify. Do not fabricate
acknowledgments. Pending idle requests coalesce and cannot be fired early by replay.
Every host activation/reload requires fresh proof. Submission remains blocked without
both. `automaticDeliveryVerified` proves the wakeup channel only—not native detection
of every worker state. The native UI bridge has separate live evidence on the profile
above; do not extrapolate it to other lifecycle sources. This is per-session capability
evidence, not blanket reliability certification.

Messages use Pi's custom message API with `deliverAs: "steer"`, `triggerTurn: true`,
and no editor writes or fake user messages. Human notices are short; tool results
include bounded machine-readable summaries in model-visible text, not just UI details.

### `submit`

Supply `submission` with a new `attemptId`, `assignment`, current mission `revision`,
`role` (`writer` or `read-only`), canonical `writePaths`, focused `prompt`, and exact
`worker`: `{pane, tab, terminal, nativeSession, kind, cwd}`. Each worker has its own
canonical cwd; it need not match the coordinator. Include the inspected native screen
`readyRevision`, `emptyPromptVerified: true`, and `readinessEvidence`. Optional
`deadline` may shorten, never silently extend, the attempt's approved allowance.

The coordinator first prepares/inspects the native worker using the [Herdr rules](../references/herdr.md).
Submission persists intent, checks exact identity/readiness/sequence, sends **one**
native prompt with a bounded startup wait, persists its receipt, then observes
asynchronously. The packet adds mission/attempt identity and scope. Native completion
is a review candidate, not acceptance. Reusing an ID with identical normalized JSON
returns the existing attempt; different inputs fail. A new checkpoint needs a new ID.

`not-sent` means this runtime never invoked submission. `uncertain` means input may
have taken effect: inspect evidence and live identity; never blindly resend. Herdr
currently has no atomic compare-and-submit identity/screen precondition. The final
readiness-to-input race therefore remains; exclusive worker ownership is essential.

### `inspect`, `ack`, `control`

- `inspect`: roster/status; optional `attemptId` for bounded details. With `reconcile:
  true`, performs one live native inspection. It does not resend or automatically
  adopt uncertain input. Full receipts/reports remain at the private evidence path.
- `ack`: exact `eventId`, independently of acceptance. Acknowledging a blocker keeps
  observation/deadlines alive. Pending/queued events replay with stable IDs after
  recovery, never as new assignments. Retired acknowledgments are harmless within
  the active mission; after closure/new mission, old events may be rejected as stale.
- `control`: all operations except `probe` need `reason`. Requests/revisions are
  recorded; those records are not proof that an operation succeeded.
  - `pause`, `resume`, `cancel`: whole mission or an `attemptId`'s assignment.
  - `supersede`: an exact `attemptId`; prevents further dispatch to that assignment.
  - `revise`: explicitly justified replacement `envelope`; keeps start time/history
    and original attempt deadlines. Shorter current limits take effect immediately.
  - `reserve-direct`: `directCwds` reserves coordinator writer workspaces. Empty array
    releases them. Conflicting worker/direct writers are rejected.
  - `adopt`: exact uncertain `attemptId` plus ID-matched reconciliation `evidence`;
    verifies post-submission live activity without replaying its prompt.
  - `retire`: `attemptId`, `disposition`, and actual `evidence`. Acceptance requires
    verified quiescence. Otherwise an explicit `handoff` names owner and next action.
    A still-running handoff reserves its worker/workspace for the rest of this mission;
    repeat `retire` without `handoff`, with fresh evidence, to verify/release it.

Cancellation/pause cannot retract already submitted input. The coordinator must use
verified native controls to interrupt/settle workers. Observer retirement never stops
a worker. Assignment cancellation/supersession is not undone by mission resume.

### `close`

Requires an `outcome` (`delivered`, `blocked`, `limit-reached`, `cancelled`), final
`evidence`, and verified `cleanup` or explicit retained-resource disposition. Unresolved
attempts block closure; explicitly handed-off resources are recorded, not destroyed.
The coordinator must carry those ownership obligations into any later mission—the
runtime is not a global cross-mission/worktree lock service. Closing ends FSD, **not**
the user's conversation. Another independently approved mission can open normally.

## Recovery and limits

Same-session reload restores observation and replays unacknowledged evidence without
resending prompts or resetting consumption. Another Pi session cannot silently adopt
it. Missing-pointer recovery uses an explicit `open` of the same mission/path/envelope;
existing state wins, never a new budget. Corrupt/foreign state fails closed.

A stopped host cannot coordinate autonomously. Leases are released on orderly shutdown;
a crashed host's lease is **not automatically evicted**. Reconcile its PID/token and
partial work before explicitly removing a stale lease; concurrent/PID-reused owners
must not be displaced. Disk or delivery failures freeze dispatch and surface errors;
repair/reconcile before resuming. Preserve private evidence even after mission closure.

This is not an OS sandbox, trust/approval manager, integration engine, autonomous
worker launcher, hard time/spend limiter, or guaranteed interrupt mechanism. Workspace
roles and direct reservations depend on truthful coordinator declarations and ordinary
project permissions. Preferences and project rules still govern all native operations.

## Separate live acceptance step

Approve disposable workspaces, workers, models, limits, and cleanup before testing.
Then exercise fresh-session open; real busy/idle wakeups and draft preservation;
two independently completing worktree workers; blocked → acknowledged → resumed;
ownership/steering; original/revised deadlines; uncertain receipt reconciliation;
shutdown/reload replay and no duplicate input; final acceptance and verified cleanup.
Record actual model-turn receipts, native identities, evidence, and residual limitations.
The [contract](../references/runtime-contract.md) contains the broader acceptance cases.
Neither isolated tests nor historical v2 live checks qualify v3.
