import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, existsSync, readFileSync, writeFileSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonical, optionalJson, privateDirectory, writeJson } from '../runtime/storage.ts';
import { Clock, Transport, worker, flush } from './support.mjs';
import { loader } from '../scripts/pi-host.mjs';

const entry = fileURLToPath(new URL('../runtime/index.ts', import.meta.url));
const loaded = await (await loader()).import(entry);
function fixture(t) {
  const root = mkdtempSync(join(canonical(tmpdir()), 'fsd-extension-'));
  const stateRoot = join(root, 'sessions'), legacyRoot = join(root, 'legacy'), missionPath = join(root, 'mission');
  const clock = new Clock(), transport = new Transport(), handlers = new Map(), tools = new Map(), sent = [], notices = [];
  const f = { root, stateRoot, legacyRoot, missionPath, clock, transport, handlers, tools, sent, notices, idle: false };
  const binding = { sessionId: '22222222-2222-2222-2222-222222222222', sessionFile: join(root, 'session.jsonl'), cwd: root,
    parentPane: 'w1:p1', socketPath: join(root, 'socket'), socketIdentity: 'test:1' };
  f.ctx = { mode: 'tui', cwd: root, isIdle: () => f.idle,
    sessionManager: { getSessionId: () => binding.sessionId, getSessionFile: () => binding.sessionFile },
    ui: { getEditorText: () => 'PRIVATE HUMAN DRAFT', notify: (m, level) => notices.push({ m, level }) } };
  f.pi = { on: (n, fn) => handlers.set(n, fn), registerTool: tool => tools.set(tool.name, tool), sendMessage: (m, o) => sent.push({ m, o }) };
  f.dependencies = { stateRoot, legacyRoot, binding, transport, clock, now: clock.now, herdrEnabled: true, ensureIgnored: () => {} };
  loaded.installRuntime(f.pi, f.dependencies);
  f.start = () => handlers.get('session_start')({}, f.ctx);
  f.stop = () => handlers.get('session_shutdown')();
  f.call = args => tools.get('fsd_runtime').execute('test', args, undefined, undefined, f.ctx);
  f.envelope = { goal: 'Test delivery', doneCriteria: 'Actual fixture checks', scope: 'Fixture only', authorityBasis: 'Test coordinator request',
    limits: 'Two workers, original deadline', usage: 'zero', deadline: new Date(clock.time + 3600000).toISOString(),
    maxWorkers: 2, kinds: ['pi'], workspaces: [worker().cwd, worker(3).cwd] };
  f.open = (id = 'mission', path = missionPath) => f.call({ action: 'open', missionId: id, missionPath: path, envelope: f.envelope });
  f.qualify = async () => {
    for (const idle of [false, true]) { f.idle = idle; const r = await f.call({ action: 'control', operation: 'probe' }); clock.tick(0); await f.call({ action: 'ack', eventId: r.details.eventId }); }
    f.idle = false;
  };
  t.after(async () => { await f.stop(); rmSync(root, { recursive: true, force: true }); });
  return f;
}

