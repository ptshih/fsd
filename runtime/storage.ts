import { constants, closeSync, existsSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

export const digest = (value: string) => createHash('sha256').update(value).digest('hex');
export const stableJson = (value: unknown): string => JSON.stringify(value, (_key, v) =>
  v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map(k => [k, v[k]])) : v);
const MAX_RECORD = 2 * 1024 * 1024;

export function canonical(path: string): string {
  if (!isAbsolute(path) || /[\0\r\n]/.test(path)) throw new Error('Expected an absolute filesystem path');
  if (existsSync(path)) return realpathSync(path);
  const parent = dirname(path);
  if (parent === path) throw new Error('Cannot resolve path');
  return join(canonical(parent), path.slice(parent.length + (parent.endsWith(sep) ? 0 : 1)));
}

export function within(path: string, root: string): boolean {
  const part = relative(root, path);
  return part === '' || (part !== '..' && !part.startsWith(`..${sep}`) && !isAbsolute(part));
}

export function checkPrivate(path: string, directory = false) {
  if (typeof process.getuid !== 'function') throw new Error('Private FSD storage currently requires POSIX ownership checks');
  const s = lstatSync(path);
  if (s.isSymbolicLink() || s.uid !== process.getuid() || (s.mode & 0o077) ||
      (directory ? !s.isDirectory() : !s.isFile())) throw new Error(`Expected an owner-private ${directory ? 'directory' : 'file'}: ${path}`);
  if (!directory && s.size > MAX_RECORD) throw new Error('FSD record exceeds 2 MiB; preserve evidence and reconcile');
  return s;
}

export function privateDirectory(path: string) {
  if (!isAbsolute(path)) throw new Error('Private directory must be absolute');
  // Canonical parent bindings avoid an intermediate symlink silently moving state.
  if (resolve(path) !== canonical(path)) throw new Error('Private directory must use its canonical path, without symlink aliases');
  if (!existsSync(path)) mkdirSync(path, { recursive: true, mode: 0o700 });
  checkPrivate(path, true);
}

export function readJson(path: string): any {
  checkPrivate(dirname(path), true);
  checkPrivate(path);
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try { return JSON.parse(readFileSync(fd, 'utf8')); } finally { closeSync(fd); }
}

export function optionalJson(path: string): any {
  try { return readJson(path); } catch (e: any) { if (e.code === 'ENOENT') return undefined; throw e; }
}

export function writeJson(path: string, value: unknown) {
  checkPrivate(dirname(path), true);
  if (existsSync(path)) checkPrivate(path);
  const text = JSON.stringify(value, null, 2) + '\n';
  if (Buffer.byteLength(text) > MAX_RECORD) throw new Error('FSD record exceeds 2 MiB; preserve evidence and reconcile');
  const temp = `${path}.${randomUUID()}.tmp`;
  let fd: number | undefined;
  try {
    fd = openSync(temp, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY, 0o600);
    writeFileSync(fd, text); fsyncSync(fd); closeSync(fd); fd = undefined;
    renameSync(temp, path);
    const dirfd = openSync(dirname(path), constants.O_RDONLY);
    try { fsyncSync(dirfd); } finally { closeSync(dirfd); }
  } finally {
    if (fd !== undefined) closeSync(fd);
    try { unlinkSync(temp); } catch (e: any) { if (e.code !== 'ENOENT') throw e; }
  }
}

// One process owns a state directory. Existing leases are never evicted by a
// racing initializer. After an ungraceful host exit, explicitly reconcile the
// recorded PID/token and partial work before removing a stale lease.
export function acquireLease(root: string): () => void {
  privateDirectory(root);
  const lock = join(root, '.lease');
  const token = randomUUID();
  try { mkdirSync(lock, { mode: 0o700 }); }
  catch (e: any) {
    if (e.code !== 'EEXIST') throw e;
    checkPrivate(lock, true);
    throw new Error(`FSD state lease already exists at ${lock}; reconcile its owner before retrying`);
  }
  writeJson(join(lock, 'owner.json'), { pid: process.pid, token });
  return () => {
    const owner = optionalJson(join(lock, 'owner.json'));
    if (owner?.token !== token) throw new Error('FSD lease ownership changed');
    rmSync(lock, { recursive: true });
  };
}

export class RecordStore {
  root: string;
  release: (() => void) | undefined;
  constructor(root: string) {
    this.root = root;
    this.release = acquireLease(root);
    try { for (const dir of ['attempts', 'events', 'revisions', 'evidence']) privateDirectory(join(root, dir)); }
    catch (e) { this.close(); throw e; }
  }
  path(kind: string, id: string) {
    if (!['attempts', 'events', 'revisions', 'evidence'].includes(kind)) throw new Error('Invalid record kind');
    return join(this.root, kind, `${digest(id)}.json`);
  }
  get(kind: string, id: string) { return optionalJson(this.path(kind, id)); }
  put(kind: string, id: string, value: unknown) { writeJson(this.path(kind, id), value); }
  list(kind: string) {
    if (!['attempts', 'events', 'revisions', 'evidence'].includes(kind)) throw new Error('Invalid record kind');
    return readdirSync(join(this.root, kind)).filter(n => /^[a-f0-9]{64}\.json$/.test(n))
      .map(n => readJson(join(this.root, kind, n)));
  }
  manifest() { return optionalJson(join(this.root, 'mission.json')); }
  saveManifest(value: unknown) { writeJson(join(this.root, 'mission.json'), value); }
  close() { const release = this.release; this.release = undefined; release?.(); }
}
