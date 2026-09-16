# Assignment

```yaml
goal_id: "REPLACE"
revision: 1
assignment_id: "REPLACE"
attempt_id: "REPLACE"
goal_path: "REPLACE"
worker_guide: "REPLACE_WITH_ABSOLUTE_APPROVED_WORKER_GUIDE_PATH"
role_file: "REPLACE_WITH_ABSOLUTE_ROLE_FILE_PATH_OR_NONE"
worker_host: "REPLACE"
worker_pane: "REPLACE"
worker_tab: "REPLACE"
worker_terminal: "REPLACE"
worker_session: "REPLACE_WITH_NATIVE_SESSION_ID_OR_PATH_OR_UNKNOWN"
worker_kind: "REPLACE"
cwd: "REPLACE_WITH_CANONICAL_PATH"
branch_and_base: "REPLACE"
role: "REPLACE_WITH_ROLE_NAME_OR_WRITER_OR_READ_ONLY"
implementation_write_paths: []
output_write_paths: []
report_channel: "REPLACE_WITH_NATIVE_OR_ABSOLUTE_FINAL_REPORT_PATH"
deadline: "REPLACE"
```

Read the supplied `worker_guide`, the `role_file` if one is set, and this packet first.
You are executing an existing assignment, not starting a new goal; do not repeat
coordinator setup. The guide path must be absolute; it may point to a pinned runbook
when the goal changes FSD itself. Use the [message template's quoting convention](message.md)
for strings, including path array entries. Replace placeholders and the example revision
with actual values. Take `revision` and `deadline` from the current `goal.md` when the
packet is written; never copy them from an earlier packet. Keep pane/terminal details
separate. If a native session is not exposed yet, use `"unknown"` with the verified
pane/terminal binding, then reconcile the actual session once available. Never invent an ID.

## Outcome

- Focused result, scope/non-goals and current directive location:
- Approved effective model, effort, tools and authority:
- Dependencies, verified artifact references and integration owner:
- Minimal task read list and entry points, without the coordinator's entire transcript:
- Checks and acceptance criteria; explicitly omit unnecessary repository-wide checks:

## Resolved report contract

Fill this before dispatch so the worker need not study other goals or FSD's validators:

- Exact final path (or native channel), event ID/prefix and resolved identity metadata;
  keep the path consistent with the recipe (the standard recipe uses `<event_id>.md`):
- Required result/evidence and useful length bound; unrequired checks stay not run:
- Applicable publication recipe/section, with authorized paths supplied; retain all
  private-path, symlink and no-overwrite safeguards when supplying a command excerpt:

## Reporting and boundaries

Report goal/revision/assignment/attempt identity, affected paths, checks actually run
with cwd/exits/evidence, skips/unknowns and remaining work. A result requests inspection;
it is not acceptance. Use only the explicitly assigned output paths, or native text
reporting for a truly read-only assignment. Check current directives at safe boundaries.
Do not edit coordinator control records, spawn workers, broaden authority or self-reassign.
