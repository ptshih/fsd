# Worker message

Publish one complete, immutable file with a unique event ID in the assigned inbox.
Temporary names start with `.tmp-`; final names end with `.md`. No authority changes.

```yaml
event_id: REPLACE_WITH_UNIQUE_ID
goal_id: REPLACE
revision: REPLACE
assignment_id: REPLACE
attempt_id: REPLACE
worker_session: REPLACE
kind: REPLACE_WITH_PROGRESS_QUESTION_BLOCKED_OR_RESULT_READY
created_at: REPLACE
```

## Summary

- What changed or what requires inspection:
- Report/artifact paths, source snapshot and affected files:
- Commands actually run, cwd, exits/results and evidence paths:
- Skips, unknowns, remaining work or actual blocker/question:
- Prior event being corrected, if applicable:

No result is accepted merely because this message exists. Do not write here without
explicit output permission; use the approved native report channel instead.
