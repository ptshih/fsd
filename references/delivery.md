# Native delivery and bounded heartbeats

A durable inbox is useful even when notifications are duplicated or missed. It cannot
wake a model by itself. FSD does not install hooks, write watchers, create schedulers,
run a service or add a monitoring model. Use existing native facilities only.

## Preferred method first

The default environment is **Pi orchestrating inside Herdr**. Start with the concrete
[preferred Pi/Herdr method](pi-herdr.md): `pi-interactive-shell` headless dispatch runs a
bounded Herdr prompt-and-wait command, and its native completion notification resumes
Pi. Herdr still owns the worker. Disable quiet auto-close; do not spawn an agent through
the shell extension. Pi core alone does not supply this background-command facility.

Inspect that provider's actual availability and applicable proof before reporting a
blocker. **Unverified** means discovery/qualification remains; **unavailable** requires a
specific missing tool/contract or failed check. Reuse valid proof instead of repeating
a campaign for every assignment. Read-only discovery is not permission to install,
launch workers or run a live probe. Loading FSD or doing direct work needs no wakeup.

The modes below describe alternatives only when selected and authorized; they are not
an instruction to search indefinitely or invent a bridge when the preferred method is
missing. Continue suitable direct/independent work; pause only work that really requires
the missing delegation capability.

## Choose a real mode

| Mode | Requirement |
| --- | --- |
| Event-driven (preferred) | The verified background-command method above, or an explicitly selected equivalent |
| Event-driven with recovery heartbeat | Event delivery plus an existing, approved bounded scheduler |
| Heartbeat-driven | Explicitly approved periodic resumption, bounded cadence/count/deadline, and known detection latency |
| Manual | Explicit owner agreement to resume/inspect; no unattended claim |

Direct work without background workers needs none of these. Unsupervised delegated
work requires a verified automatic mode. Do not silently select manual mode, poll in a
model turn, or move to a different delegation route when delivery fails. Continue only
independent authorized work or explain the missing capability.

Native facilities differ by harness and version. Inspect installed help/tool contracts;
a similarly named feature on another host proves nothing. An OS toast, terminal output,
a saved file, or a successful scheduler registration is not a model wakeup. Ordinary
shell backgrounding does not guarantee host notification or ownership after restart.
Never send keystrokes into the coordinator's editor to simulate a user message.

## Verify before affected dispatch

Under the goal's authority, use harmless uniquely identified test events to establish:

- **Busy delivery:** the actual coordinator receives the event at a supported safe
  boundary while doing other bounded work.
- **Idle wakeup:** yield the model turn; receipt must occur after the host really becomes
  idle. Elapsed time or a timer created during the same turn is not proof.
- **Editor safety:** no human draft or prompt input was modified.
- **Session binding:** the event reached the intended current coordinator, not another
  pane/session, and the receiver can identify its source.

Record actual receipt and the facility/host/version/session, not an invented acknowledgment.
Reuse proof while those bindings and capabilities remain valid. Repeat only relevant
proof when activation, session, host or delivery facility changes. Missing evidence is
not evidence of failure: inspect first and identify the specific check needed. A setup-only
request does not authorize workers or a live qualification campaign.

Wakeup and worker-state detection are separate. A file-only channel cannot report a
worker stuck at a permission prompt before it can write a message. Before unattended
work, establish native blocked/failure detection or an approved bounded check-in that
inspects actual owned worker state/screens. Metadata can miss an interactive prompt;
never treat `working` as proof no question is waiting.

## Connect the inbox

With the preferred method, one verified host-owned background operation covers the
Herdr command and its completion delivery, including commands that finish before the
coordinator yields. Do not start an unobserved command first and attach later. Completion
is the hint to scan the inbox; no separate filesystem watcher is required. Job acceptance
is not worker-startup proof, and notifications may abbreviate output: retain and inspect
the full native receipt.

For an explicitly selected file/message mode, use an existing host-managed monitor or
genuine native cross-agent messages pointing to final inbox files. Keep notifications
small: goal, attempt, event ID and report location. The coordinator reads and verifies
the authoritative records through normal tools.

Watch only worker inboxes, not goal/state/acknowledgment files: coordinator writes must
not create wakeup loops. Ignore temporary files, coalesce hints where supported, and
scan for all pending records on every wakeup. Notification loss or duplication must not
lead to re-dispatch or acceptance without inspection.

For a separate monitor, arm observation before the final inbox scan and before dispatch
so there is no scan-then-subscribe gap. On rearming after a one-shot notification, arm
first and rescan. Record the watch's native ID, owner, observed paths, expiry and stop control.
Do not generate a long-running shell/JavaScript loop to manufacture missing support.
A static command passed to an existing generic monitor is configuration, not permission
to add an FSD-specific background program.

## Heartbeat contract

Use a heartbeat only when the owner/envelope permits it and an existing scheduler can
resume this actual conversation. Register one owned job per goal, with:

- native job ID and target session;
- approved cadence and maximum wakeups or equivalent bounded schedule;
- an absolute expiry no later than the goal's approved deadline;
- next expected check-in and remaining allowance;
- a supported stop operation and cleanup owner.

At each check-in, first read the goal's current status, revision and remaining limits.
Stop scheduling for closed/cancelled work. Inspect pending inbox entries, unresolved
attempts, actual worker state and evidence of progress. If nothing needs action, record
only a useful change and yield. Do not create another heartbeat or restart allowances.
Do not run concurrent coordinator turns or displace queued owner steering.

A stale worker timestamp or long thought/tool call is a reason to inspect, not to kill,
reassign or resend. Repeated identical failed attempts can justify stopping within the
agreed attempt policy; absence of file writes alone cannot establish failure.

Heartbeats trade detection latency and model usage for recovery. They do not enforce
hard time/dollar limits, interrupt workers, or guarantee activity after the host exits.
Before unattended dispatch, establish a native deadline notification or an approved
check-in due by the deadline. An expiry that only stops watching does not wake the
coordinator; silence is not success. If the facility cannot honor these bounds, do not
claim a bounded automatic mode.

## Wind down

Cancel only goal-owned watches and scheduled jobs, verify their disposition, and preserve
IDs/receipts in goal state. Writing `closed` is not cancellation of a native job. If a
job cannot be stopped, record its actual expiry, owner and next action as a cleanup
blocker. Late events never authorize a new goal or revive superseded work.
