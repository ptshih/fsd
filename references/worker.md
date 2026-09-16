# Assigned worker

Execute the assignment, report evidence, and stop. You are not the coordinator. Do not
start another goal, launch agents or repeat coordinator setup.

## Read only what the task needs

Read your packet, the role file if one is supplied, and this guide once, then current
directives, project instructions and the task's named entry points. Open further files
only when the assigned outcome needs them. Do not read FSD's development scripts/tests
merely to learn how to coordinate or publish a report, and do not inherit the
coordinator's transcript.

## Before work

- Match goal/revision/assignment/attempt, cwd, scope, deadline and allowed paths.
  Discover native identity with `herdr pane current --current`; compare the supplied
  pane/terminal binding. Never guess a session ID; report missing identity as uncertainty.
  Stop affected work on identity, directive or ownership conflicts pending reconciliation;
  an old packet never overrides current owner steering.
- Use the approved model, effort and tools; unsupported requirements do not authorize
  fallback.
- Implementation and report-write scope are separate. Use only assigned output paths;
  a truly read-only task reports natively. Missing report instructions require one
  precise question, not a filesystem search for another worker's example.

## Do the assigned work

Stay within the assigned checkout and paths. Follow project policy and run the
assignment's required checks without weakening them. Report-only work does not require
Git status, repository-wide scans or extra hashes/tests unless the assignment calls for
them. Do not change coordinator records, another worker's files, installed skills or
harness settings. No commits, pushes, installs or other consequential actions without
authority. Recheck directives at safe boundaries and before consequential effects. Stop on cancellation, supersession or exhausted limits; preserve partial
results and identify unfinished operations.

## Ask, then wait

If a decision outside your assignment is required, publish one `kind: "question"`
message (natively when read-only) with the options and your recommendation, then stop
at an empty prompt; your settled state wakes the coordinator and the reply arrives as a
new prompt here. Do not decide it yourself, poll, or end a result with a choose-one
question.

## Report once and finish

Use the assigned report contract, the role file's report shape and the
[message fields](../templates/message.md). Identify the goal, revision, assignment,
attempt, actual native worker, affected paths, source snapshot/reviewed tree and relevant
dirty/untracked changes, checks actually run (cwd/exits/results), evidence,
skips/unknowns, blockers and remaining work. Keep `worker_session` a quoted ID/path only;
put pane/terminal details in the body. Copy `created_at` from an observed UTC clock
immediately before publication, or use `"unknown"`; never guess. Timestamps do not
establish acceptance or causal order.

For filesystem reports, write a complete private `.tmp-` draft in your own inbox and
publish one immutable final `.md` with the [atomic no-overwrite recipe](recipes.md#publish-an-immutable-message).
On uncertainty, inspect the final path before recovery; never blindly republish or edit
a published message. If publication fails, report that natively without claiming delivery.

Return the final report path and stop. Do not wait for acknowledgment, self-accept,
integrate or reassign yourself. Only the coordinator authorizes a new bounded attempt.
