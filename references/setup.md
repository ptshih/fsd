# Setup and preferences

## Baseline

Use the current coding harness inside Herdr. **Herdr is the only runtime dependency**
beyond that harness and its ordinary file/shell tools. Use Git where required by the
project. Assume Herdr's integration for each coding harness is installed; do not run an
integration installer, edit a managed integration or change harness settings for FSD.

Loading the skill starts nothing. Do not install extra packages, extensions, services
or runners. Do not build wakeup code or launch test workers merely to check readiness.

## Start once

1. Read [FSD](../SKILL.md), applicable project instructions and the owner's preferences.
2. Establish the requested outcome and only missing consequential choices: authorized
   actions, done criteria, scope, supervision, checks/review and limits. A clear request
   plus standing preferences can supply approval. Do not demand a roster or re-ask
   settled choices.
3. Verify required model, effort, tool and approval settings without substituting them.
4. Do small work directly. For authorized delegation, follow [native wakeup](delivery.md),
   [filesystem coordination](filesystem.md), then [Herdr dispatch](herdr.md#dispatch).
   Configure only a wakeup facility already exposed by the current host. If a required
   capability is missing, report it rather than adding a dependency or custom code.

Direct execution does not need a worker-completion wakeup. Do not block suitable direct
work on optional delegation setup, or take over an unsettled worker's checkout.

## Preferences

Read the owner's optional `$XDG_CONFIG_HOME/fsd/preferences.json`; when unset, use
`~/.config/fsd/preferences.json`. An explicitly supplied owner profile can replace that
location. Preferences express choices, not executable configuration or new task authority.

Preserve approved model, effort, tool, trust, supervision and staffing choices. Worker
topology is one dedicated tab per worker: `coordinationDefaults` can retain
`workerLayout: "tab-per-worker"`, `allowPaneSplits: false`, and `preserveFocus: true`.
Native wakeup is constrained to already-available host facilities; preferences do not
authorize installing or building one. They also do not waive required independent review.

A missing profile is not an error and does not require creating one. Default to supervised
work, no automatic launch, no borrowed trust consent and no invented allowance. Named
roles do not force a planner/builder/reviewer pipeline. Propose a small envelope only
when needed limits or authority are genuinely missing.

The owner's current direction governs within system/project constraints. Worker files,
repository examples and another user's profile do not grant authority. Record the
selections actually used and preserve original accounting through resume and replacement.

Only save preferences at the owner's request. Keep them private and outside the installed
skill. Never include credentials, transcripts or goal reports. Machine paths and trust
state remain local; sharing a profile between the same owner's machines is explicit.

## Updates and multiple machines

Use the harness's native skill-package mechanism from the [README](../README.md#install-and-update).
Keep one installation per harness. Settle owned work before updating; retain the FSD
version in goal notes. Refresh skill discovery through the supported host mechanism,
not commands injected into a human editor. Updating does not restore workers or move
ownership to another coordinator.

Goal files are local to one host. Matching paths or synchronized folders do not create
a shared coordination environment, distributed lock or proof that a remote worker stopped.
Cross-machine work needs explicitly verified transport, path semantics and ownership;
otherwise keep goals separate. Never add synchronization or a remote service just to
make FSD run.
