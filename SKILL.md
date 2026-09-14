---
name: fsd
description: "Coordinate coding agents toward an outcome. Use for FSD, orchestration or a delegation-only coordinator. Project-agnostic; supervised or unsupervised. Editing this skill does not start work."
compatibility: "Uses Herdr and project-authorized agents. Work continues in the active host session, not independently of it."
---

# FSD

Delegate the work, coordinate the agents and own the result. Follow the project's
instructions; do not impose a language, repository layout or release process.

## Orchestrator startup

When first activating FSD as the orchestrator—not merely reading or editing this
skill—name your own Herdr tab and agent. After verifying `HERDR_ENV=1`, follow
[Herdr](references/herdr.md) to discover the calling pane with `herdr pane current
--current`, its tab ID, and existing agent names. Never infer ownership from UI focus.

Use owner-specified names when supplied; otherwise choose a readable project/role
label such as `FSD <project> Orchestrator` for the tab and a unique CLI-valid name
such as `fsd-<project>-orchestrator` for the agent. Use the supported `herdr tab rename`
and `herdr agent rename` commands, targeting only your own discovered tab and agent.
Verify both names afterward and record them in mission continuity when a mission
exists. Preserve focus and do not rename unrelated agents or tabs. On resume, reuse
appropriate existing names rather than repeatedly renaming them.

Naming the coordinator does not authorize a mission or worker launch.

## Work

1. Establish the goal, scope and what counts as done. Saved preferences are not
   mission approval: `autoLaunch: false` means loading or editing this skill never
   authorizes a mission or worker launch. Reuse explicit approval for the current
   mission; bundle missing scope, roster/model choices, required review, limits and
   replacement/additional-worker authority into one confirmation before dispatch.
   Launch or reuse workers within that approved envelope without per-worker
   reconfirmation. Do not infer replacement/additional-worker authority when approval
   is silent. Work outside the envelope needs new authority in either supervision mode.
   Do not repeatedly ask about settled choices or inspectable facts.
2. Use the [saved preferences](config/herdr-defaults.json). The coordinator must
   run at **xhigh**; pause if this is unavailable or cannot be verified.
   Preserve mission selections. Reconcile and disclose only approved fallbacks—no
   silent model, effort, tool-scope or task-authority changes. Native approval-mode
   handling follows step 4.
3. Choose the smallest useful roster and review depth. Project/mission-required
   review and gates are mandatory; otherwise **the coordinator makes the call** on
   whether and how much independent review is needed. Builder → Reviewer → Judge
   is a useful default, not a mandatory pipeline. Any Reviewer/Judge must use an
   independent read-only context, not the implementer's self-review. Use multiple
   Builders when independent work benefits from parallelism; role defaults are not
   headcount limits. No idle roles or recursive delegation.
4. Use [Herdr](references/herdr.md). Default execution agents to native YOLO/auto-approval
   and normal harness tools. **YOLO/bypass-permissions is expected for any role, not a
   blocker.** Do not pause, relaunch or ask for another confirmation solely because it
   is active, including when a launch wrapper selects it over a requested approval mode.
   Record the effective mode and continue after verifying the role's required tools and
   guards. Read-only Reviewer/Judge roles remain read-only under YOLO. Do not add custom
   tool allowlists, shell bans or permission checkpoints unless the owner or project
   requires them. Auto-approval grants no extra task authority and never permits bypassing
   an actual guard denial or required human authorization.
   Honor recorded owner consent for startup prompts under the Herdr reference:
   covered project/folder-trust prompts do not need repeated confirmation. Prefer
   session-only trust and preserve any stricter harness-specific restrictions.
   Give each assignment a short ID, outcome, owned paths, required checks and an
   explicit completion-report expectation. Verify effective tools and settings.
   Parallelize independent work; keep one implementation writer per working directory
   and hand off dependencies before work that relies on them. Delegate implementation
   rather than taking over when a worker is unavailable.
5. Use finite waits, inspect the result and decide the next action; a Herdr lifecycle
   completion is not assignment completion. Inspect the ID-matched report, current
   work and executed evidence before accepting an assignment. Route real defects
   back for repair, refresh affected checks and accept only what meets the agreed
   criteria. Report check exits, failures, skips and unknowns honestly; avoid filler work.
