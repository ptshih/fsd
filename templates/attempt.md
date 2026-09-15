# Dispatch attempt — coordinator owned

```yaml
goal_id: REPLACE
revision: REPLACE
assignment_id: REPLACE
attempt_id: REPLACE
worker_session: REPLACE
status: prepared
created_at: REPLACE
deadline: REPLACE
```

## Before input

- Assignment packet and exact native identity/cwd:
- Prompt or private immutable prompt reference:
- Armed native watch handle, assigned inbox paths and owning coordinator session:
- Verified ownership, effective settings and empty prompt evidence:
- Dispatch allowance consumed/remaining, including prior attempts:
- Prepared intent retained; `dispatch-started` retained immediately before native input:

## Native result

- Actual command stdout/stderr/exit and private receipt location:
- Post-submission native activity from the bounded startup acknowledgment:
- Worker completion/report evidence, distinct from the startup receipt and watch registration:
- Observing, confirmed not-sent, or uncertain; basis:
- Original accounting, reconciliation and next action:

## Disposition

- Verified quiescence or retained handoff owner/next action:
- Unverified, accepted, incomplete, cancelled, superseded or not-sent; supporting evidence:
- Integration and current-criteria checks still outstanding:

A timeout, missing receipt or missing acknowledgment never proves nondelivery.
