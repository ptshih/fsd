# FSD

A skill for **deliver this goal, then stop**, inside an ordinary conversation.
Work directly when that is more efficient, or coordinate visible native Herdr workers.
Verify results, stay steerable, preserve evidence, clean up, and stop.

## Use

Give FSD a goal, scope, and limits:

> Run FSD: fix the parser regression, run the tests, and stop. No public API changes.

Supervised is the default. Request **unsupervised** to let the coordinator make decisions
within the approved scope without routine check-ins. New authority is never implied:
defer actions that need it, continue only independent allowed work, and report blockers.
Neither mode is ongoing backlog management or a guarantee of crash-proof operation.

The [saved preferences](config/herdr-defaults.json) supply model/effort/tool choices and
covered startup trust consent. A clear request can approve a goal; reading or installing
the skill does not. Routine staffing and recovery stay within the approved limits.
Steer through the same conversation: change direction, request status, pause, or cancel.

## Install

Clone into a directory that does not already exist:

```sh
git clone https://github.com/ptshih/fsd.git ~/.agents/skills/fsd
```

Load `SKILL.md` through your agent's skill loader. For Pi, install the local package:

```sh
pi install ~/.agents/skills/fsd
```

Install/authenticate Herdr and the selected worker harnesses separately. Delegation
runs inside a live Herdr session and uses the [runtime](runtime/README.md); direct work
does not require an observer. The coordinator's required effort is `xhigh`.

Use only one runtime entrypoint. An existing source-linked Pi entrypoint already loads
this checkout; do not register it again as a package. Deliberately reload Pi after code
changes, with owned work settled first. The current API/state format is goal-based and
uses fresh goal directories, without alternate schemas or import/conversion tooling.

## Operating references

- [Skill](SKILL.md): goal lifecycle, authority, execution and stopping rules.
- [Herdr](references/herdr.md): native workers, trust, worktrees and cleanup.
- [Async coordination](references/async-coordination.md): dispatch, yield and inspect.
- [Continuity](references/continuity.md): private goal state and handoffs.
- [Runtime](runtime/README.md): current API, checks and limitations.

## Develop and sync

```sh
npm test
npm run check
npm run test:herdr-wire
```

Review the intended diff before committing/pushing. On other devices use
`git pull --ff-only`; preserve and reconcile local changes rather than resetting them.
Credentials, goal state, worker reports and private evidence stay outside this repository.
Git-ignore repository-local `.agents/fsd/` state; ignore rules are not a privacy boundary.

[MIT](LICENSE) © 2026 ptshih.
