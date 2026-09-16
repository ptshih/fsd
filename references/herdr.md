# Native Herdr operations

Use Herdr only for authorized worker coordination. Require `HERDR_ENV=1`, but also
verify the live caller/server: the environment variable alone is not proof. Assume
Herdr's integration for each coding harness is installed. Consult `herdr --skill`,
`herdr --help` and command-group help for syntax. Never use bare `herdr` for discovery,
run integration setup, stop the server, or modify a managed harness integration.

## Identity and preparation

Discover the caller with `herdr pane current --current`, inspect actual agent IDs, and
check server/client compatibility as needed. Never infer ownership from focus, a pane
label or an old transcript. Record server/socket context, pane, tab, terminal, native
agent session, kind and canonical cwd. Reconcile after any occupant/session change.

Keep the coordinator in the ordinary conversation. Name only owned resources as useful,
and preserve focus.

### Name the coordinator

At goal start, name yourself so the owner can see which pane coordinates which goal.
Choose a goal slug of at most 12 characters matching `[a-z0-9-]`. Rename your own agent,
and rename your own tab only when it is dedicated to this goal (your pane is its only
pane); otherwise keep the owner's label. Record both names and the tab's prior label in
`goal.md`. Workers use the same slug: `fsd-SLUG-ROLE`. Agent names must match
`[a-z][a-z0-9_-]{0,31}` and be unique among live agents; renaming changes no focus or
layout.

<!-- fsd-example: herdr-coordinator-agent -->
```sh
herdr agent rename "$HERDR_PANE_ID" fsd-GOAL_SLUG
```

<!-- fsd-example: herdr-coordinator-tab -->
```sh
herdr tab rename "$HERDR_TAB_ID" "FSD GOAL_SLUG"
```

At close, restore the prior tab label if you changed it and clear or update the agent
name (`herdr agent rename "$HERDR_PANE_ID" --clear`); a finished goal's name on a live
pane misleads.

Use visible native workers in dedicated tabs as described below. Creating a worker does not authorize unrelated layout changes or closure of reused
resources. Native subagents and recursive spawning are not the FSD delegation route.

Verify effective executable/arguments, harness/model/effort, tools and approval mode.
Preserve the owner's selections. Recognized agent kind and launch flags alone do not
prove effective settings. An unavailable requirement blocks affected dispatch; disclose
only approved fallbacks after reconciling unfinished work.

Use one implementation writer per canonical cwd. Concurrent writers get separate Git
worktrees, with recorded branch/base, paths, dependencies and integration owner. Never
edit another worker's checkout or silently take over its partial work.

## Worker tabs

After establishing [native wakeup](delivery.md) and within the approved delegation envelope, create
**one new, goal-owned Herdr tab per worker**. Do not use `herdr pane split` or put new
workers into the coordinator's or an unrelated existing tab. This FSD topology takes
precedence over Herdr's generic sibling-pane default. Keep the user's focus unchanged.

Use the already-checked installed `herdr tab create --help` contract; rediscover it only
when version/behavior changes or evidence is missing. Replace placeholders below with
the verified workspace ID, approved canonical worker cwd and a useful worker label, quoting
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

Establish the [native wakeup facility](delivery.md) once per goal before allocating
task-worker resources. Prepare the [assignment](../templates/assignment.md) and
[attempt record](../templates/attempt.md) with filesystem report paths; arm any inbox
watch before input. Copy `revision` and the deadline from the current `goal.md` when the
packet is written; a retry or replacement packet must not inherit an earlier packet's
values. Immediately before input, verify the exact native occupant, current directives,
budget, writer ownership and an empty human prompt. Ready metadata alone is insufficient
when an interactive UI or human draft is visible.

The launch sequence for one worker, after its tab exists, uses these checked commands.
Replace placeholders. `LAUNCH_ARGS` are the role file's `launch_args` for that harness
with `ROLE_FILE` resolved, plus the approved model and approval flags; omit the trailing
`--` when there are none. `PACKET_TEXT` is the complete prompt as one shell argument.

<!-- fsd-example: herdr-worker-start -->
```sh
herdr agent start WORKER_NAME --kind HARNESS --pane ROOT_PANE_ID --timeout 30000 -- LAUNCH_ARGS
```

If `agent start` returns `agent_not_ready`, the pane is at a startup dialog such as
workspace trust: inspect it, handle only the exact prompt covered by owner consent, then
wait for `idle` (not `blocked`) before continuing.

Then verify the effective launch, not the typed one: `herdr pane process-info --pane
ROOT_PANE_ID` shows the real argv including anything the pane's interactive shell injected
(a shell alias can silently add flags such as `--dangerously-skip-permissions`, which
overrides `--permission-mode plan`), and the harness footer shows the required mode. Under
Claude Code, cycle modes with `agent send-keys WORKER_NAME shift+tab` and read the footer
back until it matches. Then inspect the pane (`herdr agent read WORKER_NAME --source
visible`) for an empty prompt and no trust or permission dialog. Persist dispatch intent,
then submit through native `agent prompt` exactly once. TARGET and TEXT precede options:

