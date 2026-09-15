# FSD runtime

A thin Pi TUI extension for goal-based Herdr coordination. The [skill](../SKILL.md) owns
staffing, authority, acceptance, integration and cleanup; the runtime owns dispatch
receipts, observation, durable state and wakeup delivery. No daemon or extra model.

Package 0.4 uses API/state format **4**. Public identifiers are `goalId` and `goalPath`;
records use `goal.json` and `goalId`. Only the current format is supported. Start new
goals in fresh directories; nonempty state is never silently overwritten or converted.
Session pointers live under `~/.local/state/fsd/pi/`.

## Setup and checks

Install the local Pi package as described in the [README](../README.md#install), or use
one global source-linked entrypoint exporting `runtime/index.ts`. Do not register both.
New Pi processes load current code; existing processes require deliberate reload with
owned work settled. Loading the extension registers tools/hooks, not a goal or worker.

```sh
npm test
npm run check
npm run test:herdr-wire
```

Node >=22.19 and an installed Pi are required. Tests use isolated state, fake workers,
the actual Pi loader/UI wrapper, and an unchanged installed Herdr reporter against a
private socket when available. The optional wire test uses the actual Herdr CLI against
a private socket, never your live server. No dependency installation is needed on a
supported host. These checks are not a TypeScript static-type audit.

Native wakeups, parallel worktrees, repeated blocking UI, acknowledgment/resumption,
active-observer reload without duplicate input, integrated fixture checks and cleanup
have been exercised on Pi 0.85.1 with Herdr 0.9.0/protocol 22 and Pi integration v8.
The current goal API/state revision has regression coverage; fresh-format live testing
is separate. Do not extrapolate to other devices, harnesses or failure modes.

## `fsd_runtime`

Six actions; one active goal per coordinator session, with multiple independent workers.
Mutations require the exact active Herdr/Pi TUI binding. Status outside a goal is inert.
Authority fields record the owner's approval; they do not grant it or override guards.

### Open

```json
{
  "action": "open",
  "goalId": "parser-fix",
  "goalPath": "/canonical/project/.agents/fsd/parser-fix",
  "envelope": {
    "goal": "Fix the parser regression",
    "doneCriteria": "Regression and integrated tests pass",
    "scope": "Parser implementation/tests; preserve public API",
    "authorityBasis": "Owner requested this goal and these limits",
    "limits": "At most two workers; approved selections only",
    "usage": "Retain actual consumption; no hard spend enforcement",
    "deadline": "REPLACE WITH APPROVED FUTURE ISO TIMESTAMP",
    "maxWorkers": 2,
    "kinds": ["pi"],
    "workspaces": ["/canonical/project", "/canonical/parser-worktree"]
  }
}
```

Initial deadlines must be within 24 hours; maxWorkers is 1–16. The runtime creates
`goalPath/runtime/`. State must be owner-private; repository-local state must be ignored
and contain no tracked files. Workers may not write coordinator state. Direct-only work
need not open the runtime.

### Prove delivery

Use `control` with `operation: "probe"` and `probeWhen: "now"` for busy delivery. For
idle delivery, use `probeWhen: "idle"` without a delay and yield. It waits for Pi's actual
`agent_settled`/`isIdle()` boundary. A timer cannot prove the model has finished.

Acknowledge each exact `eventId` only after receiving its notification. Both proofs are
required after every activation/reload; submission stays blocked without them. Pending
idle probes coalesce. `automaticDeliveryVerified` covers the wakeup channel, not every
native state source. Messages use custom `steer`/`triggerTurn` delivery, never editor
writes or fake user messages.

### Submit

Supply `submission` with a new `attemptId`, `assignment`, current goal `revision`,
`role` (`writer` or `read-only`), canonical `writePaths`, focused `prompt`, and exact
`worker`: `{pane, tab, terminal, nativeSession, kind, cwd}`. Include the inspected native
`readyRevision`, `emptyPromptVerified: true`, and `readinessEvidence`. An optional
deadline may shorten, never silently extend, the attempt's approved allowance.

`submit` persists intent before input, checks identity/readiness, sends one native prompt
with a bounded startup acknowledgment, retains the receipt, and observes asynchronously.
Identical normalized packets with the same attempt ID return the recorded attempt;
different packets fail. New submissions require new attempt IDs.

`not-sent` means submission was never invoked. `uncertain` means input may have reached
the worker: reconcile current identity, output and retained receipts, never blindly
resend. Herdr has no atomic compare-and-submit identity/screen precondition; exclusive
worker ownership remains essential.

### Inspect, acknowledge and control

- `inspect`: bounded roster/status, optionally one `attemptId`. `reconcile: true` adds
  one live native inspection. It does not resend, adopt or accept work.
- `ack`: exact event ID, separately from acceptance. Keeps observation/deadlines alive.
  Replayed events retain IDs; stale or retired events cannot revive work.
- `control`: operations below need a `reason`, except probes.
  - `pause`, `resume`, `cancel`: whole goal or an attempt's assignment.
  - `supersede`: one attempt; prevents further dispatch to that assignment.
  - `revise`: approved replacement envelope, preserving start/history and original
    attempt deadlines. Shorter limits apply immediately.
  - `reserve-direct`: coordinator writer `directCwds`; empty array releases them.
    Conflicting declared worker/coordinator writers are rejected.
  - `adopt`: an uncertain attempt, with ID-matched evidence and verified native activity.
    Never replays the prompt.
  - `retire`: attempt, disposition and evidence. Acceptance requires verified quiescence.
    Running work needs an explicit handoff naming owner/next action; its ownership stays
    reserved until a later verified quiescent release.

Pause/cancel cannot retract submitted input. Use supported native controls and verify
settlement; observer retirement never stops a worker. Goal resume does not undo an
assignment's cancellation/supersession.

### Close

Supply `outcome` (`delivered`, `blocked`, `limit-reached`, `cancelled`), actual `evidence`
and verified `cleanup` or explicit retained-resource disposition. Unresolved attempts
block closure. Carry retained ownership obligations into future goals; this is not a
global lock service. Closing ends FSD, not the conversation.

## Pi UI bridge

`ui-blocked.ts` connects Pi's `ui_prompt_start`/`ui_prompt_end` to Herdr's existing
`herdr:blocked` counter. It owns one contribution per coalesced UI span, scoped to the
interactive session. Herdr retains identity, report ordering and working/idle state.
The bridge never forwards prompt titles/input, answers dialogs, changes permissions or
edits the Herdr-managed integration. Its passive telemetry does not open FSD goals.

This covers `select`, `confirm`, `input`, `editor` and `custom` extension UI—not every
terminal/subprocess prompt. Startup trust precedes the session-bound bridge. Retain
native identity and actual-screen checks even when metadata reports interactive-ready.
Inspect every real question before acting under existing authority.

## Recovery and limits

Same-session reload restores observation and pending events without resetting limits or
resending prompts. Another Pi session cannot silently inherit control. Missing-pointer
recovery requires explicitly reopening the same current-format goal/path/envelope;
existing state wins. Unsupported/corrupt state fails closed, without conversion.

Orderly shutdown releases leases. A crashed host's lease is not automatically evicted:
reconcile the recorded owner and partial work before removing it. Persistence/delivery
failures freeze dispatch and surface errors. Keep private evidence after closure.

This is not an OS sandbox, approval manager, worker launcher, hard budget limiter or
guaranteed interruption mechanism. A stopped coordinator cannot operate autonomously.
Abrupt crashes, ambiguous post-input failures, active-work cancellation and other
harness/device profiles still need separate live qualification. Only claim what the
actual checks and current operating profile establish.
