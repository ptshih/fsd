# Worker message

Publish one complete, immutable file with a unique event ID in the assigned inbox.
Temporary names start with `.tmp-`; final names end with `.md`. No authority changes.

```yaml
event_id: "REPLACE_WITH_UNIQUE_ID"
goal_id: "REPLACE"
revision: 1
assignment_id: "REPLACE"
attempt_id: "REPLACE"
worker_session: "REPLACE_WITH_NATIVE_SESSION_ID_OR_PATH_OR_UNKNOWN"
kind: "REPLACE_WITH_PROGRESS_QUESTION_BLOCKED_OR_RESULT_READY"
created_at: "REPLACE_WITH_OBSERVED_UTC_OR_UNKNOWN"
```

Replace every placeholder and use the actual goal revision (`1` is an example, not a
default). String values are JSON-compatible double-quoted scalars: escape embedded
quotes, backslashes and newlines.
For example, `"session: example"` is one scalar; unquoted descriptive colons are not.
Keep `worker_session` the exact native session ID/path, not a composite sentence. If it
is unavailable, write `"unknown"` and state the missing evidence and known binding below;
this does not waive coordinator identity verification.

Copy `created_at` from a UTC clock reading immediately before publication, such as
`date -u +%Y-%m-%dT%H:%M:%SZ`, using `YYYY-MM-DDTHH:MM:SSZ`; otherwise use `"unknown"`.
Never estimate or prefill a plausible time. Clock skew and queued notifications mean
neither worker nor notification timestamps establish causal order, authority or
acceptance. Match goal/revision/attempt/event/worker identity and reconcile actual state.

## Summary

- Actual native binding: host, harness, pane/tab/terminal and session evidence:
- What changed or what requires inspection:
- Report/artifact paths, source snapshot and affected files:
- Commands actually run, cwd, exits/results and evidence paths:
- Skips, unknowns, remaining work and any identity or clock discrepancy:
- Prior event being corrected, if applicable:

Keep the report proportional to the task. Mark a check not run instead of inventing an
exit/result; do not launch extra checks merely to fill template bullets. No result is
accepted merely because this message exists. Use only explicitly assigned output paths
or the approved native channel.
