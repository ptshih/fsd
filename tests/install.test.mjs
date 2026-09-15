import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { plan, apply } from '../scripts/install-local.mjs';
import { canonical, privateDirectory, writeJson } from '../runtime/storage.ts';

function fixture(t) {
  const root = mkdtempSync(join(canonical(tmpdir()), 'fsd-install-')); t.after(() => rmSync(root, { recursive: true, force: true }));
  const options = { agentDir: join(root, 'agent'), legacyRoot: join(root, 'legacy'), backupRoot: join(root, 'backups') };
  const dir = join(options.agentDir, 'extensions/fsd-herdr-completion'); mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.ts'), 'export default function oldBridge() {}\n'); writeFileSync(join(dir, 'core.ts'), 'export const oldCore = true;\n');
  const state = join(options.legacyRoot, '11111111-1111-1111-1111-111111111111'); privateDirectory(state);
  const registry = { version: 2, active: 'a', entries: [{ state: { key: 'a', status: 'acknowledged', probes: [] } }] };
  writeJson(join(state, 'registry.json'), registry);
  return { options, dir, state, registry };
}
test('read-only installation plan leaves entrypoint and legacy evidence unchanged', t => {
  const f = fixture(t); const before = readFileSync(join(f.dir, 'index.ts'), 'utf8'); const p = plan(f.options);
  assert.equal(p.safeToReplace, true); assert.equal(p.inventories.length, 1); assert.equal(readFileSync(p.target, 'utf8'), before);
  assert.throws(() => apply(f.options, 'wrong-hash'), /hash/); assert.equal(readFileSync(p.target, 'utf8'), before);
});
test('explicit installation preserves old code and all legacy records; it neither reloads nor launches', t => {
  const f = fixture(t), p = plan(f.options); const before = readFileSync(join(f.state, 'registry.json'), 'utf8');
  const installed = apply(f.options, p.beforeHash); assert.equal(installed.applied, true);
  assert.equal(readFileSync(join(installed.backup, 'index.ts'), 'utf8'), 'export default function oldBridge() {}\n');
  assert.equal(readFileSync(join(installed.backup, 'core.ts'), 'utf8'), readFileSync(join(f.dir, 'core.ts'), 'utf8'));
  assert.equal(readFileSync(join(f.state, 'registry.json'), 'utf8'), before);
  assert.equal(plan(f.options).alreadyInstalled, true); assert.equal(apply(f.options, p.beforeHash).applied, false);
});
test('unsettled work in any legacy session blocks installation before entrypoint mutation', t => {
  const f = fixture(t); f.registry.entries[0].state.status = 'queued'; writeJson(join(f.state, 'registry.json'), f.registry);
  const p = plan(f.options); assert.equal(p.safeToReplace, false);
  assert.throws(() => apply(f.options, p.beforeHash), /unsettled/); assert.match(readFileSync(p.target, 'utf8'), /oldBridge/);
});
test('settled registry cannot hide a newer unsettled standalone observation', t => {
  const f = fixture(t); writeJson(join(f.state, 'state.json'), { status: 'queued', probes: [] });
  assert.equal(plan(f.options).safeToReplace, false);
});
