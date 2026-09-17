# Codex as coordinator

Use **active-turn coordination by default when the coordinator harness is Codex**.
Record `observation_mode: codex-active-turn` in goal state; do not ask for separate
approval of this mode. An explicit owner choice of another mode takes precedence.
Workers still use Herdr tabs and the same
assignment, report, verification and cleanup protocol. No service, extension, native
subagent or harness setting is needed. Worker harness selection does not determine
the coordinator's observation mode.

## Check the actual tools

Verify the current session exposes `exec_command` and `write_stdin` (directly or through
its code-mode tools). A long-running command must return a retained `session_id`, and
the tools must support bounded collection and cancellation of that session. Check the
installed contracts rather than assuming every Codex host has the same tools.

A terminal session ID proves that a command can be collected. It does not promise a
notification or another model turn after a final answer. Code-mode `functions.wait`
collects a yielded `functions.exec` cell by `cell_id`; `write_stdin` collects a shell
process by `session_id`. Keep those handles distinct and retain shell handles in goal
state, not just in a JavaScript variable that disappears between cells.

Do not treat `codex queue` or notification hooks as an automatic substitute. Queue
acceptance alone does not establish delivery to a loaded coordinator on the same app
server, or resumption after idle. A native-wakeup goal still needs the
[facility proof](delivery.md#establish-the-facility-once-per-goal).

## Dispatch and collect

Apply the [worker wait qualification rule](delivery.md#two-wake-sources) in this mode
too. For an unqualified worker harness with filesystem reporting, arm bounded inbox
observation through the terminal tools before dispatch and the final inbox scan; its
inbox is the primary completion signal. Retain both observation handles. For native
reporting, inspect the visible output on each collected wait result, including timeouts.

1. Follow [Herdr dispatch](herdr.md#dispatch), including a single submission and its
   durable, bounded startup receipt. Then start `herdr agent wait WORKER_NAME --timeout
   REMAINING_MS` through `exec_command`. Quote the actual worker target as a shell
   argument. Bound Herdr's timeout by the remaining goal allowance and leave time for
   inspection and cleanup. Use at most 60000 ms per observation slice so a stale worker
   status cannot delay report inspection for the whole goal allowance.
2. Use a short tool yield (for example, `yield_time_ms: 1000`) and `tty: true` so the
   returned shell session can be interrupted through `write_stdin`. If the command
   already exited, inspect its result immediately; do not invent a handle or call
   `write_stdin` without a returned session ID. Otherwise persist the handle with the
   attempt, worker identity, deadline and next action. Each worker has its own wait.
3. Do independent work while the wait runs. When collection is needed, call
   `write_stdin` with that exact `session_id`, empty `chars`, and a bounded
   `yield_time_ms` within the installed tool's range (use the verified 10000 ms interval
   when available, shortened for the remaining allowance). Keep updates and owner
   steering responsive; no individual collection should block longer than 60 seconds.
   Collect the existing session instead of launching duplicate
   waits or repeatedly querying worker status. Retain any yielded code-mode cell and
   collect it before another call can touch the same shell session.
4. On exit or timeout, inspect the actual worker identity, pane, reports and unresolved
   attempts. `idle`/`done` and a zero exit do not prove a completed report or quiescence.
   A blocked UI needs the owner's existing consent. After a timeout, reconcile and
   renew only observation within the original allowance; never resend the assignment.
   If status returns prematurely for a native reporter, use a bounded wait for the next
   relevant state transition before inspecting again;
   avoid an immediate settled-state rearm loop. A timeout can also accompany a completed
   native report when Herdr's status remains stale, so always inspect output on expiry.
5. Verify and integrate the result, then settle the worker and its observation sessions.
   For an owned, still-running TTY wait, send `chars: "\u0003"` to its exact shell
   session and collect the exit. This stops the wait, not the worker; perform
   [worker cleanup](herdr.md#cleanup) separately. Retain any cancellation uncertainty.

## Turn boundaries

While authorized workers are running, keep the coordinating turn active through work
or bounded tool collection. A progress update belongs in commentary. Do not send a final
`waiting` answer expecting a terminal process, report file or code-mode cell to restart
the model. If interrupted, retain `waiting` with outstanding handles and attempts; on an
actual resume, reconcile them before acting. Do not claim automatic continuation across
an ended turn, stopped host or lost tool session.

Finish on verified delivery, cancellation, an agreed limit or a real blocker after
settling owned operations. If the owner requires the coordinator to become idle and
wake unattended, this mode does not satisfy that requirement: use a verified native
facility or report the capability gap before dispatch.

Observed 2026-09-17 with Codex CLI 0.154.0, Herdr client 0.9.1 / server 0.9.0: a
single read-only Codex review was submitted once and captured in the active coordinator
turn before verified worker exit and tab cleanup. A 60-second wait expired before the
roughly 80-second review finished; subsequent inspection recovered the report, and the
final captured native status was `done`. Separate terminal probes verified timeout
collection and cancellation. This verifies the bounded observation procedure for that
run, not a settled-state wait returning on completion or idle wakeup.
