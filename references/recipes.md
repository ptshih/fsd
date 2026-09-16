# Filesystem examples

These are copyable, one-shot uses of normal tools—not an FSD program to install or run
in the background. The [filesystem protocol](filesystem.md) supplies the ownership and
recovery rules. Use only the example you need, inside already authorized scope.

## Preconditions

The examples use an existing POSIX shell, `mktemp`, and ordinary file utilities. Message
publication also requires working hard links on the inbox filesystem. Verify these
facilities on the actual host; do not install dependencies or assume Windows/network
filesystem support. Other native tools are fine if they provide the same properties.

Set the named variables to inspected absolute paths in the same shell/tool call as the
block; do not rely on variables surviving separate calls. Paths must be canonical,
private and owned/authorized for this operation. Never
use raw owner or message text as shell commands or filenames. These examples restrict
IDs to 1–128 ASCII letters, digits, underscores or hyphens. They do not validate message
metadata, choose scope, detect a live worker, or grant permissions.

Only one authorized writer may operate on each destination. Path checks are not a
security boundary against a competing process changing directories during a command.
Atomic visibility is not a guarantee of power-loss durability. Never put credentials
or raw reasoning in drafts or reports.

## Create a private delegated goal

Coordinator only. Set `GOAL_PARENT` to the project's goals directory,
`${XDG_STATE_HOME:-$HOME/.local/state}/fsd/goals/<project-slug>`, created beforehand with
`mkdir -p -m 700`, and `GOAL_ID` to a fresh path-safe ID. This deliberately uses `mkdir` without `-p`: an
existing goal, file or symlink must fail, not be adopted or overwritten. Small direct
work does not need this directory tree.

<!-- fsd-example: private-goal -->
```sh
set -eu
umask 077
LC_ALL=C; export LC_ALL
: "${GOAL_PARENT:?Set an approved parent}" "${GOAL_ID:?Set a fresh ID}"
case "$GOAL_ID" in *[!A-Za-z0-9_-]*) exit 1 ;; esac
test "${#GOAL_ID}" -le 128
test -d "$GOAL_PARENT"
test "$GOAL_PARENT" = "$(cd "$GOAL_PARENT" && pwd -P)"
goal="$GOAL_PARENT/$GOAL_ID"
mkdir "$goal"
mkdir "$goal/assignments" "$goal/attempts" "$goal/inbox" \
  "$goal/acknowledgments" "$goal/evidence" "$goal/runbook"
printf '%s\n' "$goal"
```

Copy the installed skill's `SKILL.md`, `references/`, `templates/` and `agents/` into
`runbook/` next, then write the actual directives with normal file tools, keeping files
private (`0600`).
Create each attempt's private inbox separately and explicitly assign its sole publisher.
If setup fails partway through, inspect the owned partial directory; rerunning this
block is not recovery and does not authorize deleting existing records.

## Publish an immutable message

The assignment must authorize this inbox and the draft's write location. Set `INBOX`
to your existing canonical attempt inbox, `EVENT_ID` to a new globally unique path-safe
ID, and `MESSAGE` to your complete, closed draft file. Fill the [message template](../templates/message.md)
with current IDs and actual evidence first. If the draft is inside an inbox, its name
must start with `.tmp-` so readers ignore it until publication. Keep drafts private:
set `umask 077` before writing them, not only inside this block.

<!-- fsd-example: publish-message -->
```sh
set -eu
umask 077
LC_ALL=C; export LC_ALL
: "${INBOX:?Set the assigned inbox}" "${EVENT_ID:?Set a unique ID}" "${MESSAGE:?Set the complete draft}"
case "$EVENT_ID" in *[!A-Za-z0-9_-]*) exit 1 ;; esac
test "${#EVENT_ID}" -le 128
test -d "$INBOX"
test "$INBOX" = "$(cd "$INBOX" && pwd -P)"
test -f "$MESSAGE"
test ! -L "$MESSAGE"
test "$(dirname "$MESSAGE")" = "$(cd "$(dirname "$MESSAGE")" && pwd -P)"
if [ "$(dirname "$MESSAGE")" = "$INBOX" ]; then
  case "${MESSAGE##*/}" in .tmp-?*) ;; *) exit 1 ;; esac
fi
final="$INBOX/$EVENT_ID.md"
test ! -e "$final"
test ! -L "$final"
tmp=$(mktemp "$INBOX/.tmp-XXXXXXXX")
cat "$MESSAGE" > "$tmp"
ln "$tmp" "$final"
rm "$tmp"
printf '%s\n' "$final"
```

The temporary file is complete and closed before `ln`. Linking refuses to replace an
existing file; on success the final message is immutable. The original draft is retained.
Only final `.md` files are messages; readers ignore `.tmp-*` files.

On error, inspect both the final path and any owned temporary file. In particular,
`ln` can succeed before `rm` fails: a nonzero overall exit does **not** prove nondelivery.
Do not replace the final file or blindly repeat the operation. A publication failure is
a blocker, not permission to use another inbox. This block does not notify a coordinator.

## Replace coordinator state atomically

Coordinator only. Set `GOAL` to the canonical goal directory and `STATE_DRAFT` to the
complete, closed replacement text in an authorized private draft file. Retain required
prior directives and dispatch receipts separately; replacing a summary is not history.
Never use this operation to replace a worker message or acknowledgment.

<!-- fsd-example: replace-state -->
```sh
set -eu
umask 077
: "${GOAL:?Set the owned goal}" "${STATE_DRAFT:?Set the complete replacement}"
test -d "$GOAL"
test "$GOAL" = "$(cd "$GOAL" && pwd -P)"
test -f "$STATE_DRAFT"
test ! -L "$STATE_DRAFT"
test "$(dirname "$STATE_DRAFT")" = "$(cd "$(dirname "$STATE_DRAFT")" && pwd -P)"
state="$GOAL/state.md"
if [ -e "$state" ] || [ -L "$state" ]; then
  test -f "$state"
  test ! -L "$state"
fi
tmp=$(mktemp "$GOAL/.tmp-state-XXXXXXXX")
cat "$STATE_DRAFT" > "$tmp"
mv "$tmp" "$state"
printf '%s\n' "$state"
```

Here replacement is intentional: `mv` renames a completed temporary file in the same
directory over an absent or regular control file. It is **not** the immutable-message
publication recipe. An interrupted draft write leaves the previous state untouched;
inspect any temporary leftovers before recovery. Updating state does not prove a
recorded action finished or stop a running worker.

The development tests execute these exact blocks against disposable local fixtures,
including rejected paths and injected failures. They do not prove model compliance,
notification delivery or behavior on another host.
