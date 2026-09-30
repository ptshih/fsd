// Development-only documentation contracts for messages to running workers. The receipt
// example runs against a stub `codex`; no session, agent or host facility is contacted.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const text = path => read(path).replace(/\s+/g, ' ');
const example = (path, name) => read(path).match(new RegExp(`<!-- fsd-example: ${name} -->\\n\`\`\`sh\\n([\\s\\S]*?)\\n\`\`\``))?.[1];
const posix = { skip: process.platform === 'win32' && 'Requires a POSIX shell' };

test('only the first assignment types into a worker pane; later messages use the worker inbox where reachable', () => {
  const messaging = text('references/messaging.md');
  assert.match(messaging, /^# Messages to running workers/);
  assert.match(messaging, /The first submission of an assignment into the tab FSD created for it stays a Herdr `agent prompt`/);
  assert.match(messaging, /Every later message to a running worker/);
  assert.match(messaging, /never types into the worker's terminal/);
  assert.match(messaging, /a worker never types into the coordinator's pane/);
  assert.match(text('SKILL.md'), /later messages to a running worker go through its native inbox where reachable \(\[messaging\]\(references\/messaging\.md\)\)/);
  assert.match(text('references/herdr.md'), /through the worker's native inbox where reachable \(\[messaging\]\(messaging\.md\)\)/);
  assert.match(text('references/herdr.md'), /persist intent, send once, then re-arm that worker's settled-state wait/);
  assert.match(text('references/filesystem.md'), /A later message to a running worker follows \[messaging\]\(messaging\.md\)/);
  assert.match(text('references/worker.md'), /replies through your inbox or a new prompt/);
  for (const role of ['builder', 'workhorse', 'scout', 'reviewer', 'judge'])
    assert.match(text(`agents/${role}.md`), /wait for the coordinator's reply/, `${role} waits for a reply, not a typed prompt`);
  assert.match(text('README.md'), /\[Messaging running workers\]\(references\/messaging\.md\)/);
});

test('each harness pairing names its route and the pane fallback keeps its readiness checks', () => {
  const messaging = text('references/messaging.md');
  assert.match(messaging, /`SendMessage` to the worker's session name, found with `ListAgents`/);
  assert.match(messaging, /Start every Claude Code worker with `--name WORKER_NAME`/);
  assert.match(messaging, /a session started in bare mode binds no inbox/);
  assert.match(messaging, /`codex queue --thread THREAD --message TEXT`/);
  assert.match(messaging, /a worker started with `--no-daemon` runs without that server, so treat its inbox as out of reach \(untested\)/);
  assert.match(messaging, /Herdr exposes no Codex session ID/);
  assert.match(messaging, /A session record whose directory only that worker uses binds it/);
  assert.match(messaging, /an entry matched only by a shared directory and start time is not proof/);
  assert.match(messaging, /Pi and Antigravity workers have no inbox/);
  assert.match(messaging, /Fall back to `herdr agent prompt` only after the pane shows an empty prompt and no open dialog/);
  assert.match(text('references/herdr.md'), /plus `--name WORKER_NAME` for Claude Code/);
});

test('delivery outcomes are classified from evidence, never assumed from a sent message', () => {
  const messaging = text('references/messaging.md');
  assert.match(messaging, /A successful send means the session received the message, not that its model read it/);
  assert.match(messaging, /`crossSessionInbound`/);
  assert.match(messaging, /held for the owner's approval and dropped after `dialogExpiry`/);
  assert.match(messaging, /A held message is `uncertain` until its notice resolves it; never fall back to pane input while it could still be delivered/);
  assert.match(messaging, /FSD never changes the owner's inbound settings/);
  assert.match(messaging, /A loaded idle thread starts a turn from its queue \(seen in the live check below\)/);
  assert.match(messaging, /an unloaded thread keeps the message pending/);
  assert.match(messaging, /A zero exit with `Queued message MESSAGE_ID for thread THREAD_ID\.` means the queue accepted it/);
  assert.match(messaging, /Queue acceptance alone is not delivery/);
  const attempt = text('templates/attempt.md');
  assert.match(attempt, /Delivery route: first-assignment Herdr prompt, worker inbox and its address, or pane fallback and why/);
  assert.match(attempt, /or the `SendMessage` result and any delivery notice/);
});

test('launch keys and dialogs stay Herdr input, and Codex-to-Claude has no documented inbox', () => {
  const messaging = text('references/messaging.md');
  assert.match(messaging, /Startup dialogs, permission-mode keys and harness exit keys are not messages/);
  assert.match(messaging, /No documented route delivers a Codex session's message into a running Claude Code session/);
  assert.match(messaging, /A live check \(below\) delivered a Codex session's message this way/);
  assert.match(messaging, /a custom channel needs the research-preview development flag/);
  assert.match(messaging, /`CLAUDE_CODE_MESSAGING_SOCKET`\) is documented for scripts and hooks, but its message format is not/);
  assert.match(messaging, /`notify_when_idle`/);
  assert.match(messaging, /It is not a qualified FSD wake source/);
  assert.match(text('references/codex.md'), /`codex queue` is the inbox route to a Codex worker \(\[messaging\]\(messaging\.md\)\), not a wakeup facility/);
});

test('the evidence record is dated, versioned and says what no goal has exercised', () => {
  const messaging = text('references/messaging.md');
  assert.match(messaging, /Checked 2026-09-30 with Claude Code 2\.1\.286, Codex CLI 0\.159\.2 and Herdr 0\.9\.1/);
  assert.match(messaging, /openai\/codex#39092/);
  assert.match(messaging, /openai\/codex#44491/);
  assert.match(messaging, /OpenAI's CLI reference does not list `codex queue`/);
  assert.match(messaging, /No FSD goal has sent an inbox follow-up yet/);
  assert.match(messaging, /Live check on 2026-09-30, outside any FSD goal/);
  assert.match(messaging, /the idle thread started a turn within seconds and ran the requested command/);
  assert.match(messaging, /answered through the channel's reply tool/);
  assert.match(messaging, /The development flag found the server only in the project's `\.mcp\.json`; with `--mcp-config` it reported "no MCP server configured with that name"/);
  assert.match(messaging, /MCP server consent, which defaults to "Continue without using this MCP server"/);
});

test('the Codex queue receipt keeps stdout, stderr and exit status, refuses to overwrite, and propagates the status', posix, t => {
  const block = example('references/messaging.md', 'codex-queue-receipt');
  assert(block, 'codex queue receipt example required');
  assert.equal(spawnSync('/bin/sh', ['-n'], { input: block, encoding: 'utf8', timeout: 5000 }).status, 0);
  assert.match(block, /^\( umask 077; set -C; /);
  assert.match(block, /codex queue --thread THREAD --message TEXT;/);
  const root = mkdtempSync(join(tmpdir(), 'fsd queue-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  // The stub records every invocation, so a refused rerun is proven never to send.
  mkdirSync(join(root, 'bin'));
  writeFileSync(join(root, 'bin', 'codex'), '#!/bin/sh\nprintf \'%s\\n\' "$*" >> "$FSD_TEST_LOG"\necho "queued"\necho "stub: warning" >&2\nexit "$FSD_TEST_EXIT"\n', { mode: 0o700 });
  const env = { ...process.env, PATH: `${join(root, 'bin')}:${process.env.PATH ?? '/usr/bin:/bin'}`, FSD_TEST_LOG: join(root, 'calls') };
  const calls = () => { try { return readFileSync(join(root, 'calls'), 'utf8').trim().split('\n'); } catch { return []; } };
  const goal = join(root, 'goal dir');
  mkdirSync(join(goal, 'evidence'), { recursive: true });
  const script = block.replace('GOAL_DIR', goal).replace('ATTEMPT_ID', 'A2');
  const receipt = suffix => join(goal, 'evidence', `A2.receipt.${suffix}`);
  const send = exit => spawnSync('/bin/sh', ['-c', script], { encoding: 'utf8', timeout: 5000, env: { ...env, FSD_TEST_EXIT: String(exit) } });
  const first = send(4);
  assert.equal(first.status, 4, "Codex's own exit status is the command's");
  assert.deepEqual(calls(), ['queue --thread THREAD --message TEXT']);
  assert.equal(readFileSync(receipt('out'), 'utf8'), 'queued\n');
  assert.equal(readFileSync(receipt('err'), 'utf8'), 'stub: warning\nexit 4\n');
  for (const suffix of ['out', 'err']) assert.equal(statSync(receipt(suffix)).mode & 0o777, 0o600);
  assert.equal(send(0).status, 1, 'an existing receipt must be refused');
  assert.equal(calls().length, 1, 'a refused rerun must not send');
  rmSync(receipt('out'));
  assert.equal(send(0).status, 1, 'a lone .err is still a retained receipt');
  assert.equal(calls().length, 1);
  assert.deepEqual(readdirSync(join(goal, 'evidence')), ['A2.receipt.err']);
});
