# Nonblocking coordination

The [runtime guide](../runtime/README.md) describes the current `fsd_runtime` API.
FSD remains in the ordinary conversation; no separate coordinator, daemon or monitoring
model is needed. Direct-only work needs no worker observer.

## Operating loop

```text
Prepare authorized assignment and verify native readiness
  -> submit once through the registered runtime
  -> do independent authorized work or yield
  -> receive worker event / owner steering / status request
  -> inspect identity, evidence and current goal criteria
  -> continue observing, repair, accept or wind down
```

Use combined `submit`: it registers the attempt before native input, retains a bounded
startup receipt, and observes asynchronously. Follow the [Herdr rules](herdr.md) for
native setup, assignment ownership, actual UI inspection and cleanup.

The model must not wait through worker completion, sleep-loop, poll repeatedly, or invent
filler work. A bounded inspection on an event, startup, steering or status request is
useful work. Foreground completion waits require an explicit owner request; a broken
notification path never authorizes a silent fallback.

## Verify delivery

Check the loaded adapter, exact coordinator binding and capabilities needed by the goal.
After each activation/reload, prove busy delivery and true idle wakeup without changing
the human editor, then acknowledge only the exact events actually received. Successful
enqueue, a toast, or a saved preference is not delivery proof.

Native state detection is a separate capability. Pi's UI bridge forwards blocking
extension-UI lifecycle events; it does not cover every subprocess prompt or grant
permission. Verify the actual prompt before responding under existing authority.

If required automatic delivery is unavailable or fails, pause affected dispatch and
report the limitation. Manual resumption requires explicit owner approval. Independent
authorized work may continue; do not switch delegation routes or add a monitoring model.

## Events, steering and failures

Match each event to the goal/revision, assignment/attempt and worker incarnation.
Reports and lifecycle states are inspection candidates, not acceptance or new authority.
Acknowledge receipt separately from checking the output. Acknowledging a blocker retains
observation and the original deadline; if still working, yield again.

Owner steering takes effect at the next supported safe boundary. Reconcile in-flight
work against the latest direction; stale events cannot restore superseded scope. Pause
blocks new affected dispatch. Cancellation additionally needs supported native controls
and verified partial-work retention; retiring an observer does not stop its worker.

Timeout or transport failure proves neither nondelivery nor cancellation. Inspect the
retained receipt and current native identity before recovery; never blindly replay input.
Retries and reloads preserve usage and original limits. Unknown consumption is not a new
allowance. Deadline delivery is not hard time/spend enforcement.

## Finish and resume

The running host can wake an idle model. If the host stops, workers may continue, but
coordination is not guaranteed. On restart, reconcile pending records, live workers,
authority, direction and remaining limits without resending prompts.

On delivery, cancellation or a limit, retain evidence, retire observations and
[prune disposable workers](herdr.md#prune-finished-workers). Preserve the coordinator
conversation and unrelated resources. A new goal needs its own approved scope and limits.
