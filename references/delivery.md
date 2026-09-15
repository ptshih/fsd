# Native wakeup for filesystem handoffs

FSD uses **Herdr tabs → filesystem reports → existing native wakeup → coordinator
verification**. Herdr is the only runtime dependency beyond the current coding harness
and its ordinary tools. Assume Herdr's harness integrations are installed. Do not add
packages, extensions, services, helper models or custom watcher/controller code.

Files are the source of truth. A native notification is a hint to inspect them, not
acceptance or authority. A file appearing, a desktop toast, and an installed integration
are not proof that an idle coordinator will resume.

## Establish the existing facility

Before unattended worker dispatch:

1. Identify the current coordinator's actual harness/session and live Herdr caller.
   Read the available tools' actual contracts; do not infer availability from a package
   name, environment variable or another session's transcript.
2. Use an already-exposed native filesystem-watch facility for the assigned inboxes.
   If the host exposes native worker-lifecycle events instead, use those to trigger
   the same inbox inspection. This is capability discovery, not permission to install
   a provider or implement a receiver. Do not prescribe a particular extension package.
3. Require delivery to this coordinator while busy and after it becomes genuinely idle,
   without typing into or changing the human editor. Require a retained native handle,
   bounded expiry, failure/timeout notification, and specific-handle stop controls.
   A timeout that silently stops observation is not a deadline notification.
4. Reuse applicable proof for this facility, activation and coordinator session. If proof
   is missing, qualify only the missing behavior with harmless identified events under
   the approved goal envelope. Record actual receipts, not a guessed acknowledgment.
   A timer expiring before the model yields does not establish idle wakeup. A new goal
   or worker is not a reason to repeat valid same-session qualification. Recheck only
   evidence invalidated by changed bindings, activation, capability or an observed failure.
   Missing probe authority requires one specific request, not a setup campaign or launch.
5. Record the native tool/facility, binding, proof and handle in goal state. Arm observation
   before the final inbox scan and before dispatch, so an early worker report cannot
   fall between a scan and subscription. Watch only worker inboxes, not coordinator
   acknowledgments or state. Ignore temporary files and coalesce hints where supported.
   Reusing facility proof does not reuse an expired watch: register a current goal-owned
   handle and choose an inspection interval that leaves time for work and cleanup within
   the original deadline.

Use the facility through its documented native interface with bounded configuration
(paths, events, deadline and session). Do not write a script, start an unobserved process,
attach a separate controller later, or use a shell completion wait as a replacement.

## Handle a missing capability

Distinguish **unverified** (proof missing) from **unavailable** (a concrete missing
interface or failed check). Complete read-only discovery before reporting a gap.
An installed Herdr integration supplies only the behavior it actually exposes; it does
not create a missing coordinator wakeup API.

If no usable native facility exists, stop affected unattended delegation before launching
workers. State the exact missing capability. Continue independent direct work when the
outcome and required review permit it. Do not silently switch to manual resumption,
create machinery, install a dependency, or resurrect an older transport. A change to the
requested outcome or operating envelope belongs to the owner.

## Multiple workers

Give each worker attempt its own inbox and unique report identity. Prefer one native
recursive watch over the goal's `inbox/` when the facility supports it; otherwise arm
native watches for each assigned inbox before dispatch. Keep every handle bound to this
goal and coordinator. No custom multiplexer or extra coordinating agent is needed.

One wakeup may represent several workers, and several wakeups may refer to one report.
Scan all pending inboxes on every wakeup, not just the path in the notification. Match
each report to its worker and attempt, then reconcile its acknowledgment and acceptance
records before acting. Unique immutable reports preserve concurrent results even when
hints coalesce. Never equate event count with completed-worker count. One coordinator
still owns integration and the destination checkout.

## Receive and reconcile

On each wakeup, inspect the retained native receipt and scan all final inbox files and
unresolved attempts. Match the goal, revision, attempt, worker identity and native handle.
Duplicate or missed hints must not cause duplicate dispatch or acceptance. Reports remain
available until inspected; acknowledgment, verification and acceptance are separate.

Completion wakeup and blocked-worker detection are different capabilities. A worker
stuck at a permission prompt may not be able to write a report. Require actual native
blocked/failure detection or an owner-approved bounded inspection check-in using an
already-available host facility. Inspect the real UI; neither `working` nor `idle`
metadata proves readiness. An `idle` label can accompany a trust dialog or an active
tool. Follow [UI/status conflict handling](herdr.md#inspect-results-and-prompts); do not
infer settlement from the label or a report file. If required coverage is absent,
report it before unattended work. Do not build a bridge to repair the harness integration.

If observation ends while work remains, reconcile the worker and retained files first.
Renew only native observation within the original deadline and allowance; never resend
the assignment to re-establish a watch. Keep the coordinator's process/session in place.
Do not claim continuation across a stopped host or a replaced session.

## Wind down

Cancel only goal-owned native watches/check-ins, verify their disposition, and retain
handles and receipts in goal state. Cancelling a watch does not stop a Herdr worker;
follow [Herdr cleanup](herdr.md#cleanup) separately. If cancellation fails, retain the
actual expiry and next owner/action as a cleanup blocker. Late events cannot revive a
closed goal or superseded authority.
