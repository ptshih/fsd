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

Use visible native workers in dedicated tabs as described below. Creating a worker does
not authorize unrelated layout changes or closure of reused resources. Native subagents
and recursive spawning are not the FSD delegation route.

Verify effective executable/arguments, harness/model/effort, tools and approval mode.
Preserve the owner's selections. Recognized agent kind and launch flags alone do not
prove effective settings. An unavailable requirement blocks affected dispatch; disclose
only approved fallbacks after reconciling unfinished work, and confirm the changed
roster before launching them ([roster confirmation](setup.md#confirm-the-roster)).

Use one implementation writer per canonical cwd. Concurrent writers get separate Git
worktrees, with recorded branch/base, paths, dependencies and integration owner. Never
edit another worker's checkout or silently take over its partial work.

## Worktree workspaces

When the approved assignment needs an isolated checkout, prefer Herdr's native
`worktree` commands. Obtain [roster confirmation](setup.md#confirm-the-roster) and
establish the [observation mode](delivery.md) before allocating worker resources.
Check the installed `herdr worktree --help` and relevant subcommand
help, plus server compatibility, once while preparing the goal. The
[CLI reference](https://herdr.dev/docs/cli-reference/#worktrees) and
[response schema](https://github.com/herdrdev/herdr/blob/master/src/api/schema/response.rs)
describe the native contract.

Inspect `herdr worktree list --workspace SOURCE_WORKSPACE_ID` and Git state before
allocating. Use an explicit verified source workspace, an approved absolute checkout
path, a fresh branch name and a resolved base commit. Herdr checks out an existing
branch when its name already exists; do not mistake that for a fresh branch from the
requested base. Uncommitted source changes are not copied into a new checkout.
Replace each placeholder as one quoted shell argument:

<!-- fsd-example: herdr-worktree-create -->
```sh
herdr worktree create --workspace SOURCE_WORKSPACE_ID --branch WORKER_BRANCH --base BASE_COMMIT --path WORKER_CWD --label "[FSD] WORKER_LABEL" --no-focus
```

Creation returns a linked workspace and its first tab and root pane. Record
`.result.workspace.workspace_id`, `.result.tab.tab_id`,
`.result.root_pane.pane_id` and `.result.worktree.path`; verify the actual checkout's
canonical path, branch and base. Use this newly created tab for the worker instead of
creating a second tab. Verify its label and, if needed, rename that owned tab with
`herdr tab rename TAB_ID "[FSD] WORKER_LABEL"`. Continue with the root-pane checks
under [worker tabs](#worker-tabs).

For an existing approved checkout, open it without changing focus:

<!-- fsd-example: herdr-worktree-open -->
```sh
herdr worktree open --workspace SOURCE_WORKSPACE_ID --path WORKER_CWD --no-focus
```

Check `.result.already_open`. When false, the returned workspace, tab and pane are
new; use the same verification and naming steps as creation. When true, those resources
already existed: create a fresh worker tab in the returned workspace using the checkout
path. Never adopt its existing agent or rename its existing tab for a new roster.
An existing checkout still needs verified writer ownership; opening it grants none.

Record source and child workspace IDs, checkout path, branch/base, and which resources
this goal created in [state](../templates/state.md). After an uncertain result, reconcile
the native worktree list and Git state before retrying. If native worktree commands are
unavailable, use project-approved Git worktree setup and the fresh-tab route below after
reconciling any partial creation. Do not upgrade Herdr or put concurrent writers in one
checkout to work around the gap. Use `--trust-repository` only with existing owner
consent for the verified repository, never as an automatic retry.

## Worker tabs

Never reuse, adopt or rename an existing Herdr agent or native agent session into a new
roster, even when it is idle or came from an earlier roster for the same goal. A
follow-up attempt to a current roster member is not a new roster launch; use the
existing attempt rules under [dispatch](#dispatch). Reuse valid setup evidence, not
worker agents or sessions.

After establishing [native wakeup](delivery.md) or [Codex active-turn observation](codex.md),
and obtaining [roster confirmation](setup.md#confirm-the-roster) within the approved
delegation envelope, create
**one new, goal-owned Herdr tab per worker**. Do not use `herdr pane split` or put new
workers into the coordinator's or an unrelated existing tab. This FSD topology takes
precedence over Herdr's generic sibling-pane default. Prefix every worker tab label with
`[FSD]`, and keep its native agent name in the `fsd-SLUG-ROLE` form because brackets are
not valid in agent names. Keep the user's focus unchanged.

A tab freshly returned by worktree creation or by `worktree open` with
`already_open: false` satisfies this requirement. Use `tab create` only when a fresh
worker tab has not already been allocated.

Use the already-checked installed `herdr tab create --help` contract; rediscover it only
when version/behavior changes or evidence is missing. Replace placeholders below with
the verified workspace ID, approved canonical worker cwd and a useful worker label, quoting
each replacement as one shell argument. For a Herdr-managed worktree, use its returned
workspace ID. Otherwise use the coordinator's workspace unless the owner selected
another. A linked worktree workspace is part of checkout isolation; do not create an
unrelated workspace merely to launch a worker.

<!-- fsd-example: herdr-worker-tab -->
```sh
herdr tab create --workspace WORKSPACE_ID --cwd WORKER_CWD --label "[FSD] WORKER_LABEL" --no-focus
```

Retain the returned `.result.tab.tab_id` and `.result.root_pane.pane_id`; verify the new
tab has only its root pane and the intended cwd. Start the approved agent in that root
pane after verifying its empty shell prompt. Herdr's pane ID is still the native target:
`agent start --pane` targets that tab's root pane; it does not create a split.
Record both IDs in the assignment. If tab creation fails or is unavailable, reconcile
any created resources and pause only affected delegation. Do not fall back to split panes.
Follow [cleanup](#cleanup) for these owned tabs; preserve unrelated resources and drafts.

## Dispatch

Check that the assignment still matches the owner's [confirmed roster](setup.md#confirm-the-roster).
An unconfirmed change blocks the affected launch or submission.
Establish the [selected observation mode](delivery.md) once per goal before allocating
task-worker resources. Prepare the [assignment](../templates/assignment.md) and
[attempt record](../templates/attempt.md) with filesystem report paths; arm any inbox
watch before input. Copy `revision` and the deadline from the current `goal.md` when the
packet is written; a retry or replacement packet must not inherit an earlier packet's
values. Fields known only at dispatch (pane, tab, terminal, native session, base commit)
keep the template's `REPLACE` placeholders in a packet written ahead of time; resolve
them in one pass — the binding from `pane get`/`agent get` output, the base commit from
the worker's checkout — and assert no placeholder remains before input. Immediately
before input, verify the exact native occupant, current directives (the packet's
`revision` and `deadline` still match `goal.md`; otherwise rewrite the packet), budget,
writer ownership and an empty human prompt. Ready metadata alone is insufficient when an
interactive UI or human draft is visible.

The launch sequence for one worker, after its tab exists, uses these checked commands.
Replace placeholders. `LAUNCH_ARGS` are the role file's `launch_args` for that harness
with `ROLE_FILE` resolved, plus the approved model and approval flags; omit the trailing
`--` when there are none. A harness absent from `launch_args` gets only the approved
model and approval flags, with the role file first in the packet's read list
([setup](setup.md#role-files)). `TEXT` is the complete packet as one shell argument;
`HARNESS` is the packet's `worker_kind`.

<!-- fsd-example: herdr-worker-start -->
```sh
herdr agent start WORKER_NAME --kind HARNESS --pane ROOT_PANE_ID --timeout 30000 -- LAUNCH_ARGS
```

If `agent start` returns `agent_not_ready`, the pane is at a startup dialog such as
workspace trust: inspect it, handle only the exact prompt covered by owner consent, then
wait for `idle` (not `blocked`) before continuing. Read the dialog's default before
answering and move to the consented choice by reading the selection back, never by a
fixed key count: Claude Code's folder-trust dialog has started on "No, exit" and
Antigravity's on "Yes" (both observed 2026-09-17), so send `enter` only once the
read-back shows the consented choice. `agent start` can also return
`agent_started`/`idle` while such a dialog is showing (observed with Codex), so read the
visible screen before any input regardless of the reported status.

Many owners alias `claude` to add `--dangerously-skip-permissions`. That suits writer
roles under a yolo approval policy, but it overrides `--permission-mode plan`, so start a
hardened Claude worker with the alias bypassed: run the real binary through the pane, wait
for readiness, then name it. Herdr recognizes the agent by pane, and `agent` commands
accept the pane ID until the name is set.

<!-- fsd-example: herdr-worker-start-command -->
```sh
herdr pane run ROOT_PANE_ID "command claude LAUNCH_ARGS"
```

```sh
herdr agent wait ROOT_PANE_ID --until idle --until blocked --timeout 30000
herdr agent rename ROOT_PANE_ID WORKER_NAME
```

Then verify the effective launch, not the typed one: `herdr pane process-info --pane
ROOT_PANE_ID` shows the real argv including anything the pane's shell added, and the
harness footer shows the required mode. If a Claude Code footer still shows the wrong
mode, cycle with `agent send-keys WORKER_NAME shift+tab` and read the footer back until
it matches. Then inspect the pane (`herdr agent read WORKER_NAME --source
visible`) for an empty prompt and no trust or permission dialog. Persist dispatch intent,
then submit through native `agent prompt` exactly once. TARGET and TEXT precede options.
The submission writes its own receipt under the goal's `evidence/` — stdout to
`ATTEMPT_ID.receipt.json`, stderr and the exit status to `ATTEMPT_ID.receipt.err` —
because the coordinator's tool result can be lost to an interrupt or owner steering
mid-call. Replace `GOAL_DIR` and `ATTEMPT_ID` inside the quotes. An existing receipt is
refused without submitting (non-zero exit, nothing written), so a retained receipt is
never overwritten and a re-prompt is a new attempt with its own files; otherwise the
exit status is Herdr's own:

<!-- fsd-example: dispatch-receipt -->
```sh
( umask 077; set -C; r="GOAL_DIR/evidence/ATTEMPT_ID.receipt"; test ! -e "$r.err" && { herdr agent prompt TARGET TEXT --wait --until working --until idle --until done --until blocked --timeout 10000; s=$?; echo "exit $s" >&2; exit $s; } > "$r.json" 2> "$r.err" )
```

This requests a bounded **startup acknowledgment**, not a wait through the entire task.
Use the shorter remaining goal/attempt allowance when necessary. Read both receipt files
back and record their paths in the attempt record; classify `observing`, `not-sent` or
`uncertain` from their contents and post-submission native activity, not from the tool
result alone. Empty or exit-less receipt files (a kill during the wait) mean `uncertain`,
never `not-sent`: the prompt may already have landed. Do not claim startup from
successful byte delivery or a pre-existing idle state.

Immediately after the receipt, arm the worker's settled-state wait through the host's
background facility, or through the [Codex terminal tools](codex.md#dispatch-and-collect)
for a Codex coordinator. Keep the timeout inside the remaining goal allowance:

<!-- fsd-example: herdr-worker-wait -->
```sh
herdr agent wait WORKER_NAME --timeout REMAINING_MS
```

Its exit is the wake (or the collected Codex tool result): `idle`/`done` means inspect the
inbox and pane, `blocked` means a dialog needs owner-consented handling, `timeout` means
reconcile and renew. Record the background task handle or Codex shell `session_id` in
the attempt. On a harness whose wait is [not qualified](delivery.md#two-wake-sources),
also arm the inbox observation, or inspect visible output on each wake or collected tool
result for a native reporter, recording any second handle.

`agent prompt` is not an atomic compare-and-submit operation against the coordinator's
prior screen/identity inspection. Exclusive ownership remains necessary. If identity
changes, delivery is uncertain, or a command stalls/times out, inspect current native
state and output plus retained receipts before any retry. Never blindly replay input.
A rejected command can be recorded as not sent only when its evidence establishes that.

In native-wakeup mode, do not run default `agent prompt --wait` or `agent wait` as a
task-completion wait in the model turn, wrap them in a custom controller, or poll until
completion. `agent wait`
belongs only inside the host's already-available background facility, which turns its
exit into a native notification. After the short startup receipt, work independently or
yield to the already-armed native wakeup facility. The default
[Codex active-turn mode](codex.md) collects bounded waits and keeps the turn open.

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
| Settled within seconds of submission and the screen shows a provider refusal (`reached your … limit`, `/usage-credits`, `credentials_not_configured`, an auth or quota error) | No work happened: capture the screen, record the attempt `not-started` ([uncounted](filesystem.md#dispatch-intent-before-input)), reconcile, and propose the role's approved fallback. Wait for [confirmation of the changed roster](setup.md#confirm-the-roster) before switching; without a fallback, ask. Do not resubmit the refused selection without owner steering. |

Inspect at startup, immediately before input, on wakeups/bounded check-ins, and before
cleanup—not in a polling loop. If the UI is unavailable or ambiguous, preserve that
uncertainty instead of inferring readiness. Retain concise observable UI facts, selected
choices and receipts, not worker deliberation text or full transcripts. Concretely: before
dispatch keep the single footer line that shows the effective model, thinking level and
permission mode; for a native report keep the text from its identity header to its verdict
or final line; capture anything wider only when diagnosing a defect.

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
   Exit the harness with its native key sequence before closing a pane (Claude Code and
   Codex: `agent send-keys TARGET ctrl+c ctrl+c`, both presses in one call, because
   Claude Code only exits on a second ctrl+c inside its short confirmation window and
   two presses sent as separate commands did not exit it; Pi: `ctrl+d`; a `/exit` sent
   through `agent prompt` did not exit Claude Code)
   and verify `pane process-info` shows the shell.
4. Close only disposable, verified goal-owned panes. Close a tab only when every pane
   in it is verified disposable. Reuse alone does not grant closure authority. Preserve
   the coordinator, human drafts, unrelated resources, worktrees, branches and evidence.
   If checkout deletion is explicitly authorized, follow the worktree procedure below
   before closing the child workspace's last tab.
5. Re-list to verify removal; stop owned [watches/check-ins](delivery.md#wind-down).
   Record retained resources with owner/next action and report cleanup failures honestly.

Closing a worktree workspace, including its last tab, closes Herdr state without deleting
the checkout or branch. Retain those by default. Never use `workspace close --group`
to bypass a parent-workspace close refusal; it also closes linked workspaces.

Only when checkout deletion is explicitly authorized, after preserving required work
and verifying every pane in the owned child workspace is disposable, use
`herdr worktree remove --workspace CHILD_WORKSPACE_ID` while that workspace is still
open. This removes the checkout and closes its linked workspace but leaves the branch.
Do not add `--force` when Git refuses removal; retain the resource and report the reason.
Verify both Herdr and Git state afterward. Closing workers never implies permission
to delete their checkouts or branches.

Uncertain identity or shared dependencies block that target's cleanup. Do not force-kill
processes or broaden scope to conceal a failure. No deadline or idle state implicitly
authorizes deletion or a fresh attempt.
