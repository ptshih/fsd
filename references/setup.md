# Setup and preferences

## Minimal first use

1. Load [FSD](../SKILL.md) through the harness's normal skill mechanism. There is nothing
   to start. Installation, inspection and editing never authorize work by themselves.
2. Read applicable project instructions and the owner's preferences if present. Use the
   current harness and its normal tools for direct work. Verify any required model,
   effort, tool or approval settings; missing requirements are blockers, not permission
   to substitute a different selection.
3. Establish the requested outcome and only the missing consequential limits or choices.
   Do not demand a roster, every supported harness, or a project configuration file.
4. Only if delegation is useful and authorized, check [Herdr](herdr.md) and choose a
   [delivery mode](delivery.md). A missing delegation capability need not block suitable
   direct work. Do not take over unresolved delegated work without reconciliation.

Keep setup proportional. Do not install dependencies, edit harness settings, enable
trust, create workers or schedule a heartbeat merely to perform a readiness check.
Describe unavailable capabilities plainly instead of announcing generic readiness.

## Preferences

Read the current owner's optional `$XDG_CONFIG_HOME/fsd/preferences.json`; when
`XDG_CONFIG_HOME` is unset, use `~/.config/fsd/preferences.json`. An owner can explicitly
supply another profile. Treat it as their choices, not executable configuration.

Useful preferences include:
- coordinator/worker harness, model, effort and approved fallback selections;
- supervision, delegation route and staffing limits;
- tool and approval settings, scoped standing trust consent;
- notification mode and whether manual resumption or bounded heartbeats are allowed.

Preserve existing choices. A profile may use named roles; do not force those roles into
an unnecessary pipeline. A missing profile is not an error and does not require creating
one. Default to supervised work, no automatic launch, no borrowed trust approvals and
no invented time/cost allowance. When delegation needs limits, propose a small envelope
and obtain the missing approval once.

The owner's explicit goal direction governs within system and project constraints.
Preferences fill unspecified choices; worker files, repository examples and another
user's profile do not grant authority. Do not broaden an active goal because preferences
changed. Record which approved selections the goal actually uses.

Only save preferences at the owner's request. Keep them private and outside the installed
skill; never put credentials, transcripts or goal reports in them. Sharing a profile
between the same owner's machines is an explicit choice, not automatic synchronization.
Machine paths, credentials and native trust state stay local. Portability does not make
one model's effort label equivalent to another's: verify the effective selection.

## Capability check

Record only what the goal needs:

| Capability | Evidence |
| --- | --- |
| Direct work | Actual required model/effort/tools available in the current session |
| Native workers | Live Herdr caller/session and supported command surface |
| Worker settings | Effective harness/model/effort/tools and approval mode |
| Mailbox publication | Explicit output ownership and accessible canonical goal path |
| Automatic delivery | Actual busy delivery and idle wakeup on this host |
| Blocked-work coverage | Real native detection, or an approved bounded check-in mode |
| Heartbeat | Existing scheduler, owned job ID, cadence, expiry and stop control |

Do not equate an installed binary, toast, scheduled job or environment variable with
successful delivery. Do not run a live worker experiment under setup-only authority.
If proof needs a bounded live check, include it in the approved goal envelope or ask.

## Upgrades and multiple machines

Use the host's native package manager as described in the [README](../README.md#install-and-update).
Keep one installation per harness, and do not edit an installed copy to store preferences.
The Pi package and Claude plugin contain the same skill, with no executable components.

Settle owned work before updating or changing the coordinator harness. Keep the package
version in durable goal notes so a resumed goal does not silently adopt different rules.
Refresh discovery through the host's supported mechanism; never type a fake reload
command into a human's editor. Recheck live capabilities after session/environment
changes. Updating a skill does not restore agents or transfer goal ownership.

Goal files default to one host's local filesystem. Two machines can use FSD independently,
but matching paths or synchronized folders do not make them one coordination environment.
Do not use file sync, timestamps or a copied profile as a distributed lock or as proof
that a remote worker stopped. Cross-machine work needs an explicitly verified transport,
shared-path semantics and ownership arrangement; otherwise keep separate goals.