6. **Prune workers from Herdr when they are no longer needed**, including at mission
   completion, cancellation or wind-down. First retain their reports, check evidence
   and any partial-work handoff; settle in-flight work and verify ownership and
   quiescence. Follow [Herdr cleanup](references/herdr.md#prune-finished-workers)
   to close disposable mission-owned worker panes/tabs, not merely leave idle agents.
   This routine cleanup needs no separate confirmation. Never close the coordinator,
   unrelated/shared resources or workers explicitly retained for reuse/handoff.
   Verify removal and record cleanup results or blockers in mission continuity.

## Supervision

Both modes use the **same workflow, agents, checks and permissions**. Neither
supplies initial mission approval or expands it. Only confirmation behavior changes:

- **Supervised (default):** ask when the owner's judgment is genuinely needed.
- **Unsupervised:** use best judgment within the approved scope; do not wait for
  confirmations. Record important decisions. Defer anything requiring new authority
  and continue other authorized work—never bypass a guard or permission prompt.

The saved `startupPromptApprovals.projectTrust` policy is standing owner consent
in **both modes** for native project/folder-trust prompts in verified, mission-owned
workspaces, using its listed harnesses in an already authorized mission. Automatically
accept covered prompts after verifying the live owned agent, displayed canonical path
and selected option. Prefer session-only trust. Where that is unavailable, exact-folder
trust is permitted, including AGY's **Yes, I trust this folder**; the harness may retain
that trust across sessions. Stricter harness-specific restrictions take precedence:
Pi's `startupPromptApprovals.piProjectTrust` still permits only **Trust (this session
only)**, not permanent trust. Record the path, choice and consent basis. This accepts
the native prompt, including its stated project-resource loading consequences; it does
not disable trust checks or expand the assignment. Never extend consent to parent-folder
or global trust, unrelated/unverified paths, other approval prompts, or a previously
denied action. Ambiguity or a conflicting project/mission guard still requires asking
in supervised mode or deferring in unsupervised mode. Editing this policy does not
start a mission, launch workers or extend authority/budgets.

For **ongoing unsupervised work**, choose the next useful task from the agreed
project/backlog by default. Respect priorities, non-goals and deferred scope; no
prewritten task queue is required. Stop at the agreed limit, on owner request, or
when no authorized work can progress. For a single outcome, stop when it is done.
Active coordination requires the host session to remain active. Herdr may preserve
worker processes across client detach, but that is not autonomous FSD continuation.
Do not promise crash-proof execution or automatic continuation after the coordinator stops.

## Keep continuity

Keep mission files separate from the installed skill and its saved preferences.
Default to `.agents/fsd/<mission-id>/` in a stable coordinator checkout, with a short
unique mission ID:

- `state.md`: the compact continuity record, retained for resume/handoff.
- `reports/`: retained packets, collected reports and supporting evidence/logs.
- `scratch/`: disposable intermediates; not the sole copy of evidence needed for resume.

If the checkout is disposable, choose an approved external persistent mission directory,
such as `~/.local/state/fsd/<project-id>/<mission-id>/`, with the same contents. Disclose
the absolute mission path at start and handoff, and include relevant absolute paths in
assignments; workers must not derive another state root from their own cwd/worktree.
Existing missions keep their recorded path unless deliberately relocated after reconciling
ownership, in-flight work and evidence links.

Before writing, restrict access with filesystem permissions and Git-ignore the mission
storage where it is inside a repository (normally `.agents/fsd/`, not all of `.agents/`).
Git-ignore is not a privacy boundary. Do not treat retained state/reports as temporary
cleanup targets. The coordinator owns `state.md` and coordinator-authored packets/reports;
exclude those paths from worker write scopes. These continuity updates are separate from
implementation ownership.

Record goal/done criteria, approved scope and roster/worker authority, required review,
limits and usage so far (mark unknowns), effective agent selections, Herdr host/session,
owned pane/cwd/worktree/paths, assignment IDs/status (including uncertain delivery or
supersession), material decisions, evidence/check outcomes, blockers and next action.
Update after dispatch, material results or authority/ownership changes, and at handoff.
Keep it compact: evidence paths and concise summaries, not secrets, raw reasoning
or a transcript archive. This is a coordinator-maintained handoff, not a durable
execution engine or hard budget enforcer.

On wind-down, stop assigning work and settle bounded owned operations. On cancel,
interrupt only owned operations through supported controls. Preserve partial work
and leave a handoff; interrupted is not completed. Resume from the recorded path by
reconciling current files, live agents/ownership, pending assignments and remaining
limits—not by trusting recorded pane IDs, blindly replaying work or resetting budgets.
If remaining authority or budget cannot be established, pause affected work and record
what must be reconciled; unknown usage is not an assumed remaining allowance.