```sh
herdr agent prompt TARGET TEXT --wait --until working --until idle --until done --until blocked --timeout 10000
```

This requests a bounded **startup acknowledgment**, not a wait through the entire task.
Use the shorter remaining goal/attempt allowance when necessary. Retain the exact
command result, stdout/stderr and post-submission native activity. Do not claim startup
from successful byte delivery or a pre-existing idle state.

Immediately after the receipt, arm the worker's settled-state wait through the host's
background facility, with a timeout inside the remaining goal allowance:

<!-- fsd-example: herdr-worker-wait -->
```sh
herdr agent wait WORKER_NAME --timeout REMAINING_MS
```

Its exit is the wake: `idle`/`done` means inspect the inbox and pane, `blocked` means a
dialog needs owner-consented handling, `timeout` means reconcile and renew. Record the
background task handle in the attempt.

`agent prompt` is not an atomic compare-and-submit operation against the coordinator's
prior screen/identity inspection. Exclusive ownership remains necessary. If identity
changes, delivery is uncertain, or a command stalls/times out, inspect current native
state and output plus retained receipts before any retry. Never blindly replay input.
A rejected command can be recorded as not sent only when its evidence establishes that.

Do not run default `agent prompt --wait` or `agent wait` as a task-completion wait in
the model turn, wrap them in a custom controller, or poll until completion. `agent wait`
belongs only inside the host's already-available background facility, which turns its
exit into a native notification. After the short startup receipt, work independently or
yield to the already-armed native wakeup facility.

## Inspect results and prompts

On a notification, check native identity/state and ID-matched output. `agent get` and
`agent read` are inspection, not acceptance. Use `recent-unwrapped` for retained text
when available and `visible` for an interactive screen; alternate-screen output may not
be recoverable merely by increasing the read window.

Treat status as a hint, not an input/cleanup gate by itself:

| Observation | Required action |
| --- | --- |
| `idle`/`done` with a trust, question or permission dialog | Do not submit work; handle only the exact prompt covered by owner consent. |
| `idle`/`done` with a spinner or active tool | Work is not settled; do not resend, integrate or close it as completed. |
| `working` with a visible trust, question or permission dialog | Treat as blocked, not progressing; resolve only within owner consent, never just wait it out. |
| Final report or response but conflicting native state/UI | Inspect actual output and owned processes; retain uncertainty until settlement is verified. |

Inspect at startup, immediately before input, on wakeups/bounded check-ins, and before
cleanup—not in a polling loop. If the UI is unavailable or ambiguous, preserve that
uncertainty instead of inferring readiness. Retain concise observable UI facts, selected
choices and receipts, not worker deliberation text or full transcripts.

Require reports to identify assignment/attempt, affected paths, actual checks/results,
skips/unknowns and remaining work. Preserve them in authorized evidence paths. A truly
read-only worker uses native reporting, not an unapproved temporary-file fallback.
If a report is incomplete, recover available output first; any follow-up prompt is a
new bounded attempt, only after verified readiness. A reply to a worker's `question`
message is likewise a new attempt on the same assignment: persist intent, prompt once,
then re-arm that worker's settled-state wait.

Inspect every actual trust/question/permission UI before responding. Apply only the
owner's existing consent to its stated path/action; use supported navigation, read back
the selected choice, then confirm and verify readiness.
After answering a dialog, wait for `working` or `idle` only; a first wait that includes
`blocked` matches the stale pre-answer state immediately. Prefer session-only trust where
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
   Capture any native report to evidence first with `agent read --source recent-unwrapped`;
   exiting the harness or closing the pane discards it.
2. Rediscover the caller and owned targets. Inspect current agent state, actual output
   and pane process information. Reconcile unfinished operations and shared services.
3. Use supported native interruption for owned work when authorized, then verify it
   settled. Do not claim a stop from a file change, observer cancellation or sent key.
   Exit the harness with its native key sequence before closing a pane (Claude Code:
   `agent send-keys ctrl+c` twice; Pi: `ctrl+d`; a `/exit` sent through `agent prompt`
   did not exit Claude Code)
   and verify `pane process-info` shows the shell.
4. Close only disposable, verified goal-owned panes. Close a tab only when every pane
   in it is verified disposable. Reuse alone does not grant closure authority. Preserve
   the coordinator, human drafts, unrelated resources, worktrees, branches and evidence.
5. Re-list to verify removal; stop owned [watches/check-ins](delivery.md#wind-down).
   Record retained resources with owner/next action and report cleanup failures honestly.

Uncertain identity or shared dependencies block that target's cleanup. Do not force-kill
processes or broaden scope to conceal a failure. No deadline or idle state implicitly
authorizes deletion or a fresh attempt.
