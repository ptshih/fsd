# Mission continuity

Continuity is a compact handoff, not a transcript or a second execution engine. The
coordinator owns it for both direct and delegated missions. For a small direct task,
a short `state.md` is enough; create reports and runtime records only as needed.

## Storage

Keep mission data separate from the installed skill and saved preferences. Default to
`.agents/fsd/<mission-id>/` in a stable coordinator checkout, with a short unique ID:

- `state.md`: outcome, envelope, status, evidence references, and next action.
- `reports/`: retained assignments, collected reports, and supporting checks/logs.
- `scratch/`: disposable intermediates; never the sole copy of necessary evidence.
- `runtime/`: adapter-owned machine records, if supported by the installed adapter.

If the checkout is disposable, use an approved persistent external directory, such as
`~/.local/state/fsd/<project-id>/<mission-id>/`. Disclose the absolute mission path at
start and handoff. Include it in assignments; workers must not derive a different root
from their own cwd/worktree. Keep an existing mission's recorded path unless deliberately
relocated after reconciling ownership, in-flight work, and evidence links. Do not move
an installed adapter's existing state merely to match the proposed directory layout.

Before writing, use owner-private permissions (normally directories `0700`, files `0600`)
and Git-ignore repository-local mission storage, normally `.agents/fsd/`, not all of
`.agents/`. Git-ignore is not a privacy boundary. Retained state/reports are not temporary
cleanup targets. Do not store credentials, secrets, or raw reasoning in continuity.

The coordinator owns `state.md` and coordinator-authored packets/reports; exclude them
from worker write scopes. The adapter owns its machine records. Workers receive only
explicitly assigned report paths, and read-only workers return text for the coordinator
to retain. Continuity maintenance is separate from implementation write ownership.

## Minimum record

Record what applies, with concise summaries and evidence paths:

- Outcome/done criteria, scope/non-goals, supervision, authorized actions/agents,
  required review, limits, usage so far, and important unknowns.
- Current approach (direct/delegated/mixed), effective model/tool selections, material
  decisions, and owner steering revisions with their consequences.
- Owned Herdr host/session/panes and cwd/worktrees/paths, assignment IDs and attempts,
  uncertain delivery, supersession, and any resources retained for handoff.
- Actual delivery mode, verified adapter identity/capabilities, machine-state path,
  pending/unacknowledged events, and inspection/acceptance/check outcomes.
- Blockers, cleanup results, and next action or terminal outcome.

Record a fact once where possible. Link adapter-maintained receipts/events rather than
manually duplicating their full state in Markdown. Mark unavailable delivery and unknown
usage explicitly; neither a saved preference nor a test on another host proves readiness.
Update after dispatch, material results, steering, authority/ownership changes, and handoff.

## Resume and wind-down

Resume by reconciling current files, live agents and ownership, pending notifications,
uncertain submissions, latest owner direction, and remaining limits. Do not trust stale
pane IDs, replay prompts blindly, or reset budgets. Unknown usage is not an assumed
remaining allowance; pause affected work if its authority or budget cannot be established.

On wind-down, stop assigning work and settle bounded owned operations. On cancellation,
interrupt only owned operations through supported controls and verify their state.
Preserve partial work; cancellation/interruption is not completion. Retire relevant
observations and follow [Herdr cleanup](herdr.md#prune-finished-workers). Retain evidence
and disclose any resources that could not safely be closed. The owner's Pi conversation
remains available after the mission ends.
