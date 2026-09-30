# Messages to running workers

The first submission of an assignment into the tab FSD created for it stays a Herdr
`agent prompt` with its receipt ([dispatch](herdr.md#dispatch)). Every later message to a
running worker — a follow-up attempt, a reply to its `question`, a report request — goes
through the worker harness's native inbox when the coordinator can reach it. An inbox
never types into the worker's terminal, so it cannot clobber a human draft or answer a
dialog by accident. These inboxes belong to the harnesses; they add no dependency to FSD.

A follow-up is still a new bounded attempt. Record intent and the delivery route in the
[attempt record](../templates/attempt.md), send the packet a prompt would have carried,
send once, then re-arm the worker's settled-state wait. Reports still travel as files or
native output that the coordinator observes; a worker never types into the coordinator's
pane.

## Choose the route

| Coordinator → worker | Route |
| --- | --- |
| Claude Code → Claude Code | `SendMessage` to the worker's session name, found with `ListAgents` |
| Any coordinator with a shell → Codex | `codex queue --thread THREAD --message TEXT` |
| Any other coordinator → Claude Code; any → Pi or Antigravity | No inbox: the pane fallback below |

**Claude Code.** Start every Claude Code worker with `--name WORKER_NAME`, its Herdr agent
name, so the session answers to the same name in `ListAgents`. Confirm the row before the
first send: Claude Code leaves a clashing name with the session that had it and renames the
newcomer to a variant, and a session started in bare mode binds no inbox and never
appears. Send the bare name; add the listing's `[ref]` only when two rows share it.

**Codex.** `codex queue` adds the message to the thread's queue through Codex's shared app
server. In Codex CLI 0.159.2 the interactive CLI uses that server by default
(`daemon_auto_start` is on); a worker started with `--no-daemon` runs without that server,
so treat its inbox as out of reach (untested). `THREAD` is the session UUID or exact
session name; an ambiguous name is rejected. Herdr exposes no Codex session ID, so resolve
the thread from evidence that binds it to the worker's pane. A session record whose
directory only that worker uses binds it, such as the first record of a Codex session file
naming the worker's own worktree (an undocumented local format, read as evidence only);
an entry matched only by a shared directory and start time is not proof (on 2026-09-30
the newest matching entry predated the pane's process). Without that binding the inbox is
out of reach. The send writes its own receipt, as dispatch does; replace `GOAL_DIR`,
`ATTEMPT_ID`, `THREAD` and `TEXT`, each as one shell argument:

<!-- fsd-example: codex-queue-receipt -->
```sh
( umask 077; set -C; r="GOAL_DIR/evidence/ATTEMPT_ID.receipt"; test ! -e "$r.err" && { codex queue --thread THREAD --message TEXT; s=$?; echo "exit $s" >&2; exit $s; } > "$r.out" 2> "$r.err" )
```

**No inbox.** Pi and Antigravity workers have no inbox that FSD has verified, and only a
Claude Code coordinator can reach a Claude Code worker's ([below](#codex-to-claude-code)).
Fall back to `herdr agent prompt` only after the pane shows an empty prompt and no open
dialog, with the [dispatch receipt](herdr.md#dispatch), and record why the inbox was out
of reach.

Startup dialogs, permission-mode keys and harness exit keys are not messages: they stay
Herdr input on goal-owned panes under the [dispatch](herdr.md#dispatch) and
[cleanup](herdr.md#cleanup) rules.

## Classify delivery

- **Claude Code.** Messages enqueue and drain between the receiver's tool calls, and an
  idle session starts a turn with the message. A successful send means the session
  received the message, not that its model read it. The receiver's `crossSessionInbound`
  setting accepts, holds or refuses messages. Without one, a message that crosses
  permission-mode classes (bypassing prompts versus prompting; plan mode counts as
  bypassing when bypass is available) is held for the owner's approval and dropped after
  `dialogExpiry`, five minutes by default. A `[Cross-session delivery notice]` reports a
  hold or refusal to the sender. A held message is `uncertain` until its notice resolves
  it; never fall back to pane input while it could still be delivered. A refusal is
  `not-sent`. FSD never changes the owner's inbound settings to get a message through.
- **Codex.** A loaded idle thread starts a turn from its queue (seen in the live check
  below); an unloaded thread keeps the message pending and is not resumed
  ([openai/codex#44491](https://github.com/openai/codex/issues/44491), closed as not
  planned). A zero exit with `Queued message MESSAGE_ID for thread THREAD_ID.` means the
  queue accepted it. Queue acceptance alone is not delivery: classify from the receipt, the
  settled-state wait and the pane.

Claude Code's `SendMessage` also takes `notify_when_idle`, a one-shot notice when a local
session next goes idle (both sessions on v2.1.236 or later; the subscription lapses after
12 hours). It is not a qualified FSD wake source; the settled-state wait stays primary
([wakeup](delivery.md#two-wake-sources)).

## Codex to Claude Code

No documented route delivers a Codex session's message into a running Claude Code
session. Claude Code's channels push events from an MCP server into a session, but only
into one started with that channel's flag, and a custom channel needs the research-preview
development flag, which opens a warning dialog at startup. Each session's inbox socket
(`CLAUDE_CODE_MESSAGING_SOCKET`) is documented for scripts and hooks, but its message
format is not. A live check (below) delivered a Codex session's message this way, so the
channel route works, but it needs a channel server and launch-time setup for every
receiving session. FSD adds neither: a Codex coordinator uses the pane fallback for
Claude Code workers, and Codex workers keep reporting through files.

## Evidence

Checked 2026-09-30 with Claude Code 2.1.286, Codex CLI 0.159.2 and Herdr 0.9.1 against
Claude Code's cross-session messaging, settings and channels documentation,
`codex queue --help`, [openai/codex#39092](https://github.com/openai/codex/pull/39092)
(merged: `thread/queue/add`, UUID or exact name, ambiguous names rejected) and
[openai/codex#44491](https://github.com/openai/codex/issues/44491). OpenAI's CLI
reference does not list `codex queue`. Herdr's agent list showed a native session ID for
each Claude Code pane and none for a Codex pane. No FSD goal has sent an inbox follow-up
yet; the first one records its receipt and outcome here, as
[delivery](delivery.md#two-wake-sources) does for waits.

Live check on 2026-09-30, outside any FSD goal, with a fresh Claude Code session and a
throwaway Codex session in new Herdr tabs. `codex queue` to the idle Codex session printed
`Queued message MESSAGE_ID for thread THREAD_ID.` and exited 0 into its receipt; the idle
thread started a turn within seconds and ran the requested command, a POST to a test
channel. The channel delivered that message into the Claude Code session, which started a
turn and answered through the channel's reply tool 47 seconds after the first send. The
development flag found the server only in the project's `.mcp.json`; with `--mcp-config`
it reported "no MCP server configured with that name". The `.mcp.json` launch showed two
dialogs: MCP server consent, which defaults to "Continue without using this MCP server",
then the development-channel warning. The account was an individual plan, to which no
organization channel policy applies.
