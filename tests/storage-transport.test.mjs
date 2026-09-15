import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, readFileSync, writeFileSync, chmodSync, statSync, symlinkSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { canonical, within, privateDirectory, readJson, writeJson, RecordStore, acquireLease } from '../runtime/storage.ts';
import { createTransport, resolveHerdr, nativeCommand, socketIdentity } from '../runtime/transport.ts';
import { binding, worker, agent } from './support.mjs';
import { loader } from '../scripts/pi-host.mjs';

const { ensureIgnored } = await (await loader()).import(new URL('../runtime/index.ts', import.meta.url).pathname);
function temp(t) { const dir = mkdtempSync(join(canonical(tmpdir()), 'fsd-io-')); t.after(() => rmSync(dir, { recursive: true, force: true })); return dir; }

test('private records are atomic, fsynced, owner-only, and oversized updates preserve prior evidence', t => {
  const root = temp(t); privateDirectory(root); const path = join(root, 'state.json'); writeJson(path, { original: true });
  assert.equal(statSync(path).mode & 0o777, 0o600); assert.equal(statSync(root).mode & 0o777, 0o700);
  assert.throws(() => writeJson(path, { huge: 'x'.repeat(3 * 1024 * 1024) }), /2 MiB/);
  assert.deepEqual(readJson(path), { original: true }); assert.deepEqual(readdirSync(root), ['state.json']);
  writeJson(path, { next: true }); assert.deepEqual(readJson(path), { next: true });
});
test('public files, symlink aliases, and relative paths cannot become private machine state', t => {
  const root = temp(t); const path = join(root, 'state.json'); writeJson(path, { ok: true });
  chmodSync(path, 0o644); assert.throws(() => readJson(path), /owner-private/); assert.throws(() => writeJson(path, {}), /owner-private/);
  chmodSync(path, 0o600); symlinkSync(path, join(root, 'alias.json')); assert.throws(() => readJson(join(root, 'alias.json')), /owner-private/);
  mkdirSync(join(root, 'real'), { mode: 0o700 }); symlinkSync(join(root, 'real'), join(root, 'alias'));
  assert.throws(() => privateDirectory(join(root, 'alias')), /canonical/); assert.throws(() => canonical('relative/path'), /absolute/);
});
test('record IDs are hashed, historical checkpoints are independent files, and lease prevents concurrent writers', t => {
  const root = temp(t); const store = new RecordStore(root);
  assert.throws(() => new RecordStore(root), /lease/);
  for (let n = 0; n < 80; n++) store.put('attempts', `A${n}/../../escape`, { id: n });
  assert.equal(store.list('attempts').length, 80); assert.equal(readdirSync(join(root, 'attempts')).length, 80);
  assert.ok(store.path('attempts', '../../outside').startsWith(join(root, 'attempts') + '/'));
  assert.throws(() => store.get('../', 'x'), /Invalid record kind/); store.close();
});
test('stale/uncertain leases fail closed instead of racing to evict another runtime', t => {
  const root = temp(t); mkdirSync(join(root, '.lease'), { mode: 0o700 });
  writeJson(join(root, '.lease/owner.json'), { pid: 999999999, token: 'retain-for-reconciliation' });
  assert.throws(() => acquireLease(root), /reconcile/);
  assert.equal(readJson(join(root, '.lease/owner.json')).token, 'retain-for-reconciliation');
});
test('canonical scopes catch symlink aliases and parent/child overlap without string-prefix mistakes', t => {
  const root = temp(t); mkdirSync(join(root, 'tree')); symlinkSync(join(root, 'tree'), join(root, 'alias'));
  assert.equal(canonical(join(root, 'alias/new/file')), join(root, 'tree/new/file'));
  assert.ok(within(join(root, 'tree/src'), join(root, 'tree')));
  assert.equal(within(join(root, 'tree-other'), join(root, 'tree')), false);
});
test('repository-local storage requires ignore coverage and rejects already tracked private data', t => {
  const root = temp(t); execFileSync('git', ['init', '--quiet', root]); const path = join(root, '.agents/fsd/mission');
  assert.throws(() => ensureIgnored(path), /Git-ignore/);
  writeFileSync(join(root, '.git/info/exclude'), '/.agents/fsd/\n'); assert.doesNotThrow(() => ensureIgnored(path));
  mkdirSync(path, { recursive: true, mode: 0o700 }); writeFileSync(join(path, 'private.json'), '{}');
  execFileSync('git', ['-C', root, 'add', '-f', '.agents/fsd/mission/private.json']);
  assert.throws(() => ensureIgnored(path), /tracked files/);
});
test('external non-repository storage does not require Git configuration', t => {
  const root = temp(t); assert.doesNotThrow(() => ensureIgnored(join(root, 'external-mission')));
});
test('transport uses PATH resolution and Herdr positional TARGET/TEXT before options', async t => {
  const calls = [], w = worker();
  const transport = createTransport(binding, async (binary, args, b, signal, timeout) => {
    calls.push({ binary, args, b, timeout }); return { code: 0, stdout: JSON.stringify({ result: { type: 'agent_prompted', agent: agent(w, 'working', 11) } }), stderr: '' };
  }, () => '/verified/herdr');
  await transport.prompt(w, '--not-a-flag; $(never-run)', 10000);
  const c = calls[0]; assert.equal(c.binary, '/verified/herdr');
  assert.deepEqual(c.args.slice(0, 4), ['agent', 'prompt', w.pane, '--not-a-flag; $(never-run)']);
  assert.equal(c.args[4], '--wait'); assert.equal(c.args.includes('--'), false);
  assert.equal(c.timeout, 11000); assert.equal(c.b.socketPath, binding.socketPath);
  const root = temp(t); const binary = join(root, 'herdr'); writeFileSync(binary, '#!/bin/sh\nexit 0\n', { mode: 0o700 });
  assert.equal(resolveHerdr(root), binary); assert.throws(() => resolveHerdr(join(root, 'missing')), /unavailable/);
});
test('native waits exclude the current state, especially blocked and settled states', async () => {
  const calls = []; const transport = createTransport(binding, async (_b, args) => { calls.push(args); return { code: 0, stdout: '{"result":{"ok":true}}', stderr: '' }; }, () => '/fake/herdr');
  for (const status of ['working', 'blocked', 'idle', 'done']) {
    await transport.wait(worker(), status, 1000); const args = calls.at(-1);
    const until = args.flatMap((x, i) => x === '--until' ? [args[i + 1]] : []);
    assert.ok(!until.includes(status));
    if (['idle', 'done'].includes(status)) { assert.ok(!until.includes('idle')); assert.ok(!until.includes('done')); }
  }
});
test('malformed/failed native state requests are errors rather than success receipts', async () => {
  for (const receipt of [{ code: 1, stdout: '', stderr: 'failed' }, { code: 0, stdout: 'not-json', stderr: '' }, { code: 0, stdout: '{"error":{}}', stderr: '' }]) {
    const transport = createTransport(binding, async () => receipt, () => '/fake/herdr');
    await assert.rejects(transport.get(worker()));
  }
});
test('native command pins the host socket incarnation and honors pre-aborted requests', async t => {
  const root = temp(t), socket = join(root, 's'); const server = createServer(); server.listen(socket); await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  const b = { ...binding, socketPath: socket, socketIdentity: socketIdentity(socket) };
  const result = await nativeCommand(process.execPath, ['-e', 'process.stdout.write(JSON.stringify({result:{ok:true}}))'], b);
  assert.equal(result.code, 0); assert.equal(JSON.parse(result.stdout).result.ok, true);
  assert.throws(() => nativeCommand(process.execPath, [], { ...b, socketIdentity: 'another-host' }), /incarnation/);
  const controller = new AbortController(); controller.abort(); assert.throws(() => nativeCommand(process.execPath, [], b, controller.signal));
});
