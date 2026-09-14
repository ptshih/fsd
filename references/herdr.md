# Herdr

Require `HERDR_ENV=1` before inspection/control. Use the installed `herdr --skill`
and relevant CLI help when needed; don't invent commands or substitute another route.

## Assign and collect

- Discover actual IDs with `herdr agent list` and `herdr pane current --current`.
  Check `herdr status` for compatibility when needed. Old IDs or labels aren't proof
  of current ownership, model, effort or tools. Rediscover after reconnect, restart
  or occupant change; reconcile with the continuity record before dispatch.
- Reuse suitable available agents; launch only when an approved assignment and
  mission worker authority cover it. Saved `autoLaunch: false` prevents automatic
  launches from skill activation, not launches explicitly authorized by the mission.
  Replacement/additional workers need authority within that envelope, not just an
  available role default. This owner prefers separate **tabs** and preserved
  coordinator focus. Use supported `herdr agent start` with verified native flags,
  never permission-bypassing aliases.
- For execution agents, use the saved YOLO/auto-approval preference and normal
  harness tools; do not invent a restrictive profile just to launch a worker.
  Resolve native flags from installed help and disclose the selected mode. This
  removes routine permission prompts, not project guards, read-only role contracts
  or scope/spending/release limits. If a mode disables a required guard, do not use
  it; report that specific conflict instead. Do not relax a denial as a retry.
- Verify effective harness/model/effort, approval mode and tool availability using
  native session/settings evidence before assigning work. Herdr's recognized kind,
  requested launch flags and lifecycle hooks do not establish all those settings.
  Record what was verified and any unknowns; pause affected dispatch if a required
  setting cannot be verified. Keep mission selections and approved fallback rules.
- Use short mission-local assignment IDs (`A1`, `A2`, …). Include the ID, outcome,
  owned cwd/worktree/paths, read-only or writer role, required checks and report
  expectation in each assignment. Retain the ID on status/report follow-ups;
  give replacement work a new ID linked to the superseded assignment. Do not
  replace in-flight work until its delivery, ownership and side effects are reconciled.
- Require a concise text report: assignment ID; `complete`, `incomplete` or `blocked`;
  work done and affected paths (or review findings); checks actually run and their
  exits/results; skips/unknowns; remaining work/blockers. A worker's `complete` report
  requests coordinator acceptance; it is not acceptance by itself.

## Wait, inspect, decide

- Send any prompt, including status/report follow-ups, only to a verified owned
  agent ready for input with no human draft. Resolve or explicitly supersede the
  prior assignment before submitting new work; same-assignment follow-ups may
  resolve an incomplete report or request repairs. Use
  `herdr agent prompt <target> <assignment> --wait --timeout <ms>` for work and follow-ups.
  Use finite, task-appropriate timeouts within remaining mission limits. A successful
  submission or settled `idle`/`done` state is lifecycle evidence, not ID-matched
  assignment completion; a wait can otherwise reflect an earlier active turn.
- After each wait, inspect `herdr agent get <target>` and
  `herdr agent read <target> --source recent-unwrapped --lines <n>`.
  Decide explicitly: accept verified results, request missing information/repair,
  wait again, defer a blocker or wind down. If still working, use
  `herdr agent wait <target> --timeout <ms>` and repeat inspection within the limits;
  do not resend the assignment or reset its budget merely because a wait expired.
- A timeout, `agent_prompt_stalled`, transport error or `unknown` state proves neither
  completion nor non-delivery. Record uncertain delivery, inspect live identity,
  output and relevant work before retrying. If activity is visible, wait for it; if
  ready but receipt remains unclear, ask a short ID-specific status question rather
  than reissuing the work. Resubmit only after establishing non-delivery or reconciling
  partial work into an authorized replacement. If uncertainty persists, stop affected
  dispatch and hand off the blocker; do not switch routes or force receipt.
- For `blocked` (or a native approval UI despite an `idle` lifecycle), inspect the
  actual prompt. Answer only with current or recorded standing owner approval.
  The saved `startupPromptApprovals.piProjectTrust` policy covers exactly Pi's
  **Trust (this session only)** choice for verified mission-owned worktrees in an
  already approved mission. When enabled, do not ask again: reverify the live owned
  Pi agent and that the prompt's canonical path equals its authorized worktree,
  navigate using supported `herdr agent send-keys`, read back the selected option,
  then confirm and verify startup. Record the path, choice and standing-consent
  basis. This accepts the native prompt, including its stated project-resource
  loading consequences; it does not disable a guard or change persistent trust.
  Never choose permanent/parent-folder trust, edit trust configuration, cover an
  unrelated/unverified path or another prompt, or reverse an explicit denial under
  this policy. Pause if a project/mission guard conflicts or identity/choice is unclear.
  Otherwise, if approval is missing, ask in supervised mode; in unsupervised mode,
  record and defer rather than answer or wait for confirmation. While blocked,
  continue only independent authorized work. A successful wait never hides a blocker.

## Recover incomplete reports

If a report is missing or truncated, increase the read window/use supported available
history first. If that cannot recover it, wait for a verified ready agent and request
only the missing ID-matched report, not another implementation pass. Ask for a concise
text report or short numbered chunks, reading each before requesting the next. Bound
recovery by remaining mission limits; mark evidence incomplete if it cannot be recovered.

Read-only workers return text and never write report files. The coordinator may save
collected text under `reports/` in the recorded absolute mission directory. Herdr's
generic temporary-report-file fallback is allowed only for an already write-authorized
worker with an explicitly assigned private report path under that directory's `reports/`,
Git-ignored when inside a repository and distinct from coordinator-owned files. Never
broaden a read-only role to use that fallback or leave the only needed report in `scratch/`.

## Preserve ownership

Never overwrite human drafts, send reports into human-used input fields, interrupt
busy agents to force receipt, or promote a read-only helper into a writer. Model/tool
settings and instructions are not OS isolation or hard spending guarantees.

On a tool/transport/ownership failure, stop affected dispatch, preserve evidence
and reconcile. Don't bypass permissions or switch routes. Continue only independent
authorized work; if none can progress, hand off the blocker.

Before an authorized reset, retirement or ownership transfer, inspect unfinished
work and service dependencies, preserve a concise handoff and verify quiescence.
Use supported controls and rediscover the resulting identity. Never reset or retire
the human coordinator, unrelated agents or shared services. Reconcile in-flight work
before an approved model fallback; record and disclose the switch without duplicates.
