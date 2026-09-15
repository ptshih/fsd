// Explicit local installation only. Never reloads Pi or touches workers.
import { existsSync, readFileSync, readdirSync, writeFileSync, chmodSync, copyFileSync, renameSync, unlinkSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { homedir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { canonical, digest, privateDirectory, writeJson } from '../runtime/storage.ts';
import { inspectLegacy } from '../runtime/legacy.ts';

export function plan({ agentDir = process.env.PI_CODING_AGENT_DIR ?? join(homedir(), '.pi/agent'),
  legacyRoot = join(homedir(), '.local/state/fsd/herdr-pi') } = {}) {
  const target = canonical(join(agentDir, 'extensions/fsd-herdr-completion/index.ts'));
  if (!existsSync(target)) throw new Error('Existing bridge entrypoint not found; use Pi package installation for a fresh host');
  const source = fileURLToPath(new URL('../runtime/index.ts', import.meta.url));
  let importPath = relative(dirname(target), source); if (!importPath.startsWith('.')) importPath = `./${importPath}`;
  const replacement = '// FSD v3 source entrypoint. Installation is not activation or live qualification.\n' +
    `export { default } from ${JSON.stringify(importPath)};\n`;
  const inventories = [];
  if (existsSync(legacyRoot)) for (const name of readdirSync(legacyRoot)) {
    if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(name)) continue;
    inventories.push({ sessionId: name, ...inspectLegacy(legacyRoot, name) });
  }
  const before = readFileSync(target, 'utf8');
  return { target, source, beforeHash: digest(before), afterHash: digest(replacement), replacement,
    safeToReplace: inventories.every(i => i.settled), inventories, alreadyInstalled: before === replacement };
}
export function apply(options = {}, expectedHash) {
  const p = plan(options);
  if (p.alreadyInstalled) return { ...p, applied: false };
  if (!p.safeToReplace) throw new Error('Legacy observations/probes are unsettled; no files were changed');
  if (p.beforeHash !== expectedHash) throw new Error('Entrypoint hash does not match the reviewed plan; no files were changed');
  const backupRoot = options.backupRoot ?? join(homedir(), '.local/state/fsd/herdr-pi/backups');
  const backup = canonical(join(backupRoot, `${new Date().toISOString().replaceAll(':', '-')}-${randomUUID()}`));
  privateDirectory(backup);
  const retained = [];
  for (const name of ['index.ts', 'core.ts', 'core.mjs']) {
    const path = join(dirname(p.target), name); if (!existsSync(path)) continue;
    copyFileSync(path, join(backup, name)); chmodSync(join(backup, name), 0o600);
    retained.push({ name, sha256: digest(readFileSync(path, 'utf8')) });
  }
  writeJson(join(backup, 'installation.json'), { ...p, retained, applied: false });
  // Recheck the original immediately before replacement. The live process is
  // intentionally not reloaded; this cannot settle work in another process.
  if (digest(readFileSync(p.target, 'utf8')) !== p.beforeHash || !plan(options).safeToReplace) throw new Error(`Bridge changed during backup; stop and inspect ${backup}`);
  const temporary = join(dirname(p.target), `.fsd-install-${randomUUID()}.ts`);
  try { writeFileSync(temporary, p.replacement, { mode: 0o600, flag: 'wx' }); renameSync(temporary, p.target); }
  finally { try { unlinkSync(temporary); } catch (e) { if (e.code !== 'ENOENT') throw e; } }
  writeJson(join(backup, 'installation.json'), { ...p, retained, applied: true });
  return { ...p, applied: true, backup };
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  if (args.length && !(args.length === 2 && args[0] === '--apply' && /^[a-f0-9]{64}$/.test(args[1]))) throw new Error('Usage: install-local.mjs [--apply REVIEWED_ENTRYPOINT_SHA256]');
  const p = args.length ? apply({}, args[1]) : plan();
  console.log(JSON.stringify({ target: p.target, source: p.source, beforeHash: p.beforeHash,
    safeToReplace: p.safeToReplace, alreadyInstalled: p.alreadyInstalled, applied: p.applied ?? false, backup: p.backup,
    legacy: p.inventories.map(i => ({ sessionId: i.sessionId, safeToReplace: i.settled, files: i.records.map(f => ({ path: f.path, digest: f.digest })) })),
    next: 'No Pi reload or worker launch performed. Live qualification is a separate approved step.' }, null, 2));
}
