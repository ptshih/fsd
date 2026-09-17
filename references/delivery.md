# Native wakeup for Herdr workers

FSD uses **Herdr tabs → filesystem reports → existing native wakeup → coordinator
verification**. Herdr is the only runtime dependency beyond the current coding harness
and its ordinary tools. Assume Herdr's harness integrations are installed. Do not add
packages, extensions, services, helper models or custom watcher/controller code. The
bounded inbox poll below is a command the host's facility runs, like `agent wait`, not
machinery of FSD's own.

Files are the source of truth. A native notification is a hint to inspect them, not
acceptance or authority. A file appearing, a desktop toast, and an installed integration
are not proof that an idle coordinator will resume.

This page describes `observation_mode: native-wakeup`, the default for coordinators
other than Codex. A Codex coordinator defaults to `observation_mode: codex-active-turn`
and follows the [bounded tool-wait procedure](codex.md) instead of qualifying idle
wakeups. The worker wait qualification rule below applies in both modes. Record the
mode before dispatch; an explicit owner requirement for idle wakeup still governs.

## Two wake sources

**Settled-state wait (preferred).** Herdr's `agent wait TARGET --timeout MS` returns when
the worker reaches `idle`, `done` or `blocked`, or when the timeout expires. Run it through
the host's already-available background facility so its exit becomes a native notification:
one wait per worker attempt, armed immediately after the startup receipt. A worker that
already settled returns at once, so no completion is lost. One notification covers both
completion and a blocked worker, since Herdr's settled states include `blocked`.

**Inbox watch (fallback and supplement).** An already-exposed native filesystem-watch
facility over the assigned inboxes, or native worker-lifecycle events where the host
exposes them, triggers the same inspection. Use it when the host has no background
command facility, or alongside waits when a worker's pane state is unreliable. Arm
observation before the final inbox scan and before dispatch, so an early report cannot
fall between a scan and subscription. Watch only worker inboxes; ignore temporary files.

