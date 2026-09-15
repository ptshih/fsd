import { Runtime } from '../runtime/core.ts';
import { digest } from '../runtime/storage.ts';
import { setImmediate as immediate } from 'node:timers/promises';

export const flush = async () => { await immediate(); await immediate(); };
export const binding = { sessionId: '11111111-1111-1111-1111-111111111111', sessionFile: '/fsd-test/session.jsonl', cwd: '/fsd-test/project', parentPane: 'w1:p1', socketPath: '/fsd-test/herdr.sock', socketIdentity: '1:1' };
export const worker = (n = 2, cwd = `/fsd-test/worktree-${n}`) => ({ pane: `w1:p${n}`, tab: `w1:t${n}`, terminal: `term-${n}`, nativeSession: `native-${n}`, kind: 'pi', cwd });
export const agent = (w, status = 'idle', sequence = 10) => ({ pane_id: w.pane, tab_id: w.tab, terminal_id: w.terminal, agent: w.kind,
  agent_session: { value: w.nativeSession }, cwd: w.cwd, foreground_cwd: w.cwd, agent_status: status,
  state_change_seq: sequence, revision: sequence, interactive_ready: status === 'idle' || status === 'done' });

export class Clock {
  time = Date.parse('2026-09-15T12:00:00Z');
  timers = new Map();
  count = 0;
  now = () => this.time;
  set = (fn, ms) => { const key = ++this.count; this.timers.set(key, { fn, at: this.time + ms }); return key; };
  clear = key => this.timers.delete(key);
  tick(ms) {
    this.time += ms;
    for (const [id, t] of [...this.timers]) if (t.at <= this.time) { this.timers.delete(id); t.fn(); }
  }
}
export class MemoryStore {
  root;
  data = new Map();
  closed = false;
  failWrite;
  constructor(root = '/fsd-test/mission/runtime') { this.root = root; }
  path(kind, id) { return `${this.root}/${kind}/${digest(id)}.json`; }
  get(kind, id) { return structuredClone(this.data.get(`${kind}/${id}`)); }
  put(kind, id, value) {
    if (this.failWrite?.(kind, id, value)) throw new Error('disk unavailable');
    this.data.set(`${kind}/${id}`, structuredClone(value));
  }
  list(kind) { return [...this.data].filter(([k]) => k.startsWith(`${kind}/`)).map(([, v]) => structuredClone(v)); }
  manifest() { return this.get('meta', 'mission'); }
  saveManifest(value) { this.put('meta', 'mission', value); }
  close() { this.closed = true; }
}
export class Transport {
  states = new Map();
  prompts = [];
  waits = new Map();
  gets = 0;
  getHook;
  promptHook;
  fast = false;
  add(w) { this.states.set(w.pane, agent(w)); return w; }
  async get(w, signal) {
    this.gets++; signal?.throwIfAborted();
    if (this.getHook) return this.getHook(w, signal);
    const a = this.states.get(w.pane);
    if (!a) throw new Error('worker unavailable');
    return structuredClone(a);
  }
  async prompt(w, text, timeout, signal) {
    signal?.throwIfAborted(); this.prompts.push({ w, text, timeout });
    if (this.promptHook) return this.promptHook(w, text, timeout, signal);
    this.move(w, this.fast ? 'done' : 'working');
    return { code: 0, stdout: JSON.stringify({ result: { type: 'agent_prompted', agent: this.states.get(w.pane) } }), stderr: '' };
  }
  wait(w, status, remaining, signal) {
    return new Promise((resolve, reject) => {
      const row = { status, resolve: () => { cleanup(); resolve({}); } };
      const abort = () => { cleanup(); reject(new Error('aborted')); };
      const cleanup = () => { this.waits.get(w.pane)?.delete(row); signal?.removeEventListener('abort', abort); };
      const set = this.waits.get(w.pane) ?? new Set(); this.waits.set(w.pane, set); set.add(row);
      signal?.addEventListener('abort', abort, { once: true }); if (signal?.aborted) abort();
    });
  }
  move(w, status) {
    const a = this.states.get(w.pane); a.agent_status = status; a.state_change_seq++; a.revision++; a.interactive_ready = ['idle', 'done'].includes(status);
    for (const wait of [...(this.waits.get(w.pane) ?? [])]) if (wait.status !== status) wait.resolve();
  }
}
export function fixture() {
  const clock = new Clock(), transport = new Transport(), store = new MemoryStore(), sent = [], errors = [];
  const f = { clock, transport, store, sent, errors, idle: false, throwDelivery: false };
  f.options = { binding, transport, now: clock.now, clock, createStore: () => store,
    notify: e => { if (f.throwDelivery) throw new Error('queue unavailable'); sent.push(structuredClone(e)); return { idleAtEnqueue: f.idle, editorUnchanged: true }; },
    onError: e => errors.push(e.message) };
  f.runtime = new Runtime(f.options);
  f.envelope = { goal: 'Deliver test outcome', doneCriteria: 'Verified tests', scope: 'Test worktrees', authorityBasis: 'Explicit test fixture',
    limits: 'Four workers; original deadline', usage: 'Known zero fixture usage', deadline: new Date(clock.time + 3600000).toISOString(),
    maxWorkers: 4, kinds: ['pi'], workspaces: [worker(2).cwd, worker(3).cwd, worker(4).cwd, worker(5).cwd] };
  f.runtime.open('test-mission', store.root, f.envelope);
  f.submission = (w = worker(2), attemptId = 'A1-1') => ({ attemptId, assignment: attemptId.split('-')[0], revision: f.runtime.mission.revision,
    worker: w, role: 'writer', writePaths: [w.cwd], prompt: 'Do the narrow test assignment.',
    readyRevision: transport.states.get(w.pane)?.revision ?? 10, emptyPromptVerified: true, readinessEvidence: 'Fixture inspects empty owned prompt' });
  f.events = kind => store.list('events').filter(e => !kind || e.kind === kind);
  return f;
}
export async function qualify(f) {
  for (const idle of [false, true]) {
    f.idle = idle; const result = f.runtime.probe(); f.clock.tick(0); f.runtime.ack(result.eventId);
  }
  f.idle = false;
}
export async function retire(f, attemptId, disposition = 'accepted') {
  const a = f.runtime.getAttempt(attemptId);
  if (a.phase !== 'not-sent') { f.transport.move(a.worker, 'done'); await flush(); }
  const result = await f.runtime.control({ operation: 'retire', attemptId, disposition,
    reason: 'Coordinator checked fixture evidence', evidence: 'ID-matched fixture report and checks' });
  await flush(); return result;
}
