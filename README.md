# FSD

**Deliver this goal, then stop.** A pure Agent Skill for ordinary coding-agent
conversations: work directly or coordinate visible Herdr workers, verify the result,
and finish deliberately.

FSD 1.0.0 is instructions, references and record templates. It ships no executable,
extension hooks, server, scheduler or extra coordinating model. Normal harness tools,
Herdr, Git and private files do the work. Automatic wakeups depend on verified native
facilities; a file appearing on disk does not itself resume an agent.

## Use

> Use FSD: fix the parser regression, run the tests, and stop. No public API changes.

Supervised is the default. Request unsupervised work explicitly; that changes how
in-scope decisions are handled, not permissions or available host capabilities. Neither
mode authorizes ongoing backlog work. Steer, pause or cancel through the conversation.

Small direct tasks need no worker setup. Delegated goals use one coordinator, isolated
implementation worktrees, immutable inbox messages and separate acknowledgment and
acceptance. The [skill](SKILL.md) gives the workflow.

## Install and update

Choose one installation per harness. Installing or updating grants no goal authority
and launches nothing. Review the skill before use.

### Pi

```sh
pi install git:github.com/ptshih/fsd
pi update git:github.com/ptshih/fsd
```

The package declares only the skill. It does not register tools or hooks. Start a new
session or use Pi's supported reload to refresh discovery after an update.

### Claude Code

```sh
claude plugin marketplace add ptshih/fsd
claude plugin install fsd@fsd
```

To update the catalog and installed skill:

```sh
claude plugin marketplace update fsd
claude plugin update fsd@fsd
```

The plugin contains the same root `SKILL.md`, not a separate implementation. Restart
Claude Code when its updater requires it. Use a version supporting root-level single-skill
plugins, or load `SKILL.md` through your harness's normal skill discovery.

### Other skill-capable harnesses

Place this directory in the harness's documented skill location, or use its supported
skill-package installer. Resolve reference/template links relative to `SKILL.md`.
Direct work needs ordinary file/shell tools; delegated work also needs a live Herdr
session. Do not assume another harness's notification or effort settings carry over.

### Keep updates separate from your work

Owner preferences live at `$XDG_CONFIG_HOME/fsd/preferences.json`, defaulting to
`~/.config/fsd/preferences.json`. Goal records live outside the installed skill.
No personal models, credentials or trust approvals are shipped with FSD. See
[setup and preferences](references/setup.md).

Update between goals, with owned work settled. For a long goal, retain its FSD version
and do not mix instructions from different releases. Pin a release through the host's
package manager when reproducibility matters. Skill versions do not confer permission
to rewrite goal evidence or import another user's preferences.

## References

- [Setup and preferences](references/setup.md): minimal first use, local choices, upgrades.
- [Filesystem protocol](references/filesystem.md): ownership, messages, evidence and recovery.
- [Native delivery](references/delivery.md): wakeups, heartbeats and unsupported modes.
- [Herdr operations](references/herdr.md): dispatch, integration and cleanup.

## Development checks

From a source checkout with Node 22 or later, run `npm test` and `npm run check`. No
dependency installation is needed. These validate packaging, documentation and templates, not agent compliance or
end-to-end delivery. Install/update behavior and autonomous coordination must be checked
on each supported host profile; cross-harness live qualification is not claimed.

[MIT](LICENSE) © 2026 ptshih.
