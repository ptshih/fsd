# FSD

**Deliver this goal, then stop.** A pure Agent Skill for ordinary coding-agent
conversations: work directly or coordinate visible Herdr workers, verify the result,
and finish deliberately.

FSD 1.2.0 is instructions, references, role files and record templates. **Herdr is the only runtime
dependency** beyond your coding harness and its ordinary tools. Assume Herdr's harness
integrations are installed. FSD adds no executable, extension, package dependency,
server, scheduler or helper model. Use Git where the project requires it.

There is one workflow: **Herdr tabs → filesystem reports → existing native wakeup →
coordinator verification**. Small work stays direct. Each worker runs under a
[role file](references/setup.md#role-files) (`scout`, `builder`, `workhorse`, `reviewer`,
`judge`) that fixes its scope, harness launch arguments and report shape; the owner's
preferences supply model routing. For unattended delegation, FSD uses only a wakeup
facility already exposed by Herdr or the active harness: Herdr's settled-state
`agent wait`, run in the host's background facility, with an inbox watch as fallback.
Files preserve state but cannot wake an idle agent by themselves. If the host lacks a usable
facility, FSD reports that gap before dispatch—not an installation task, a custom
bridge, or an undisclosed manual fallback. See [native wakeup](references/delivery.md).

## Use

> Use FSD: fix the parser regression, run the tests, and stop. No public API changes.

Supervised is the default. Request unsupervised work explicitly; that changes how
in-scope decisions are handled, not permissions or available host capabilities. Neither
mode authorizes ongoing backlog work. Steer, pause or cancel through the conversation.

Small direct tasks need no worker setup. Delegated goals use one coordinator, a role file per worker, isolated implementation
worktrees, immutable inbox messages (or native reports from hardened read-only workers)
and separate acknowledgment and acceptance. Prepare once, reuse still-applicable evidence, and recheck live identity/UI
before input. Workers receive a role file, a focused read list and a resolved report contract, not
a coordination research task. The [skill](SKILL.md) gives the workflow.

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
Use the current harness inside Herdr with its installed integration. Do not assume
another harness's wakeup or effort settings carry over, and do not add dependencies.

### Keep updates separate from your work

Owner preferences live at `$XDG_CONFIG_HOME/fsd/preferences.json`, defaulting to
`~/.config/fsd/preferences.json`. Goal records live at
`$XDG_STATE_HOME/fsd/goals/<project-slug>/<goal-id>/`, outside every repository and the
installed skill, and each goal pins its own copy of the skill in `runbook/`.
No personal models, credentials or trust approvals are shipped with FSD. See
[setup and preferences](references/setup.md).

Update between goals, with owned work settled. For a long goal, retain its FSD version
and do not mix instructions from different releases. Pin a release through the host's
package manager when reproducibility matters. Skill versions do not confer permission
to rewrite goal evidence or import another user's preferences. When using FSD to improve
itself, [pin the runbook](references/setup.md#improving-fsd-itself) and review changes in
a separate checkout; proposed instructions cannot change the running goal's authority.

## References

- [Setup and preferences](references/setup.md): minimal first use, local choices, upgrades.
- [Worker guide](references/worker.md): focused execution, escalation and reporting without coordinator setup.
- [Role files](references/setup.md#role-files): shipped roles under `agents/`, owner overrides, launch arguments.
- [Filesystem protocol](references/filesystem.md): ownership, messages, evidence and recovery.
- [Filesystem examples](references/recipes.md): tested one-shot commands using normal tools.
- [Worked example](references/example.md): one hardened reviewer end to end, including the mistakes.
- [Compositions](references/compositions.md): parallel review, review loop, scout/build/review, judge, mechanical batch.
- [Native wakeup](references/delivery.md): settled-state waits and inbox watches through existing host facilities; no custom machinery.
- [Herdr operations](references/herdr.md): dispatch, integration and cleanup.

## Development checks

From a source checkout with Node 22 or later, run `npm test` and `npm run check`. No
dependency installation is needed. These validate packaging, documentation, role files, templates
and exact filesystem examples in disposable local fixtures—not agent compliance or end-to-end
delivery. Install/update behavior and autonomous coordination must be checked
on each supported host profile; cross-harness live qualification is not claimed.

[MIT](LICENSE) © 2026 ptshih.
