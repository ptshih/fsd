# FSD

A personal skill for **deliver this, then stop** missions, from minutes to hours,
inside an ordinary agent conversation. The coordinator works directly when that is
more efficient, or delegates to visible native Herdr workers. It owns verification
and routine recovery, stays steerable, and provides useful progress updates.

FSD is not an ongoing backlog manager, a separate application, or an autonomous
background service. For Pi, the intended integration is a small extension—not a
custom launcher or another coordinating model.

## Contents

- [`SKILL.md`](SKILL.md) — the skill entry point and coordination workflow.
- [`references/herdr.md`](references/herdr.md) — Herdr assignment, collection,
  recovery, and ownership guidance.
- [`references/async-coordination.md`](references/async-coordination.md) — current
  nonblocking operation and capability checks.
- [`references/continuity.md`](references/continuity.md) — private mission state,
  evidence, resume, and handoff.
- [`references/runtime-contract.md`](references/runtime-contract.md) — design contract,
  migration requirements, and acceptance scenarios.
- [`runtime/README.md`](runtime/README.md) — implemented v3 extension/library, actual
  interface, isolated tests, installation, and remaining live-qualification work.
- [`config/herdr-defaults.json`](config/herdr-defaults.json) — saved mission defaults,
  harness/model selections, startup consent, and approved fallback rules.

The preferences are personal defaults, not a guarantee that the named models are
available on every device. Verify required selections; do not silently substitute
models. `coordinationRoute: herdr-only` applies to delegated workers, not to whether
the coordinator can implement directly. Installing, reading, or editing the skill
does **not** authorize a mission or worker launch (`autoLaunch` is `false`).

## Use

Request a specific outcome, with relevant scope, done criteria, and limits. For example,
in Pi: `/skill:fsd Fix the failing parser tests; no public API changes.` The coordinator
uses applicable defaults and asks only for genuinely missing decisions. Mission approval
is required, but a clear request can provide it; no redundant confirmation is needed.

The approved operating envelope covers routine staffing changes, repairs, and recovery,
not just a fixed roster. Narrower mission/project restrictions take precedence. Steer
through the normal conversation: change priorities, correct assumptions, request status,
pause, or cancel. The coordinator checks results, preserves evidence, cleans up disposable
workers, and stops without picking up unrelated backlog work.

Small direct tasks need no worker adapter. Delegated automatic work requires verified
runtime support for the actual roster and workspaces; a proposed capability is not an
available one.

## Install on another device

Install Git and clone the repository into the shared skill directory:

```sh
mkdir -p ~/.agents/skills
git clone https://github.com/ptshih/fsd.git ~/.agents/skills/fsd
```

The destination must not already exist. If you already have an FSD installation,
back it up outside your agent's skill discovery directories and compare it with
the clone before discarding anything.

Point your agent's skill loader at `~/.agents/skills/fsd` if it does not discover
that directory automatically. For Claude Code on macOS/Linux, expose the same
checkout through its personal skill directory:

```sh
mkdir -p ~/.claude/skills
ln -s ~/.agents/skills/fsd ~/.claude/skills/fsd
```

Only create that link if the destination is absent; do not overwrite an existing
installation. Restart or reload your agent's skills as needed.

Delegation requires Herdr and the selected native worker harnesses, installed and
authenticated separately on each device, inside an active Herdr session (`HERDR_ENV=1`).
Setting that variable alone does not establish a session. The coordinator must support
the saved required `xhigh` effort setting, including for direct work.

Coordination defaults to bounded startup acknowledgments followed by useful work or
yielding, not foreground completion waits. Automatic resumption requires a verified
coordinator-harness adapter. This checkout includes an **implemented, isolated-tested
v3 Pi runtime**, installed and live-qualified for bounded supervised missions on this
host's Pi/Herdr profile. Real wakeups, parallel worktree completion, repeated question-UI
blockers, active-observer coordinator reload without duplicate input, integrated fixture
checks and cleanup passed. The question-UI integration gap is repaired without changing
Herdr-managed files or making approval decisions. This is not crash-proof continuation
or hard budget enforcement; see the [runtime guide](runtime/README.md) for exact tested
versions, evidence boundaries and remaining live cases.
Without a suitable verified adapter, pause affected delegation or obtain explicit approval
for manual resumption; Herdr notifications/toasts alone do not wake an assistant turn.

The local entrypoint now points to v3; the original v2 files and observation evidence
are preserved in a private rollback backup. Already-running Pi sessions retain their
loaded version until deliberately reloaded. Neither the new skill text nor passing
fixture tests migrates live work. The installer first inventories existing observations and requires a reviewed
entrypoint hash before replacement; it never reloads Pi or launches workers.

## Sync changes

Before editing on a device:

```sh
git -C ~/.agents/skills/fsd pull --ff-only
```

After editing, review and publish the intended files (adjust the file list for
your changes):

```sh
cd ~/.agents/skills/fsd
git diff
git add SKILL.md README.md references/herdr.md \
  references/async-coordination.md references/continuity.md \
  references/runtime-contract.md config/herdr-defaults.json \
  package.json runtime scripts tests
git diff --cached
git commit -m "Update FSD skill"
git push origin main
```

Then run `git pull --ff-only` in the checkout on your other devices. Sync is
manual, not automatic. If a pull refuses because of local changes or diverging
commits, preserve your work and reconcile it rather than resetting or force-pushing.

Reading this public repository needs no authentication. Pushing requires access
to `ptshih/fsd`: configure GitHub CLI HTTPS authentication with `gh auth login`
and `gh auth setup-git`, or use an authenticated SSH remote:

```sh
git -C ~/.agents/skills/fsd remote set-url origin git@github.com:ptshih/fsd.git
```

## Keep private data separate

This repository syncs the skill, runtime source/tests, and saved preferences—not agent credentials,
local harness settings, or mission state. Keep mission state and reports in the
separate locations specified by `SKILL.md`, never in this public repository.
Review every commit for private information. `.gitignore` helps prevent accidental
adds but is not a privacy boundary and does not protect already tracked files.

## License

[MIT](LICENSE) © 2026 ptshih.
