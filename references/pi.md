# Pi as coordinator

Pi's built-in shell tool returns only when its command exits, so with core tools alone a
Pi coordinator cannot arm a settled-state wait without holding the turn (observed
2026-09-14: 24 waits of 60–300 s through that tool, every one blocking). Unattended
delegation from Pi therefore requires the `pi-interactive-shell` extension, which the
owner installs once with `pi install npm:pi-interactive-shell`. Only a coordinating Pi
needs it: direct work and Pi workers do not. Never install, update or change the
extension's stored settings for a goal; the per-call parameters below are not
configuration.

## Check the actual tools

When the owner's deferred setting hides the tool behind a loader, call
`enable_interactive_shell` first; then check your own tool list for `interactive_shell`
and qualify the facility for this session per
[delivery](delivery.md#establish-the-facility-once-per-goal) — the record at the end of
this page does not stand in for that probe. Without the tool, unattended delegation is
**unavailable** ([missing capability](delivery.md#handle-a-missing-capability)); the
request to the owner is the install line above. After the owner installs it, the tool
appears only in a reloaded or new Pi session — a
[replaced session](delivery.md#receive-and-reconcile), not a continuation.

## Dispatch and observe

`interactive_shell` is the [background facility](delivery.md#establish-the-facility-once-per-goal)
FSD needs. Use it only for the commands the facility runs for FSD; its own guidelines
and `spawn` parameter offer agent delegation through the shell, which is
[not the FSD route](herdr.md#identity-and-preparation).

- Run a wait as `mode: "dispatch"` with `background: true`,
  `handsFree: { autoExitOnQuiet: false }` (a silent wait is not a finished one) and a
  `timeout` in milliseconds above the wait's own (Herdr's `--timeout` is milliseconds;
  the inbox poll's `REMAINING_S` is seconds). Redirect the wait's output to the
  attempt's evidence directory: the completion notification carries only the last lines
  and the session's scrollback expires.
- The dispatch returns at once with a `sessionId` — the handle to record in goal state,
  query (`sessionId` alone) and stop (`kill: true`, or `dismissBackground` with that
  id). Completion (exit, timeout or kill) arrives as a new turn.
- `monitor` mode with the `file-watch` strategy is a native inbox watcher with its own
  handle: give it an absolute inbox path (a relative one resolves from the cwd),
  `recursive` only where the platform supports it, and the same bounded `timeout`, whose
  expiry is notified.

Observed 2026-09-15 with pi-interactive-shell 0.15.2: completions arrived while the
coordinator was busy and after its turn had ended, including a command that exited at
once; a dispatched settled-state wait returned as a new turn; file watches fired on
worker reports; a watch timeout was notified, not silent. This verifies the extension's
contract for that run, not any later session's facility: names and defaults change, so
verify the installed contract each goal.
