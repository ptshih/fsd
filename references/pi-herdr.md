# Preferred method: Pi coordinator inside Herdr

This is FSD's default deployment profile, not permission to switch the current harness
or create another coordinator. It assumes a long-lived Pi conversation, not a print-mode
process that exits after its turn. Honor an explicit owner-selected environment or
allowed delivery mode instead; do not qualify an unused default.

**Preferred automatic method:** use `pi-interactive-shell`'s `interactive_shell` tool
in headless **dispatch** mode to run one bounded Herdr prompt-and-wait command. Its
completion notification resumes Pi; Herdr still owns the visible native worker.
This adds no coordinating model, polling loop or FSD executable.

## Host requirement and discovery

Pi core 0.85.1 documents **no background bash**. Its builtin `bash` tool accepts a
command and timeout, not a background-notification option. Herdr can wait for worker
state, but that alone does not resume a yielded Pi conversation. Neither shell `&`
nor a Herdr desktop notification supplies this missing connection.

The preferred Pi route therefore requires a **separately installed and approved host
extension**, [pi-interactive-shell](https://github.com/nicobailon/pi-interactive-shell).
It is not bundled with FSD and is not needed for direct work. No `pi-subagents` tool,
child model or workflow is part of this route.

Before declaring a coordination blocker:

1. Inspect the actual harness, Herdr caller and available tools. Look first for
   `interactive_shell`, or its documented `enable_interactive_shell` deferred loader
   when that already-installed provider is approved. Inspect its installed contract.
2. Require headless dispatch, completion/failure/timeout notification, a retained job
   ID, bounded timeout and specific-job stop controls. Require quiet auto-close to be
   disabled. An installed package without an available tool is not usable yet.
3. Check existing proof for this provider/version/activation and coordinator session.
   Reuse still-applicable proof; do not launch a fresh experiment for every assignment.
   If proof is missing, determine the exact authorized check required by
   [delivery qualification](delivery.md#verify-before-affected-dispatch).
4. Record one of these states with a concrete reason:
   - **unverified:** a candidate route exists but evidence is incomplete. Continue
     discovery or an already-authorized check; this is not proof of unavailability.
   - **verified:** applicable native receipts establish the required behavior.
   - **unavailable:** the required tool/contract is missing, incompatible, or a check
     failed. Name the actual missing capability or failed check, not just “no wakeup.”

Read-only discovery needs no worker launch. Live qualification needs the goal's approval
and limits. If additional authority is necessary, ask once for that specific check.
Do not silently install a package, change preferences, create a bridge, or run a helper
model to wait. If the preferred provider is absent, explain the one-time setup choice:

```sh
# Owner-approved setup only; never run merely because FSD was loaded.
pi install npm:pi-interactive-shell
```

Use the host's supported reload/new-process procedure afterward; never inject `/reload`
into a human editor. Installation still does not prove delivery. An owner-selected,
already-approved equivalent background-command facility can be used only with the same
verified contract and a recorded method change—not an open-ended search for shortcuts.

If delegation is optional and direct work can satisfy the outcome and required review,
continue directly without a generic coordination blocker. If delegation is necessary,
pause only affected work and state the concrete setup/verification decision needed.
Do not waive independent review or take over an unsettled worker's checkout.

## Dispatch one controller command

After applicable qualification (including any explicitly authorized probes), create/start
the **task worker through Herdr**, with the approved identity, cwd, model and
scope. `interactive_shell` runs only the Herdr controller command: do not use its
`spawn` facility, agent CLI commands, worktree creation, or another model as the worker
route. FSD remains Herdr-only for delegation.

Before input, complete the [Herdr preflight](herdr.md#dispatch), retain the exact prompt
and current identities, and persist `prepared`, then `dispatch-started` intent. Prepare
a fully shell-quoted command with this installed Herdr command shape:

```sh
herdr agent prompt TARGET TEXT --wait --timeout HERDR_TIMEOUT_MS
```

Replace all placeholders. TARGET and the entire TEXT are individual arguments before
options. Do not interpolate untrusted report text into shell syntax. Set any variables
in the same command invocation; do not rely on a prior shell tool call's environment.
Retain real stdout/stderr/exit evidence in approved private paths or the provider's
verified result channel, not just its abbreviated completion notification.

Then submit that command exactly once through the approved background tool. In this
agent-side example, `herdrPromptCommand`, `coordinatorCwd` and `observerTimeoutMs` are
already validated values, not strings to send literally:

<!-- fsd-example: pi-herdr-dispatch -->
```js
interactive_shell({
  command: herdrPromptCommand,
  cwd: coordinatorCwd,
  mode: "dispatch",
  background: true,
  handsFree: { autoExitOnQuiet: false },
  timeout: observerTimeoutMs
});
```

Both Herdr's timeout and this provider's timeout are in **milliseconds**. Derive them
from the original remaining allowance, with cleanup headroom. Let the Herdr timeout
expire before the observer's ceiling so its receipt can be retained. Neither timeout
may extend the goal deadline. Quiet output is normal while Herdr waits; default quiet
cancellation would make this method unreliable, so `autoExitOnQuiet: false` is required.

This is a background **controller command**, not a foreground completion wait in Pi's
builtin `bash`. Use one host-owned operation for command execution and completion
delivery; qualification must establish that even an early command exit is retained and
notified. Do not start an unobserved process first and attach later. Herdr's prompt-and-wait
operation includes its native startup activity gate and settled-state wait; verify those
semantics in installed help. Do not first submit the prompt elsewhere and then submit
it again through this method.

Record the returned **provider job ID separately** from the coordinator's Pi session
and worker's native session. A job-start receipt proves neither worker startup nor
completion. Native startup/outcome evidence may arrive later; retain that distinction
in the attempt record. Work independently or yield—do not poll the job or invoke
`bg_wait` as if it automatically tracked this provider's ID.

## On notification, timeout or interruption

Match the provider job, attempt and actual worker identity. Inspect the complete native
result and inbox before acknowledging, verifying or accepting anything:

- A settled `idle`/`done` state is a reason to inspect, not acceptance.
- `blocked` requires inspection of the actual UI and the owner's applicable consent.
- A timeout, cancellation, missing job receipt or tool error requires reconciliation;
  it does not prove the prompt was never sent. Never blindly repeat `agent prompt`.
- If the worker is still running and observation needs renewal, reconcile first. A new
  approved observer uses `herdr agent wait`, **not another prompt**; retain the original
  deadline and any check-in allowance. Do not turn this into unapproved periodic polling.

Herdr only reports blockers it actually recognizes. Do not claim coverage of every Pi
permission/question UI without proof or an approved bounded inspection plan. Observer
timeout must deliver a real wakeup; stopping a timer silently is not deadline coverage.
Stopping/dismissing the controller job does not prove the Herdr worker stopped.

Keep the owning Pi conversation/process in place while its controller jobs are pending.
Do not claim recovery across reload, session switch or host exit. Reconcile actual jobs,
workers and effects before continuing. Cancel only specifically owned jobs, retain their
receipts, verify quiescence and follow [Herdr cleanup](herdr.md#cleanup). Never dismiss
all background sessions or touch the human editor to manufacture a notification.

## Qualification boundary

The tool shape and quiet-timeout warning were checked against the upstream
[README](https://github.com/nicobailon/pi-interactive-shell#background-dispatch-headless)
and 0.15.2 source. These are documentation/source findings, **not a live Pi/Herdr pass**.
Verify the installed version. FSD's local document tests do not install this extension,
launch workers or establish native wakeup, blocker detection or restart recovery.
