import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter, once } from 'node:events';
import { createServer } from 'node:net';
import { existsSync, mkdtempSync, rmSync, cpSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { installUIBlockerBridge } from '../runtime/ui-blocked.ts';
import { locatePi, loader } from '../scripts/pi-host.mjs';

const { ExtensionRunner } = await import(pathToFileURL(join(locatePi(), 'dist/core/extensions/runner.js')));
const turn = () => new Promise(resolve => setImmediate(resolve));
const context = (id = 'session-a', mode = 'tui') => ({ mode, sessionManager: { getSessionId: () => id } });
function fixture(enabled = true) {
  const handlers = new Map(), events = new EventEmitter(), reports = [];
  events.on('herdr:blocked', e => reports.push(e));
  const pi = { events, on: (name, handler) => handlers.set(name, [...(handlers.get(name) ?? []), handler]) };
  installUIBlockerBridge(pi, enabled);
  const emit = async (name, ctx = context(), data = {}) => {
    for (const fn of handlers.get(name) ?? []) await fn({ type: name, reason: 'ui_prompt', kind: 'confirm', ...data }, ctx);
  };
  return { handlers, events, reports, pi, emit };
}
function runnerFixture(ui) {
  const f = fixture();
  const sessionManager = { getSessionId: () => 'session-a', getSessionFile: () => '/fixture/session-a.jsonl' };
  f.runner = new ExtensionRunner([{ path: '/fixture/bridge.ts', handlers: f.handlers }], {}, '/fixture', sessionManager, {});
  f.errors = []; f.runner.onError(e => f.errors.push(e));
  f.runner.setUIContext(ui, 'tui');
  return f;
}

test('production entrypoint wires the UI bridge alongside the inert runtime', async () => {
  const old = Object.fromEntries(['HERDR_ENV', 'HERDR_PANE_ID', 'HERDR_SOCKET_PATH'].map(k => [k, process.env[k]]));
  try {
    Object.assign(process.env, { HERDR_ENV: '1', HERDR_PANE_ID: 'fixture:p1', HERDR_SOCKET_PATH: '/fixture/not-a-socket' });
    const hooks = new Map(), tools = [];
    const api = { on: (name, fn) => hooks.set(name, [...(hooks.get(name) ?? []), fn]), registerTool: t => tools.push(t.name),
      events: { emit: () => assert.fail('Factory must not emit telemetry') } };
    const entry = await (await loader()).import(new URL('../runtime/index.ts', import.meta.url).pathname, { default: true });
    entry(api);
    assert.equal(hooks.get('ui_prompt_start').length, 1);
    assert.equal(hooks.get('session_start').length, 2);
    assert.deepEqual(tools, ['fsd_runtime']);
  } finally { for (const [k, v] of Object.entries(old)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; } }
});

test('bridge has no factory side effects; disabled environments register nothing', async () => {
  const off = fixture(false); assert.equal(off.handlers.size, 0);
  const f = fixture(); assert.deepEqual(f.reports, []);
  await f.emit('ui_prompt_start'); assert.deepEqual(f.reports, []);
  await f.emit('session_start'); assert.deepEqual(f.reports, []);
});
test('only the bound interactive session contributes; no prompt text or approval is forwarded', async () => {
  const f = fixture(); await f.emit('session_start');
  await f.emit('ui_prompt_start', context('other'));
  for (const mode of ['rpc', 'json', 'print']) await f.emit('ui_prompt_start', context('session-a', mode));
  assert.deepEqual(f.reports, []);
  await f.emit('ui_prompt_start', context(), { title: 'PRIVATE PROMPT CONTENT' });
  await f.emit('ui_prompt_end', context('other')); assert.equal(f.reports.length, 1);
  await f.emit('ui_prompt_end');
  assert.deepEqual(f.reports, [{ active: true, label: 'Waiting for Pi UI (confirm)' }, { active: false }]);
});
test('one contribution per coalesced span; duplicate or unmatched ends never clear another blocker', async () => {
  const f = fixture(); await f.emit('session_start');
  await f.emit('ui_prompt_end'); await f.emit('ui_prompt_start'); await f.emit('ui_prompt_start');
  await f.emit('ui_prompt_end'); await f.emit('ui_prompt_end');
  assert.deepEqual(f.reports.map(e => e.active), [true, false]);
});
test('shutdown/restart releases only the owned contribution and ignores late old-session events', async () => {
  const f = fixture(); await f.emit('session_start'); await f.emit('ui_prompt_start');
  await f.emit('session_shutdown'); await f.emit('session_shutdown'); await f.emit('ui_prompt_start');
  await f.emit('session_start', context('session-b'));
  await f.emit('ui_prompt_start', context('session-b'));
  await f.emit('ui_prompt_end', context()); assert.equal(f.reports.length, 3);
  await f.emit('ui_prompt_end', context('session-b'));
  assert.deepEqual(f.reports.map(e => e.active), [true, false, true, false]);
});
for (const kind of ['confirm', 'select', 'input', 'editor', 'custom']) {
  test(`actual Pi runner brackets ${kind} and preserves the untouched return value`, async () => {
    const deferred = Promise.withResolvers();
    const f = runnerFixture({ [kind]: () => deferred.promise });
    await f.runner.emit({ type: 'session_start', reason: 'startup' });
    const result = f.runner.getUIContext()[kind]('PRIVATE TITLE', 'PRIVATE INPUT');
    await turn(); assert.deepEqual(f.reports, [{ active: true, label: `Waiting for Pi UI (${kind})` }]);
    deferred.resolve(false); assert.equal(await result, false); await turn();
    assert.deepEqual(f.reports.map(e => e.active), [true, false]); assert.deepEqual(f.errors, []);
  });
}
test('actual Pi overlapping spans stay blocked until the last promise settles', async () => {
  const a = Promise.withResolvers(), b = Promise.withResolvers();
  const f = runnerFixture({ confirm: () => a.promise, input: () => b.promise });
  await f.runner.emit({ type: 'session_start', reason: 'startup' });
  const first = f.runner.getUIContext().confirm('a', 'a');
  const second = f.runner.getUIContext().input('b');
  await turn(); a.resolve(false); await first; await turn();
  assert.deepEqual(f.reports.map(e => e.active), [true]);
  b.resolve(undefined); await second; await turn();
  assert.deepEqual(f.reports.map(e => e.active), [true, false]); assert.deepEqual(f.errors, []);
});
for (const sync of [false, true]) test(`actual Pi releases the span on ${sync ? 'throw' : 'rejection'}`, async () => {
  const f = runnerFixture({ confirm: () => { if (sync) throw Error('fixture'); return Promise.reject(Error('fixture')); } });
  await f.runner.emit({ type: 'session_start', reason: 'startup' });
  await assert.rejects(async () => f.runner.getUIContext().confirm('title', 'message'), /fixture/);
  await turn(); assert.deepEqual(f.reports.map(e => e.active), [true, false]); assert.deepEqual(f.errors, []);
});

// Optional host-contract coverage: execute the unchanged installed Herdr integration
// against a private socket. No Herdr server, workers, or model requests are involved.
const managed = join(homedir(), '.pi/agent/extensions/herdr-agent-state.ts');
test('installed Herdr reporter + actual Pi UI lifecycle preserve nested external blockers and resume',
  { skip: !existsSync(managed), timeout: 5000 }, async t => {
    const root = mkdtempSync('/tmp/fsd-ui-wire-');
    const socketPath = join(root, 's'), packets = [], received = new EventEmitter();
    const server = createServer(socket => {
      let text = '';
      socket.on('data', bytes => {
        text += bytes;
        if (!text.includes('\n')) return;
        const packet = JSON.parse(text.trim()); packets.push(packet);
        socket.end(JSON.stringify({ id: packet.id, result: { type: 'ok' } }) + '\n');
        received.emit('packet', packet);
      });
    });
    t.after(async () => { await new Promise(r => server.close(r)); rmSync(root, { recursive: true, force: true }); });
    server.listen(socketPath); await once(server, 'listening');
    const old = Object.fromEntries(['HERDR_ENV', 'HERDR_PANE_ID', 'HERDR_SOCKET_PATH'].map(k => [k, process.env[k]]));
    let install;
    try {
      Object.assign(process.env, { HERDR_ENV: '1', HERDR_PANE_ID: 'fixture:p1', HERDR_SOCKET_PATH: socketPath });
      cpSync(managed, join(root, 'herdr.ts'));
      install = await (await loader()).import(join(root, 'herdr.ts'), { default: true });
    } finally { for (const [k, v] of Object.entries(old)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; } }
    const deferred = Promise.withResolvers(), f = runnerFixture({ confirm: () => deferred.promise });
    install(f.pi);
    const next = (state, after = 0) => {
      const matches = p => p.method === 'pane.report_agent' && p.params.state === state;
      const found = packets.slice(after).find(matches); if (found) return Promise.resolve(found);
      return new Promise(resolve => { const handler = p => { if (matches(p)) { received.off('packet', handler); resolve(p); } }; received.on('packet', handler); });
    };
    await f.runner.emit({ type: 'session_start', reason: 'startup' }); await next('idle');
    await f.runner.emit({ type: 'agent_start' }); await next('working');
    const checkpoint = f.runner.getUIContext().confirm('PRIVATE TITLE', 'PRIVATE INPUT');
    await next('blocked');
    const marker = packets.length;
    f.events.emit('herdr:blocked', { active: true, label: 'independent blocker' });
    deferred.resolve(false); assert.equal(await checkpoint, false); await turn();
    assert.equal(packets.slice(marker).some(p => p.params.state === 'working'), false);
    f.events.emit('herdr:blocked', { active: false }); await next('working', marker);
    const settle = packets.length;
    await f.runner.emit({ type: 'agent_settled' }); await next('idle', settle);
    assert.equal(JSON.stringify(packets).includes('PRIVATE'), false);
    for (const p of packets) { assert.equal(p.params.pane_id, 'fixture:p1'); assert.equal(p.params.agent_session_path, '/fixture/session-a.jsonl'); }
    assert.deepEqual(f.errors, []);
  });
