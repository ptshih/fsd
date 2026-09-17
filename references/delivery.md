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
its own, and each line is a hint to inspect the inbox. It needs the same facility as the
settled-state wait, so it never fills the gap described under
[missing capability](#handle-a-missing-capability). The block is POSIX `sh` and runs
unchanged under `zsh`; replace `ATTEMPT_INBOX` (quoted as one argument) and
`REMAINING_S` (seconds inside the remaining allowance). It emits one line per newly
published `.md` of any kind, ignores `.tmp-*` drafts, and ends with an expiry line so
its stop is a notification, not silence:

<!-- fsd-example: inbox-poll -->
```sh
INBOX=ATTEMPT_INBOX; remaining=REMAINING_S; seen=""
while [ "$remaining" -gt 0 ]; do
  for name in $(find "$INBOX" -maxdepth 1 -type f -name '*.md' ! -name '.*' | sed 's|.*/||'); do
    case "$seen" in *"|$name|"*) ;; *) seen="$seen|$name|"; echo "INBOX_EVENT $(date -u +%H:%M:%SZ) $name";; esac
  done
  sleep 1; remaining=$((remaining - 1))
done
echo "POLL_EXPIRED $(date -u +%H:%M:%SZ)"
```

The settled-state wait stays primary on every harness. Evidence so far: a settled-state
wait on a Claude Code worker returned reliably; on an Antigravity worker only a
blocked-only wait was armed, which by construction cannot fire on `idle`/`done`, and the
inbox observation delivered the report after a fourteen-minute build (2026-09-17). That
says nothing about a full settled-state wait on that harness: arm the full wait and the
inbox observation together there until the wait is qualified.

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

Use the facility through its documented interface with bounded configuration; the only
commands it runs for FSD are Herdr's `agent wait` and the inbox poll above. Do not build
a watcher of your own, start an unobserved process, attach a controller later, or block
the model turn on a completion wait.

## Handle a missing capability

Distinguish **unverified** (proof missing) from **unavailable** (a concrete missing
interface or failed check). Complete read-only discovery before reporting a gap. An
installed Herdr integration supplies only the behavior it actually exposes.

If neither wake source is usable, stop affected unattended delegation before launching
workers. State the exact missing capability. Continue independent direct work when the
outcome and required review permit it. Do not silently switch to manual resumption,
create machinery or install a dependency. A change to the
requested outcome or operating envelope belongs to the owner.

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