test('real Pi-loaded factory is inert; ordinary status does not create files or launch processes', async t => {
  const f = fixture(t); assert.equal(existsSync(f.stateRoot), false); await f.start();
  const r = await f.call({ action: 'inspect' }); assert.equal(r.details.loaded, false);
  assert.equal(existsSync(f.stateRoot), false); assert.equal(f.transport.prompts.length, 0); assert.equal(f.sent.length, 0);
  assert.deepEqual([...f.tools.keys()], ['fsd_runtime']);
});
test('fresh open works without config/reload; probes use custom safe-boundary messages and preserve drafts', async t => {
  const f = fixture(t); await f.start(); const opened = await f.open();
  assert.equal(opened.details.loaded, true); assert.equal(f.transport.gets, 0);
  await f.qualify(); const status = await f.call({ action: 'inspect' });
  assert.equal(status.details.capabilities.automaticDeliveryVerified, true);
  assert.match(status.content[0].text, /"revision":1/); assert.match(status.content[0].text, /"automaticDeliveryVerified":true/);
  assert.equal(f.sent.length, 2);
  for (const { m, o } of f.sent) {
    assert.equal(m.display, false); assert.equal(m.customType, 'fsd-runtime'); assert.ok(m.content.length < 1500);
    assert.deepEqual(o, { triggerTurn: true, deliverAs: 'steer' }); assert.ok(!JSON.stringify(m).includes('PRIVATE HUMAN DRAFT'));
  }
  assert.equal(f.ctx.ui.getEditorText(), 'PRIVATE HUMAN DRAFT');
});
test('idle qualification is triggered only by the actual idle settled hook, not wall-clock latency', async t => {
  const f = fixture(t); await f.start(); await f.open();
  const p = await f.call({ action: 'control', operation: 'probe', probeWhen: 'idle' });
  f.clock.tick(20000); assert.equal(f.sent.length, 0);
  await f.handlers.get('agent_settled')({}, f.ctx); assert.equal(f.sent.length, 0);
  f.idle = true; await f.handlers.get('agent_settled')({}, f.ctx); assert.equal(f.sent.length, 1);
  const ack = await f.call({ action: 'ack', eventId: p.details.eventId });
  assert.equal(ack.details.capabilities.wakeupEvidence.idle, true);
  assert.equal(f.ctx.ui.getEditorText(), 'PRIVATE HUMAN DRAFT');
  await f.handlers.get('agent_settled')({}, f.ctx); assert.equal(f.sent.length, 1);
});
test('reload retires the old activation idle probe without letting it wake the next activation', async t => {
  const f = fixture(t); await f.start(); await f.open();
  await f.call({ action: 'control', operation: 'probe', probeWhen: 'idle' }); await f.stop();
  loaded.installRuntime(f.pi, f.dependencies); await f.start();
  f.idle = true; await f.handlers.get('agent_settled')({}, f.ctx);
  assert.equal(f.sent.length, 0);
});
test('second mission opens in same conversation without prior registration counters or another reload', async t => {
  const f = fixture(t); await f.start(); await f.open();
  await f.call({ action: 'close', outcome: 'delivered', evidence: 'Direct tests', cleanup: 'No workers' });
  const r = await f.open('next', join(f.root, 'next-mission'));
  assert.equal(r.details.missionId, 'next'); assert.equal(f.transport.prompts.length, 0);
});
test('entrypoint dispatch uses the real core and rejects changed coordinator bindings', async t => {
  const f = fixture(t); await f.start(); await f.open(); await f.qualify(); const w = f.transport.add(worker()); f.transport.fast = true;
  const submission = { attemptId: 'A1-1', assignment: 'A1', revision: 1, worker: w, role: 'read-only', writePaths: [], prompt: 'Inspect only',
    readyRevision: 10, emptyPromptVerified: true, readinessEvidence: 'Read exact empty prompt' };
  const r = await f.call({ action: 'submit', submission }); await flush(); assert.equal(r.details.phase, 'observing');
  assert.equal(f.transport.prompts.length, 1);
  f.dependencies.binding = { ...f.dependencies.binding, socketIdentity: 'changed' };
  await assert.rejects(f.call({ action: 'inspect', attemptId: 'A1-1', reconcile: true }), /binding changed/);
});
test('legacy unsettled observations block open; settled evidence is retained without altering original files', async t => {
  const f = fixture(t); const dir = join(f.legacyRoot, f.dependencies.binding.sessionId); privateDirectory(dir);
  const registry = { version: 2, active: 'old', entries: [{ config: { deadline: '2026-01-01T00:00:00Z' }, state: { key: 'old', status: 'queued', probes: [] } }] };
  writeJson(join(dir, 'registry.json'), registry); await f.start();
  await assert.rejects(f.open(), /Legacy observation/); assert.equal(f.transport.prompts.length, 0);
  registry.entries[0].state.status = 'acknowledged'; writeJson(join(dir, 'registry.json'), registry);
  const before = readFileSync(join(dir, 'registry.json'), 'utf8'); await f.open();
  assert.equal(readFileSync(join(dir, 'registry.json'), 'utf8'), before);
  const evidenceDir = join(f.missionPath, 'runtime', 'evidence');
  assert.equal(existsSync(evidenceDir), true);
});
test('legacy bootstrap-without-state and pending probes are not silently ignored', async t => {
  const f = fixture(t); const dir = join(f.legacyRoot, f.dependencies.binding.sessionId); privateDirectory(dir);
  writeJson(join(dir, 'watch.json'), { enabled: true }); await f.start(); await assert.rejects(f.open(), /unsettled/);
  writeJson(join(dir, 'state.json'), { status: 'acknowledged', probes: [{ status: 'queued' }] });
  await assert.rejects(f.open(), /unsettled/);
});
test('same-session reload resumes records, drops old probe qualification, and never sends another worker prompt', async t => {
  const f = fixture(t); await f.start(); await f.open(); await f.qualify();
  await f.stop(); loaded.installRuntime(f.pi, f.dependencies); await f.start();
  const r = await f.call({ action: 'inspect' }); assert.equal(r.details.loaded, true);
  assert.equal(r.details.capabilities.automaticDeliveryVerified, false); assert.equal(f.transport.prompts.length, 0);
});
test('a different Pi session does not inherit an old active mission', async t => {
  const f = fixture(t); await f.start(); await f.open(); await f.stop();
  f.dependencies.binding = { ...f.dependencies.binding, sessionId: '33333333-3333-3333-3333-333333333333' };
  f.ctx.sessionManager.getSessionId = () => f.dependencies.binding.sessionId;
  loaded.installRuntime(f.pi, f.dependencies); await f.start();
  assert.equal((await f.call({ action: 'inspect' })).details.loaded, false);
});
test('scheduled probes cannot wake after shutdown or cancellation of the conversation runtime', async t => {
  const f = fixture(t); await f.start(); await f.open();
  await f.call({ action: 'control', operation: 'probe', delayMs: 100 }); await f.stop(); f.clock.tick(100);
  assert.equal(f.sent.length, 0);
});
test('headless modes cannot open this TUI-only adapter', async t => {
  const f = fixture(t); f.ctx.mode = 'rpc'; await f.start(); await assert.rejects(f.open(), /interactive/);
  assert.equal(existsSync(f.stateRoot), false);
});
test('late handoff reconciliation cannot write old attempt records into a new mission', async t => {
  const f = fixture(t); await f.start(); await f.open(); await f.qualify(); const w = f.transport.add(worker());
  await f.call({ action: 'submit', submission: { attemptId: 'A1-1', assignment: 'A1', revision: 1, worker: w,
    role: 'read-only', writePaths: [], prompt: 'Inspect only', readyRevision: 10, emptyPromptVerified: true, readinessEvidence: 'Inspected empty prompt' } });
  await f.call({ action: 'control', operation: 'retire', attemptId: 'A1-1', disposition: 'incomplete', reason: 'Handoff', evidence: 'Partial report', handoff: 'Owner now owns remaining work' });
  let release; f.transport.getHook = () => new Promise(r => { release = r; });
  const pending = f.call({ action: 'control', operation: 'retire', attemptId: 'A1-1', reason: 'Reconcile', evidence: 'Worker stopped' });
  await f.call({ action: 'close', outcome: 'blocked', evidence: 'Transferred incomplete work', cleanup: 'Named owner retains original worker' });
  await f.open('next', join(f.root, 'next')); f.transport.move(w, 'done'); release(structuredClone(f.transport.states.get(w.pane)));
  await assert.rejects(pending, /Mission changed/); assert.deepEqual((await f.call({ action: 'inspect' })).details.attempts, []);
  f.transport.getHook = undefined;
});
test('orphaned same-session mission is explicitly restored without resetting allowance or resending work', async t => {
  const f = fixture(t); await f.start(); await f.open(); await f.stop();
  const { readdirSync, unlinkSync } = await import('node:fs');
  const sessionDir = join(f.stateRoot, readdirSync(f.stateRoot)[0]); unlinkSync(join(sessionDir, 'active.json'));
  loaded.installRuntime(f.pi, f.dependencies); await f.start();
  assert.equal((await f.call({ action: 'inspect' })).details.loaded, false);
  const r = await f.open(); assert.equal(r.details.loaded, true); assert.equal(r.details.deadline, f.envelope.deadline);
  assert.equal(f.transport.prompts.length, 0);
});
test('installed Jiti refreshes transitive TypeScript dependency during a same-process reload', async t => {
  const root = mkdtempSync(join(canonical(tmpdir()), 'fsd-loader-')); t.after(() => rmSync(root, { recursive: true, force: true }));
  cpSync(dirname(entry), join(root, 'runtime'), { recursive: true });
  const stub = join(root, 'version.ts'); writeFileSync(stub, "import {RUNTIME_VERSION} from './runtime/core.ts'; export default RUNTIME_VERSION;");
  const first = await (await loader()).import(stub, { default: true }); assert.equal(first, 3);
  const core = join(root, 'runtime/core.ts'); writeFileSync(core, readFileSync(core, 'utf8').replace('RUNTIME_VERSION = 3', 'RUNTIME_VERSION = 4'));
  const second = await (await loader()).import(stub, { default: true }); assert.equal(second, 4);
});
