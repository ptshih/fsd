# Herdr

This is the worker-operation reference, not a requirement to delegate every task.
Require `HERDR_ENV=1` before inspection/control; the variable alone does not prove a
live session. Use installed `herdr --skill` and relevant CLI help when needed. Do not
invent commands or substitute another delegation route.

## Coordinator identity

When first using Herdr for an approved FSD mission—not merely reading/editing the
skill—discover the caller with `herdr pane current --current`, its tab ID, and existing
agent names. Never infer ownership from UI focus. Name only your own tab and agent with
supported `herdr tab rename` and `herdr agent rename`, then verify the resulting names.
Use owner-specified names or readable defaults such as `FSD <project> Coordinator` and
a unique CLI-valid `fsd-<project>-coordinator`. Preserve focus. Reuse appropriate names
on resume rather than renaming repeatedly; record them in mission continuity. Naming
is not mission approval. A direct-only task need not perform worker setup or relabel
the ordinary conversation.

## Assign and collect

- Discover actual IDs with `herdr agent list`; check `herdr status` for compatibility
  when needed. Old IDs/labels are not proof of ownership or settings. Rediscover after
  reconnect, restart, or occupant change and reconcile with continuity before dispatch.
- Reuse suitable available agents, or launch for approved assignments. Routine additions
  and replacements are covered by the mission's operating envelope unless it says
  otherwise; model/role defaults alone are not a budget or permission to exceed it.
  Use separate visible **tabs**, preserve coordinator focus, and keep native workers
  individually accessible. Use supported `herdr agent start` and verified native flags.
