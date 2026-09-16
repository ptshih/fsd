# Compositions

Named shapes for delegated work, built from the shipped [role files](setup.md#role-files).
Each is an envelope choice, not a mandatory pipeline: use the smallest shape that earns its
cost. Every worker still gets its own tab, packet, attempt record and settled-state wait
([dispatch](herdr.md#dispatch)); on every wake, inspect all workers, not only the one named.
This file contains no executable examples.

## Parallel review

Two or three `reviewer` workers on the same target, each with a distinct angle drawn from
the target itself (typically correctness, tests, simplicity), in one shared read-only
worktree. Hardened where the harness allows. Angles must partition: say in each packet
what the other reviewers own. The coordinator synthesizes into one verdict and applies or
dispatches fixes itself; reviewers never edit. Limits: one attempt each, ten to fifteen
minutes. A worker that strays into another angle is a packet defect, not a finding.

## Review loop

One `builder` in a worktree, then fresh `reviewer`s (parallel review above), then the
builder again with the accepted findings, until reviewers report no P0 or P1 or the round
cap is reached. Default cap: three rounds. Each round is new attempts under the original
allowance. The coordinator decides which findings are worth doing now; P2 items are
deferred, not looped on. Stop early on an unapproved product or scope decision and ask.

## Scout, build, review

`scout` maps the area and returns a read list; `builder` implements from that list in an
isolated worktree; fresh `reviewer`s check the result; the coordinator integrates. Use it
when the coordinator does not yet understand the code well enough to write a builder
packet. The scout's "suggested read list" becomes the builder's minimal read list; do not
forward the whole scout report. Skip the scout when the seams are already known.

## Judge

One `judge` when reviewers disagree, when two plausible options need a recommendation, or
when a proposed direction deserves challenge before a builder starts. Read-only, one
attempt, and its output is advice: the owner or coordinator still decides.

## Mechanical batch

`workhorse` for a fully specified, repetitive change (a reviewed fix list, a rename, a
migration). Specify every location; the workhorse stops at the first ambiguity and asks.
Follow with one reviewer pass on the diff rather than a full review loop.
