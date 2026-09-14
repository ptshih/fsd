# FSD

A personal agent skill for coordinating coding agents toward an outcome through
Herdr. It defines delegation, review, supervision, and continuity practices; it
is not a standalone application or an autonomous background service.

## Contents

- [`SKILL.md`](SKILL.md) — the skill entry point and coordination workflow.
- [`references/herdr.md`](references/herdr.md) — Herdr assignment, collection,
  recovery, and ownership guidance.
- [`config/herdr-defaults.json`](config/herdr-defaults.json) — saved owner
  preferences, including harness/model selections and approved fallback rules.

The preferences are personal defaults, not a guarantee that the named models are
available on every device. Verify availability before starting a mission; do not
silently substitute models. Installing or updating the skill does **not** authorize
worker launches (`autoLaunch` is `false`).

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

Running FSD also requires Herdr and the selected worker harnesses, installed and
authenticated separately on each device. Use it inside an active Herdr session
(`HERDR_ENV=1`); setting the variable alone does not establish a session. The
coordinator must support the skill's required `xhigh` effort setting.

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
git add SKILL.md references/herdr.md config/herdr-defaults.json
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

This repository syncs the skill and saved preferences only, not agent credentials,
local harness settings, or mission state. Keep mission state and reports in the
separate locations specified by `SKILL.md`, never in this public repository.
Review every commit for private information. `.gitignore` helps prevent accidental
adds but is not a privacy boundary and does not protect already tracked files.

## License

[MIT](LICENSE) © 2026 ptshih.