- Verify effective executable/arguments, harness/model/effort, tools, and approval mode
  using native session/settings evidence at setup and after relevant changes. Herdr's
  recognized kind, launch request, or lifecycle hook does not prove all those settings.
  Record verified settings and unknowns; pause affected dispatch for an unverifiable
  required setting. Preserve mission choices and only use approved, disclosed fallbacks.
  Follow [native approvals and trust](#native-approvals-and-trust).
- Give assignments short mission-local IDs (`A1`, `A2`, …), an outcome, owned
  cwd/worktree/paths, writer/read-only role, checks, and report expectation. Keep the ID
  on follow-ups; link replacement assignments to their predecessors. Every actual
  submission has a distinct attempt identity. Reconcile uncertain delivery and partial
  effects before replacing work or transferring its implementation to the coordinator.
- Require a concise text report: assignment ID; `complete`, `incomplete`, or `blocked`;
  work/affected paths or review findings; checks actually run and exits/results;
  skips/unknowns; and remaining work/blockers. A `complete` report requests acceptance,
  not automatic acceptance. Keep one implementation writer per cwd, including the
  coordinator; use separate worktrees for concurrent writers and verify dependencies.

## Worktrees and integration

Use a separate worktree for each concurrent implementation writer. Record its canonical
path, branch/base revision, owned paths, dependencies, and who will integrate the result.
Workers edit only their assigned tree—not the coordinator's checkout or another worker's
branch—and return affected paths, commits or patches, and checks. Narrow handoffs include
only the needed goal, constraints, entry points, dependency contracts, and evidence paths;
let workers gather task-specific context rather than copying the full coordinator history.

Designate one integration writer for the destination checkout, normally the coordinator.
Before integration, verify the worker is quiescent, preserve its report and partial work,
and inspect both source and destination for unexpected changes. Follow project instructions
for merge/cherry-pick/patch application; no destructive reset, force push, or silently
clobbered local edits. Resolve conflicts deliberately, then re-run affected checks on the
integrated tree: passing worker-branch tests does not prove that the combined result works.

Avoid parallel tasks with overlapping files or unstable shared interfaces when conflict
and rework would outweigh the benefit. Hand off a verified dependency before building on
it. Do not delete worktrees/branches as part of Herdr pane cleanup; retain them until the
result and evidence are integrated or an explicit disposition authorizes removal.

## Dispatch, yield, inspect

Follow the [async operating policy](async-coordination.md). Automatic observation must
be established before submission. Use an installed, verified combined dispatch operation
if available; the [v3 runtime source](../runtime/README.md) must first be explicitly
installed and live-qualified. With an observation-only adapter, follow its actual
registration/receipt protocol and the native dispatch procedure below. Source files
or the [design contract](runtime-contract.md) do not make a tool available.

- Prompt only a verified owned agent ready for input with no human draft. Resolve prior
  work first. Repairs/report requests may retain the assignment ID but require a new
  submission attempt; old reports/events cannot satisfy a newer dispatch.
- Use a short foreground startup acknowledgment, capped by remaining mission time.
  The inspected CLI supports:

  ```sh
  herdr agent prompt <target> "<assignment>" \
    --wait --until working --until done --until idle --until blocked \
    --timeout 10000
  ```

  Verify installed semantics. Herdr's post-submission activity check must establish
  that this submission started; old idle state or a successful input write is not
  proof. Settled states account for fast completion and blockers. Retain native
  receipts as required by the installed adapter, without reconstructing evidence.
- After acknowledgment, do independent authorized work or yield. Do not chain completion
  waits, sleep loops, or status polling in the model. Foreground completion waiting is
  an explicit owner-requested exception, never a fallback for missing delivery.
- On an event or approved manual resumption, inspect `herdr agent get <target>` and
  ID-matched output. Use `recent-unwrapped` when idle; use `visible` for working agents
  whose alternate-screen history cannot be scrolled. Inspect artifacts/checks before
  acceptance. If still working, retain/reconcile observation and yield.
- Startup timeout, `agent_prompt_stalled`, transport error, or `unknown` proves neither
  completion nor nondelivery. Record uncertainty and make a bounded identity/output
  inspection. Confirmed activity means observe the existing attempt, not resend it.
  If ready but delivery is unclear, an ID-specific status question must itself follow
  the dispatch protocol and must not request another implementation pass. Resubmit
  only after proving nondelivery or reconciling partial work into an authorized
  replacement. Persistent uncertainty blocks affected dispatch; do not force receipt,
  switch routes, or reset limits.

## Native approvals and trust

Use the saved native YOLO/auto-approval preference and normal harness tools for execution
agents, including Reviewer/Judge. Do not invent restrictive allowlists, shell bans, or
permission checkpoints absent project/owner requirements. A wrapper selecting YOLO over
a requested approval-mode flag is not by itself a blocker or reason to relaunch or ask
again. Record the effective mode and verify required tools/guards. Read-only roles stay
read-only. Native auto-approval grants no extra task authority and never permits evading
an actual guard denial, release limit, or required human authorization.

For a real blocked state or native approval UI, inspect the actual prompt. The saved
`startupPromptApprovals.projectTrust` is standing owner consent in both supervision
modes for listed harnesses in verified mission-owned workspaces of an authorized mission:

1. Verify the live owned agent and that the displayed canonical path equals its
   authorized workspace. A conflicting project/mission guard takes precedence.
2. Prefer session-only trust. Where unavailable, the policy permits persistent
   exact-folder trust, including AGY's **Yes, I trust this folder**. The stricter
   `piProjectTrust` policy permits only **Trust (this session only)** for Pi, never
   permanent Pi trust.
3. Use supported `herdr agent send-keys` navigation, read back the selected option,
   then confirm and verify readiness. If the prompt already cleared, send no approval
   keystroke. Record path, choice, and consent basis; no repeated owner confirmation
   is needed for covered prompts.

This accepts the native prompt and its stated project-resource loading consequences,
not a disabled trust check or expanded assignment. Never extend consent to parent/global
trust, unrelated/unverified paths, another approval prompt, manually edited trust
configuration, or a previously denied action. If identity/choice/authority is unclear,
ask in supervised mode or defer in unsupervised mode. Continue only independent
allowed work while blocked; a successful wait must not hide a real approval prompt.

## Recover incomplete reports

Increase the read window/use supported history first. If needed, request only the
missing ID-matched report once the worker is verified ready, not another implementation
pass. While it is working, yield. Ask for concise text or short numbered chunks, reading
each before requesting the next. Bound recovery by remaining limits and mark unrecovered
evidence incomplete.

Read-only workers return text and never write report files. The coordinator may retain
it in the recorded mission `reports/`. A temporary-report-file fallback is allowed only
for an already write-authorized worker with an explicitly assigned private report path,
Git-ignored inside a repository and distinct from coordinator-owned files. Do not broaden
a read-only role for this fallback or keep the only needed evidence in `scratch/`.

## Preserve ownership

Never overwrite human drafts, send reports into human-used inputs, interrupt busy
agents to force receipt, or promote a read-only helper into a writer. Explicitly
requested pause/cancel/steering uses supported owned controls and verified handoffs,
not forced input. Model/tool settings are not OS isolation or hard spending guarantees.

On a tool/transport/ownership failure, stop affected dispatch, preserve evidence, and
reconcile. Continue independent authorized work only. Before reset, retirement, ownership
transfer, or an approved model fallback, reconcile unfinished work and service dependencies,
preserve a handoff, verify quiescence, and rediscover the resulting identity. Never reset
or retire the coordinator, unrelated agents, or shared services.

## Prune finished workers

Cleanup is part of delivery, cancellation, and wind-down. Prune once accepted work and
necessary follow-ups finish; idle/done alone is not permission. Retain workers only for
explicitly planned reuse or an owner-directed handoff, not hypothetical future usefulness.
Routine cleanup of disposable mission-owned workers needs no separate confirmation.

1. Retain reports, acceptance/check evidence, and partial-work handoffs in the recorded
   mission directory. Preserve code, worktrees, and continuity; pruning does not authorize
   their deletion. Cancellation remains interrupted, not completed.
2. Rediscover the caller with `herdr pane current --current` and reconcile live targets
   against mission ownership. Inspect output and `herdr pane process-info --pane <pane_id>`
   for unfinished operations or services. Settle work first; interrupt only owned work
   through supported controls and verify it stopped. Uncertain identity, human drafts,
   or shared dependencies block that target's cleanup.
3. Close disposable panes with `herdr pane close <pane_id>`. Use `herdr tab close <tab_id>`
   only if every pane in that tab is verified disposable. Targets must be created for
   the mission or explicitly authorized for closure; reusing an existing agent does not
   grant pane/tab ownership. Preserve focus and the coordinator conversation. Do not
   close unrelated/shared resources, entire workspaces/sessions, or the Herdr server.
4. Re-list agents/panes/tabs to verify removal. Record removed IDs, retained resources
   with reason/owner/next action, and failures in continuity. Do not force-kill processes
   or broaden closure scope to conceal a failure. Retire relevant adapter observations
   and preserve their evidence; late events cannot revive retired work.

Check installed help if syntax differs. Do not invent an `agent prune` command or confuse
clearing lifecycle metadata with terminating an agent.
