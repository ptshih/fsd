# Worked example: one hardened reviewer

A real goal run by a Claude Code coordinator inside Herdr, condensed. Placeholders
replace machine paths and the approved model. This historical run predates mandatory
[roster confirmation](setup.md#confirm-the-roster) and `[FSD]` tab labels. A new run must
confirm its roster before launch and use the current label convention; the trace below
preserves what actually happened.

## Envelope

Owner: "run the smoke goal". The standing `roleDefaults.reviewer` entry (one attempt,
fifteen minutes, approved) supplied the envelope; nothing else was asked. Outcome: qualify
role-file injection, hardened native reporting and the background wait. Goal directory
`<goals>/smoke-reviewer-<ts>/` with `goal.md`, `state.md`, `runbook/` (pinned
`reviewer.md` and `worker.md`), `assignments/`, `attempts/`, `evidence/`, and a
disposable worktree holding a one-file change that removed an `n <= 0` guard.

## Launch

```text
herdr tab create --workspace w5 --cwd <worktree> --label fsd-smoke-reviewer --no-focus
herdr agent start fsd-smoke-reviewer --kind claude --pane w5:pC --timeout 45000 -- \
  --permission-mode plan --append-system-prompt-file <runbook>/reviewer.md \
  --model <approved> --effort <approved>
```

`agent start` returned `agent_not_ready`: the pane showed the workspace-trust dialog for
the exact goal-owned folder. Consent covered it; the coordinator sent `down`, read back
the selection, sent `enter`. A first wait with `--until idle --until blocked` returned the
stale `blocked` at once; the rule to exclude `blocked` after answering a dialog comes from
here. `pane process-info` then showed that an owner shell alias had prepended
`--dangerously-skip-permissions`, and the footer read "bypass permissions on". Four
`shift+tab` presses with footer read-back reached "plan mode on". The skill now starts hardened
Claude workers with `command claude` through `herdr pane run`, which avoids the alias.

An API overload during the first attempt led the owner to cancel it and authorize a
relaunch as goal revision 2. What follows is the second attempt.

## Dispatch

Attempt record: `prepared` → `dispatch-started` → `herdr agent prompt … --wait --until
working … --timeout 10000` → receipt `agent_prompted`/`working` → `observing`. The skill
now has the submitting command write that receipt to `evidence/` itself. The packet
was about 180 words: identity fields, the worker guide path, cwd, "read-only, report
natively", the target files, the assigned check, the question, the deadline. The role
file supplied everything else.

Then, through the host's background facility: `herdr agent wait fsd-smoke-reviewer
--timeout <deadline minus margin>`. `state.md` recorded `waiting` with the task handle,
and the coordinator yielded.

## Wake, verify, close

The background task completed with `agent_status: done` while the coordinator was idle
and re-invoked it. Inspection: `agent get` → `done`; visible screen → empty prompt, no
dialog; `agent read --source recent-unwrapped --lines 400` captured to `evidence/`. The
report followed the reviewer shape exactly, which the packet never described: proof the
role file reached the worker. P0 for the removed guard, P1 for missing coverage,
`node --test` run in plan mode with exit 0, `Merge verdict: BLOCK`. Acceptance recorded.

Cleanup: `ctrl+c ctrl+c` in one send-keys call → `process-info` shows the shell → `herdr tab close w5:tC` →
tab list and agent list show nothing. `state.md`: Closed — delivered.

## The coordinator's two mistakes

The retry packet still said `revision: 1` after the goal moved to revision 2; the
template now says to copy it from the current `goal.md`. And `/exit` sent through
`agent prompt` did not exit the harness; cleanup now uses the native key sequence and
verifies with `process-info`.
