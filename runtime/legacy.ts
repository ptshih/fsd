import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { digest, optionalJson } from './storage.ts';

// Read-only inventory. Never adopts a v1/v2 attempt, changes deadlines, or acknowledges it.
export function inspectLegacy(root: string, sessionId: string) {
  if (!/^[A-Za-z0-9-]{1,128}$/.test(sessionId)) throw new Error('Invalid legacy session ID');
  const dir = join(root, sessionId);
  if (!existsSync(dir)) return { present: false, settled: true, records: [] };
  const records = ['registry.json', 'state.json', 'watch.json'].flatMap(name => {
    const path = join(dir, name); const value = optionalJson(path);
    return value ? [{ path, digest: digest(JSON.stringify(value)), value }] : [];
  });
  const registry = records.find(r => r.path.endsWith('/registry.json'))?.value;
  let states: any[];
  if (registry) {
    if (registry.version !== 2 || !Array.isArray(registry.entries) || !registry.entries.length ||
        !registry.entries.some((e: any) => e.state?.key === registry.active)) throw new Error('Invalid legacy registry; reconcile before migration');
    states = registry.entries.map((e: any) => e.state);
  } else {
    const config = records.find(r => r.path.endsWith('/watch.json'))?.value;
    const state = records.find(r => r.path.endsWith('/state.json'))?.value;
    if (config?.enabled && !state) return { present: true, settled: false, records };
    states = state ? [state] : [];
  }
  // Do not let an old settled registry hide a newer v1 watch/state file.
  const standalone = records.find(r => r.path.endsWith('/state.json'))?.value;
  if (registry && standalone) states.push(standalone);
  const settled = states.every(s => s && ['acknowledged', 'cancelled'].includes(s.status) &&
    Array.isArray(s.probes) && s.probes.every((p: any) => !['queued', 'scheduled'].includes(p.status)));
  return { present: records.length > 0, settled, records };
}
