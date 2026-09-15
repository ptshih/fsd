# Native Herdr operations

Use Herdr only for authorized worker coordination. Require `HERDR_ENV=1`, but also
verify the live caller/server: the environment variable alone is not proof. Consult
installed `herdr --skill`, `herdr --help` and command-group help for syntax. Never use
bare `herdr` for discovery, stop the server, or modify a managed harness integration.

## Identity and preparation

Discover the caller with `herdr pane current --current`, inspect actual agent IDs, and
check server/client compatibility as needed. Never infer ownership from focus, a pane
label or an old transcript. Record server/socket context, pane, tab, terminal, native
agent session, kind and canonical cwd. Reconcile after any occupant/session change.

Keep the coordinator in the ordinary conversation. Name only owned resources as useful,
and preserve focus. Use visible native workers in dedicated tabs as described below.
Creating a worker does not authorize unrelated layout changes or closure of reused
resources. Native subagents and recursive spawning are not the FSD delegation route.

Verify effective executable/arguments, harness/model/effort, tools and approval mode.
Preserve the owner's selections. Recognized agent kind and launch flags alone do not
prove effective settings. An unavailable requirement blocks affected dispatch; disclose
only approved fallbacks after reconciling unfinished work.

Use one implementation writer per canonical cwd. Concurrent writers get separate Git
worktrees, with recorded branch/base, paths, dependencies and integration owner. Never
edit another worker's checkout or silently take over its partial work.

## Worker tabs

After delivery qualification and within the approved delegation envelope, create
**one new, goal-owned Herdr tab per worker**. Do not use `herdr pane split` or put new
workers into the coordinator's or an unrelated existing tab. This FSD topology takes
precedence over Herdr's generic sibling-pane default. Keep the user's focus unchanged.

Inspect installed `herdr tab create --help`. Replace all placeholders below with the
verified workspace ID, approved canonical worker cwd and a useful worker label, quoting
each replacement as one shell argument. Use the coordinator's workspace unless the
owner selected another; do not create a workspace merely to launch a worker.

<!-- fsd-example: herdr-worker-tab -->
```sh
herdr tab create --workspace WORKSPACE_ID --cwd WORKER_CWD --label WORKER_LABEL --no-focus
```

Retain the returned `.result.tab.tab_id` and `.result.root_pane.pane_id`; verify the new
tab has only its root pane and the intended cwd. Start the approved agent in that root
pane after verifying its empty shell prompt. Herdr's pane ID is still the native target:
`agent start --pane` targets that tab's root pane; it does not create a split.
Record both IDs in the assignment. If tab creation fails or is unavailable, reconcile
any created resources and pause only affected delegation. Do not fall back to split panes.
Follow [cleanup](#cleanup) for these owned tabs; preserve unrelated resources and drafts.

## Dispatch

Select and qualify the [preferred Pi/Herdr method](pi-herdr.md), or follow the owner's
explicit allowed mode, before allocating task-worker resources. Prepare the
[assignment](../templates/assignment.md) and [attempt record](../templates/attempt.md),
and establish [delivery](delivery.md).
Immediately before input, verify the exact native occupant, current directives, budget,
writer ownership and an empty human prompt. Ready metadata alone is insufficient when
an interactive UI or human draft is visible.

Persist dispatch intent first, then use native `agent prompt` once. For the installed
command shape, TARGET and TEXT precede options; preserve the complete prompt as one
argument. In the preferred method, the host background job runs `agent prompt --wait`
with a bounded completion timeout. Its job receipt and deferred native outcome are
separate; never submit again merely because startup evidence has not arrived yet.

For a separately authorized observation method needing a short synchronous startup
receipt, use this variant after replacing placeholders and verifying CLI support:

```sh
herdr agent prompt TARGET TEXT --wait --until working --until idle --until done --until blocked --timeout 10000
```

This requests a bounded **startup acknowledgment**, not a wait through the entire task.
Use the shorter remaining goal/attempt allowance when necessary. Retain the exact
command result, stdout/stderr and post-submission native activity. Do not claim startup
from successful byte delivery or a pre-existing idle state.

`agent prompt` is not an atomic compare-and-submit operation against the coordinator's
prior screen/identity inspection. Exclusive ownership remains necessary. If identity
changes, delivery is uncertain, or a command stalls/times out, inspect current native
state and output plus retained receipts before any retry. Never blindly replay input.
A rejected command can be recorded as not sent only when its evidence establishes that.

Do not run default `agent prompt --wait` or `agent wait` as a foreground completion
loop in Pi's builtin `bash`. The preferred host-owned background command is different:
it returns a job ID immediately and wakes Pi later. State-based waiting otherwise needs
a selected native delivery facility or an explicit owner-requested foreground exception.
Normal coordination yields.

## Inspect results and prompts

On a notification, check native identity/state and ID-matched output. `agent get` and
`agent read` are inspection, not acceptance. Use `recent-unwrapped` for retained text
when available and `visible` for an interactive screen; alternate-screen output may not
be recoverable merely by increasing the read window.

Require reports to identify assignment/attempt, affected paths, actual checks/results,
skips/unknowns and remaining work. Preserve them in authorized evidence paths. A truly
read-only worker uses native reporting, not an unapproved temporary-file fallback.
If a report is incomplete, recover available output first; any follow-up prompt is a
new bounded attempt, only after verified readiness.

Inspect every actual trust/question/permission UI before responding. Apply only the
owner's existing consent to its stated path/action; use supported navigation, read back
the selected choice, then confirm and verify readiness. Prefer session-only trust where
approved. Never generalize exact-folder consent to parent/global trust, another prompt
or another user. Native auto-approval expands neither the goal nor release authority.
Unknown authority means ask when supervised or defer when unsupervised.

## Integration

Before integrating, verify the worker is quiescent and inspect source and destination
for unexpected changes. Preserve reports, checks and partial work. Use project-approved
merge/cherry-pick/patch procedures, never destructive resets, force pushes or silent
clobbering of local edits. Run affected checks against the integrated tree and record
its source snapshot. Only then release dependencies needing that integrated result.

Avoid parallel work with overlapping files or unstable interfaces when conflicts and
rework outweigh its benefit. A worker finishing its turn does not prove its descendants
or services have stopped, or that its changes have been accepted.

## Cleanup

On completion, cancellation or an agreed limit:

1. Stop new affected dispatch; preserve reports, partial work and the next owner/action.
2. Rediscover the caller and owned targets. Inspect current agent state, actual output
   and pane process information. Reconcile unfinished operations and shared services.
3. Use supported native interruption for owned work when authorized, then verify it
   settled. Do not claim a stop from a file change, observer cancellation or sent key.
4. Close only disposable, verified goal-owned panes. Close a tab only when every pane
   in it is verified disposable. Reuse alone does not grant closure authority. Preserve
   the coordinator, human drafts, unrelated resources, worktrees, branches and evidence.
5. Re-list to verify removal; stop owned [watches/check-ins](delivery.md#wind-down).
   Record retained resources with owner/next action and report cleanup failures honestly.

Uncertain identity or shared dependencies block that target's cleanup. Do not force-kill
processes or broaden scope to conceal a failure. No deadline or idle state implicitly
authorizes deletion or a fresh attempt.