On a host with a background facility but no native filesystem watcher (macOS), the
facility can run a bounded inbox poll as a supplement, the same way it runs `agent wait`:
it is observed, bounded and stoppable through the facility's handle, keeps no state of
its own, and its exit is the hint to inspect the inbox. It needs the same facility as
the settled-state wait, so it never fills the gap described under
[missing capability](#handle-a-missing-capability). The block is POSIX `sh` and runs
unchanged under `zsh`; replace `ATTEMPT_INBOX` (quoted as one argument) and
`REMAINING_S` (an integer count of seconds inside the remaining allowance). It snapshots
the inbox when armed — arm it before the final scan, as above — exits `INBOX_CHANGED` on
the first new final `.md` (re-arm after reconciling, as with a returned wait), ignores
`.tmp-*` drafts, exits `POLL_EXPIRED` at the deadline, and exits non-zero on a missing,
symlinked or unreplaced input rather than watching nothing:

<!-- fsd-example: inbox-poll -->
```sh
INBOX=ATTEMPT_INBOX; remaining=REMAINING_S
test -d "$INBOX" && test "$INBOX" = "$(cd "$INBOX" && pwd -P)" || exit 1
case "$remaining" in ''|*[!0-9]*) exit 1;; esac
list() { find "$INBOX" -maxdepth 1 -type f -name '*.md' ! -name '.*' | sort; }
before=$(list)
while [ "$remaining" -gt 0 ]; do
  sleep 1; remaining=$((remaining - 1))
  [ "$(list)" = "$before" ] || { echo "INBOX_CHANGED $(date -u +%H:%M:%SZ)"; exit 0; }
done
echo "POLL_EXPIRED $(date -u +%H:%M:%SZ)"
```

The settled-state wait stays primary on every harness where it is qualified: a full
settled-state wait (one that returns on `idle`, `done` or `blocked`, not a blocked-only
wait) has been observed returning on a genuine settlement, with the report already in the
inbox or visible output at the wake, and the observation is recorded here with its date
and versions. Qualified so far: Claude Code (2026-09-17). On an Antigravity worker only a
blocked-only wait was first armed, which by construction cannot fire on `idle`/`done`, and
the inbox observation delivered the report after a fourteen-minute build (2026-09-17). No
full settled-state wait has been observed to completion on a `codex` or `pi` worker (as
of 2026-09-17), so both remain **unverified**: proof missing, not failure observed.
The [Codex active-turn check](codex.md#turn-boundaries) exercised timeout collection,
later report inspection and cleanup; it did not qualify a wait returning on completion.

A full settled-state wait on an Antigravity (`agy`) worker is now qualified as
**unreliable**: a wait with `--until idle --until done --until blocked` returned `done`
repeatedly while the agent was still actively reading files and running commands
(observed 2026-09-17, Herdr 0.9.1, Antigravity CLI 1.2.5, Gemini 3.8 Flash). The
`done` status was transient — the agent reported `done` briefly between tool calls, then
returned to `working`. Re-arming the wait produced the same false signal each time. The
agent's visible output showed active tool execution (spinners, "Running command..."
indicators) throughout, contradicting the reported status. This makes the settled-state
wait unsuitable as the sole completion signal for `agy` workers.

**On any harness whose settled-state wait is not qualified — `agy` (unreliable), `codex`
and `pi` (unverified) — always pair the wait with inbox observation or visible output
inspection.** When the worker reports to a filesystem inbox, the inbox poll is the
primary completion signal; when the worker reports natively (hardened read-only), inspect
the visible output for report-shaped text on each wake rather than trusting the status
alone. A wait that returns `done` or `idle` on such a worker is a hint to inspect, not
proof of settlement. A harness leaves this list only when its qualifying observation is
recorded above.

Both are hints. On any wake, inspect the actual pane (`herdr agent get`,
`agent read --source visible`) and the inbox: neither `working` nor `idle` metadata proves
readiness, and a wait that returned `idle` can accompany a trust dialog or an active tool.

## Establish the facility once per goal

1. Identify the coordinator's actual harness/session and live Herdr caller. Read the
   available tools' actual contracts; do not infer availability from a package name,
   environment variable or another session's transcript.
2. Confirm the host's background facility delivers to this coordinator while busy and
   after it becomes genuinely idle, without typing into or changing the human editor,
   with a retained native handle, bounded expiry, failure/timeout notification and
   specific-handle stop controls. A timeout that silently stops observation is not a
   deadline notification. Typical facilities: Claude Code's background shell task or
   monitor tool; Pi's monitor tool. Verify the installed contract; names change.
3. Reuse applicable proof for this facility and coordinator session. If proof is missing,
   qualify only the missing behavior with a harmless identified event under the approved
   envelope and record the actual receipt. A new goal or worker does not by itself
   invalidate same-session proof; a changed binding, activation or observed failure does.
   Missing probe authority requires one specific request, not a setup campaign.
4. Record the facility, binding, proof and handles in goal state. Reusing facility proof
   does not reuse an expired watch or wait: register a current goal-owned handle per
   attempt, with a timeout inside both the original deadline (leaving time for inspection,
   repair and cleanup) and the facility's own maximum; renew on expiry after reconciling.

Use the facility through its documented interface with bounded configuration; the
commands it runs for FSD are Herdr's `agent wait`, an already-exposed native watch, or
the inbox poll above. Do not build a watcher of your own, start an unobserved process,
attach a controller later, or block the model turn on a completion wait.

## Handle a missing capability

Distinguish **unverified** (proof missing) from **unavailable** (a concrete missing
interface or failed check). Complete read-only discovery before reporting a gap. An
installed Herdr integration supplies only the behavior it actually exposes.

If neither wake source is usable, stop affected unattended delegation before launching
workers. State the exact missing capability. Continue independent direct work when the
outcome and required review permit it. Do not silently switch to manual resumption,
create machinery or install a dependency. A change to the
requested outcome or operating envelope belongs to the owner.
[Codex active-turn coordination](codex.md) is the Codex default. It keeps the turn open
and provides no idle-resumption guarantee, so it cannot replace an explicit requirement
for idle wakeup without owner steering.

## Multiple workers

Give each worker attempt its own inbox and unique report identity, and its own
settled-state wait; each wake then names its worker. For inbox watches, prefer one native
recursive watch over the goal's `inbox/` when supported; otherwise arm native watches for
each assigned inbox before dispatch. Keep every handle bound to this goal and coordinator.
No custom multiplexer or extra coordinating agent is needed.

One notification may coincide with several reports, and several notifications may refer
to one report. Scan all pending inboxes on every wakeup, not just the worker named in the
notification. Match each report to its worker and attempt, then reconcile acknowledgment
and acceptance records before acting. Never equate event count with completed-worker
count. One coordinator still owns integration and the destination checkout.

## Receive and reconcile

On each wake, inspect the retained receipt, the named worker's pane, and all final inbox
files and unresolved attempts. Match goal, revision, attempt, worker identity and handle.
Duplicate or missed hints must not cause duplicate dispatch or acceptance. Acknowledgment,
verification and acceptance are separate.

A wait that returns `blocked` means a trust, question or permission UI: follow
[UI/status conflict handling](herdr.md#inspect-results-and-prompts) and resolve only
within owner consent. With an inbox watch alone, completion wakeup and blocked-worker
detection are different capabilities: a worker stuck at a prompt may never write a report,
so require an owner-approved bounded check-in using an already-available host facility
or a settled-state wait. Do not infer settlement from a label or a report file.

If a wait or watch expires while work remains, reconcile the worker and retained files
first. Renew only native observation within the original deadline and allowance; never
resend the assignment to re-establish observation. Keep the coordinator's process/session
in place. Do not claim continuation across a stopped host or a replaced session.

## Wind down

Cancel only goal-owned waits, watches and check-ins, verify their disposition, and retain
handles and receipts in goal state. Cancelling a watch does not stop a Herdr worker, and a
wait returning does not prove the worker stopped; follow [Herdr cleanup](herdr.md#cleanup)
separately. If cancellation fails, retain the actual expiry and next owner/action as a
cleanup blocker. Late events cannot revive a closed goal or superseded authority.
