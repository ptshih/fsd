import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { canonical, digest, RecordStore, stableJson, within } from './storage.ts';
import { verifyWorker } from './transport.ts';
import type { Binding, Worker } from './transport.ts';

export const RUNTIME_VERSION = 4;
export const MESSAGE_TYPE = 'fsd-runtime';
const text = (v: unknown, label: string, max = 2000): string => {
  if (typeof v !== 'string' || !v.trim() || v.length > max || v.includes('\0')) throw new Error(`Invalid ${label}`);
  return v;
};
const id = (v: unknown, label: string) => {
  const s = text(v, label, 128);
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(s)) throw new Error(`Invalid ${label}`);
  return s;
};
const timestamp = (v: string) => {
  if (!Number.isFinite(Date.parse(v))) throw new Error('Invalid deadline');
  return new Date(v).toISOString();
};
const clone = <T>(v: T): T => structuredClone(v);
const briefError = (e: any) => String(e?.message ?? e).slice(0, 500);
export const ready = (a: any) => ['idle', 'done'].includes(a.agent_status) && a.interactive_ready === true;

export function validateEnvelope(input: any) {
  const e = clone(input);
  for (const k of ['goal', 'doneCriteria', 'scope', 'authorityBasis', 'limits', 'usage']) text(e?.[k], k);
  e.deadline = timestamp(e.deadline);
  if (!Number.isInteger(e.maxWorkers) || e.maxWorkers < 1 || e.maxWorkers > 16) throw new Error('maxWorkers must be 1..16');
  if (!Array.isArray(e.kinds) || !e.kinds.length || e.kinds.some((k: string) => !['pi', 'claude', 'codex', 'agy'].includes(k))) throw new Error('Unsupported worker kinds');
  if (!Array.isArray(e.workspaces) || !e.workspaces.length || e.workspaces.length > 32) throw new Error('Explicit authorized workspaces required');
  e.workspaces = [...new Set(e.workspaces.map((p: string) => canonical(text(p, 'workspace', 1024))))];
  return e;
}

export function validateWorker(input: any, binding: Binding): Worker {
  const w = clone(input);
  for (const k of ['pane', 'tab', 'terminal', 'nativeSession', 'kind', 'cwd']) text(w?.[k], `worker.${k}`, 1024);
  if (!/^w\w+:p\w+$/.test(w.pane) || !/^w\w+:t\w+$/.test(w.tab) || w.pane === binding.parentPane) throw new Error('Invalid or coordinator worker pane');
  w.cwd = canonical(w.cwd);
  return w;
}

export class Runtime {
  binding: Binding;
  transport: any;
  notify: (event: any) => any;
  onError: (error: Error) => void;
  now: () => number;
  clock: any;
  store: any;
  goal: any;
  attempts = new Map<string, any>();
  handoffs = new Map<string, any>();
  observers = new Map<string, AbortController>();
  timers = new Map<string, any>();
  pending = new Set<Promise<any>>();
  dispatching = new Set<string>();
  controller = new AbortController();
  stopped = false;
  fault: string | undefined;
  activation = randomUUID();
  verified = { idle: false, busy: false };
  pendingIdleProbe: string | undefined;
  createStore: (path: string) => any;

  constructor(options: any) {
    this.binding = clone(options.binding); this.transport = options.transport;
    this.notify = options.notify; this.onError = options.onError ?? (() => {});
    this.now = options.now ?? Date.now;
    this.clock = options.clock ?? { set: setTimeout, clear: clearTimeout };
    this.createStore = options.createStore ?? ((root: string) => new RecordStore(root));
  }
  iso() { return new Date(this.now()).toISOString(); }
  effectiveDeadline(a: any) { return Math.min(Date.parse(a.deadline), Date.parse(this.goal.envelope.deadline)); }
  alive() { if (this.stopped) throw new Error('Coordinator runtime stopped'); }
  afterIO(goal: any, signal?: AbortSignal) {
    this.alive(); signal?.throwIfAborted();
    if (this.goal !== goal) throw new Error('Goal changed during native inspection');
  }
  requireGoal() { this.alive(); if (!this.goal || !this.store) throw new Error('Open an authorized goal first'); }
  persistGoal() {
    try { this.store.saveManifest(this.goal); } catch (e) { this.fail(e); throw e; }
  }
  put(kind: string, key: string, value: any) {
    try { this.store.put(kind, key, value); } catch (e) { this.fail(e); throw e; }
  }
  persist(a: any) { this.put('attempts', a.id, a); }
  track<T>(p: Promise<T>): Promise<T> {
    this.pending.add(p); void p.then(() => this.pending.delete(p), () => this.pending.delete(p)); return p;
  }
  fail(error: any) {
    this.fault = briefError(error);
    try { this.onError(new Error(this.fault)); } catch { /* No alternative delivery guarantee. */ }
  }
  getAttempt(attemptId: string) {
    id(attemptId, 'attemptId');
    const a = this.attempts.get(attemptId) ?? this.store.get('attempts', attemptId);
    if (!a || a.id !== attemptId || a.goalId !== this.goal.id) throw new Error('Unknown/mismatched attempt');
    return a;
  }
  capabilities() {
    return { version: RUNTIME_VERSION, multipleWorkers: true, separateWorktrees: true, combinedDispatch: true,
      startupAckMs: 10000, idleProbe: 'agent-settled', automaticDeliveryVerified: this.verified.idle && this.verified.busy,
      wakeupEvidence: { ...this.verified }, workerLaunch: false, workerInterruption: false, hardBudgetEnforcement: false };
  }
  summary() {
    return { loaded: !!this.goal, capabilities: this.capabilities(), fault: this.fault,
      ...(this.goal ? { goalId: this.goal.id, status: this.goal.status, revision: this.goal.revision,
        deadline: this.goal.envelope.deadline, evidencePath: this.store.root,
        attempts: [...this.attempts.values()].map(a => this.attemptSummary(a)),
        retainedHandoffs: [...this.handoffs.values()].map(a => this.attemptSummary(a)) } : {}) };
  }
  attemptSummary(a: any) {
    return { attemptId: a.id, assignment: a.assignment, phase: a.phase, intent: a.intent,
      worker: { pane: a.worker.pane, cwd: a.worker.cwd }, role: a.role, reason: a.reason, observationError: a.observationError,
      observedStatus: a.observed?.status, revision: a.revision, currentRevision: this.goal.revision,
      deadline: a.deadline, effectiveDeadline: new Date(this.effectiveDeadline(a)).toISOString(), evidencePath: this.store.path('attempts', a.id) };
  }

  open(goalId: string, root: string, envelope: any) {
    this.alive(); id(goalId, 'goalId');
    if (this.goal) throw new Error('Close or hand off the current goal before opening another');
    const e = validateEnvelope(envelope);
    if (Date.parse(e.deadline) <= this.now() || Date.parse(e.deadline) - this.now() > 24 * 3600_000) throw new Error('Goal needs a future deadline within 24 hours');
    root = canonical(root);
    this.store = this.createStore(root);
    try {
      if (!this.store.isEmpty()) throw new Error('Goal storage is not empty; restore an existing goal or use a fresh directory');
      this.goal = { version: RUNTIME_VERSION, id: goalId, binding: clone(this.binding), startedAt: this.iso(),
        revision: 1, status: 'active', envelope: e, pausedAssignments: [], directCwds: [] };
      this.put('revisions', '1', { envelope: e, changedAt: this.iso(), basis: e.authorityBasis });
      this.persistGoal();
      return this.summary();
    } catch (e) { this.goal = undefined; this.store.close(); this.store = undefined; throw e; }
  }

  async restore(root: string) {
    this.alive(); if (this.goal) throw new Error('A goal is already loaded');
    this.store = this.createStore(canonical(root));
    try {
      const m = this.store.manifest();
      if (m?.version !== RUNTIME_VERSION || stableJson(m.binding) !== stableJson(this.binding)) throw new Error('Goal/session/Herdr binding mismatch; explicit handoff required');
      if (!['active', 'paused', 'cancelled', 'closed'].includes(m.status) || !Number.isSafeInteger(m.revision) || m.revision < 1) throw new Error('Invalid goal record');
      validateEnvelope(m.envelope); id(m.id, 'goalId');
      if (!Number.isFinite(Date.parse(m.startedAt)) || !Array.isArray(m.pausedAssignments) || !Array.isArray(m.directCwds)) throw new Error('Invalid goal continuity');
      this.goal = m;
      if (m.status === 'closed') { this.store.close(); this.store = undefined; this.goal = undefined; return this.summary(); }
      for (const a of this.store.list('attempts')) {
        if (a.goalId !== m.id || !['preparing', 'submitting', 'not-sent', 'uncertain', 'observing', 'retired'].includes(a.phase)) throw new Error('Invalid persisted attempt');
        if (a.phase === 'retired' && a.retirement?.quiescentVerified !== false) continue;
        validateWorker(a.worker, this.binding); id(a.id, 'attemptId');
        const packet = this.validateSubmission(Object.fromEntries(['attemptId', 'assignment', 'revision', 'worker', 'role', 'writePaths',
          'prompt', 'deadline', 'readyRevision', 'emptyPromptVerified', 'readinessEvidence'].map(k => [k, a[k]])));
        if (a.id !== packet.attemptId || a.revision > m.revision || digest(stableJson(packet)) !== a.packetHash) throw new Error('Persisted packet identity changed');
        if (a.phase === 'retired') { this.handoffs.set(a.id, a); continue; }
        if (!['preparing', 'not-sent'].includes(a.phase) && (!Number.isSafeInteger(a.baseline) || a.baseline < 1)) throw new Error('Missing persisted pre-dispatch baseline');
        if (a.phase === 'observing' && (!Number.isSafeInteger(a.confirmation?.sequence) || a.confirmation.sequence <= a.baseline ||
          !['working', 'idle', 'done', 'blocked'].includes(a.confirmation.status))) throw new Error('Missing persisted startup confirmation');
        this.attempts.set(a.id, a);
        if (a.phase === 'preparing') { a.phase = 'not-sent'; a.reason = 'Restart before durable submission intent'; this.persist(a); }
        if (a.phase === 'submitting') {
          const receipt = this.store.get('evidence', a.id);
          if (receipt?.packetHash === a.packetHash && receipt.attemptId === a.id) {
            try { a.confirmation = this.confirmation(a, receipt.native); a.phase = 'observing'; }
            catch { a.phase = 'uncertain'; }
          } else a.phase = 'uncertain';
          this.persist(a);
        }
        if (a.phase !== 'not-sent') this.arm(a);
      }
      this.replay();
      return this.summary();
    } catch (e) {
      await this.shutdown(); throw e;
    }
  }

  validateSubmission(input: any, priorDeadline?: string) {
    const p = clone(input);
    if (!p) throw new Error('Prepared submission required');
    id(p.attemptId, 'attemptId'); id(p.assignment, 'assignment');
    p.worker = validateWorker(p.worker, this.binding); p.prompt = text(p.prompt, 'assignment prompt', 48000);
    if (!Number.isSafeInteger(p.revision) || p.revision < 1) throw new Error('Explicit goal revision required');
    if (!['writer', 'read-only'].includes(p.role)) throw new Error('Explicit role required');
    if (!Number.isSafeInteger(p.readyRevision) || p.readyRevision < 0 || p.emptyPromptVerified !== true) throw new Error('Coordinator must inspect an empty worker prompt and supply its exact screen revision');
    p.readinessEvidence = text(p.readinessEvidence, 'readinessEvidence');
    if (!Array.isArray(p.writePaths) || p.writePaths.length > 64) throw new Error('Explicit writePaths required');
    p.writePaths = p.writePaths.map((path: string) => canonical(text(path, 'write path', 1024)));
    if (p.role === 'read-only' ? p.writePaths.length !== 0 : p.writePaths.length === 0) throw new Error('Write paths conflict with role');
    if (p.writePaths.some((path: string) => !within(path, p.worker.cwd) || within(path, this.store.root))) throw new Error('Write scope escapes worker cwd or includes reserved runtime state');
    p.deadline = timestamp(p.deadline ?? priorDeadline ?? this.goal.envelope.deadline);
    return p;
  }
  canSubmit(p: any, exclude?: string) {
    this.requireGoal();
    if (this.fault) throw new Error(`Runtime needs reconciliation: ${this.fault}`);
    const e = this.goal.envelope;
    if (this.goal.status !== 'active' || this.goal.pausedAssignments.includes(p.assignment)) throw new Error('Goal/assignment dispatch is paused or cancelled');
    if (p.revision !== this.goal.revision) throw new Error('Superseded goal revision');
    if (Date.parse(p.deadline) <= this.now() || Date.parse(p.deadline) > Date.parse(e.deadline)) throw new Error('Submission outside original/current goal deadline');
    if (!e.kinds.includes(p.worker.kind) || !e.workspaces.includes(p.worker.cwd)) throw new Error('Worker outside approved envelope');
    if (!this.verified.idle || !this.verified.busy) throw new Error('Automatic delivery unverified: acknowledge actual idle and busy probes before worker dispatch');
    const active = [...this.attempts.values(), ...this.handoffs.values()].filter(a => a.id !== exclude);
    if (active.length >= e.maxWorkers) throw new Error('Active worker limit reached');
    if (active.some(a => a.worker.pane === p.worker.pane || a.worker.terminal === p.worker.terminal || a.worker.nativeSession === p.worker.nativeSession)) throw new Error('Worker already has unresolved work');
    if (p.role === 'writer' && (this.goal.directCwds.some((cwd: string) => within(cwd, p.worker.cwd) || within(p.worker.cwd, cwd)) || active.some(a => a.role === 'writer' &&
      (within(a.worker.cwd, p.worker.cwd) || within(p.worker.cwd, a.worker.cwd) || a.writePaths.some((x: string) => p.writePaths.some((y: string) => within(x, y) || within(y, x))))))) throw new Error('Overlapping implementation writer ownership');
  }
  submit(input: any, signal?: AbortSignal): Promise<any> {
    this.requireGoal();
    id(input?.attemptId, 'attemptId');
    const prior = this.store.get('attempts', input.attemptId);
    const p = this.validateSubmission(input, prior?.deadline);
    const packetHash = digest(stableJson(p));
    if (prior) {
      if (prior.packetHash !== packetHash || prior.id !== p.attemptId) throw new Error('Attempt ID reused with different inputs');
      return Promise.resolve({ ...this.attemptSummary(prior), duplicate: true });
    }
    this.canSubmit(p);
    const a: any = { ...p, id: p.attemptId, goalId: this.goal.id, packetHash, phase: 'preparing', intent: 'active', createdAt: this.iso() };
    this.persist(a); this.attempts.set(a.id, a); this.dispatching.add(a.id);
    return this.track(this.dispatch(a, signal).finally(() => this.dispatching.delete(a.id)));
  }
  async dispatch(a: any, signal?: AbortSignal) {
    let submissionInvoked = false;
    const combined = signal ? AbortSignal.any([signal, this.controller.signal]) : this.controller.signal;
    try {
      const live = verifyWorker(a.worker, await this.transport.get(a.worker, combined));
      this.canSubmit(a, a.id); combined.throwIfAborted();
      if (!ready(live) || live.revision !== a.readyRevision) throw new Error('Worker readiness/screen changed since empty-prompt inspection');
      a.baseline = live.state_change_seq; a.submittedAt = this.iso(); a.phase = 'submitting'; this.persist(a);
      // Durably record intent BEFORE native input. Never replay this phase after a crash.
      const prompt = `FSD assignment ${a.assignment}; attempt ${a.id}. Role: ${a.role}.\n` +
        `Workspace: ${a.worker.cwd}\nWrite scope: ${JSON.stringify(a.writePaths)}\n` +
        `Never write coordinator state at ${this.store.root}, even under a broader write scope.\n` +
        `${a.prompt}\nReturn an ID-matched complete/incomplete/blocked report, actual checks/exits, skips, and remaining issues.`;
      submissionInvoked = true;
      const native = await this.transport.prompt(a.worker, prompt, Math.max(1, Math.min(10000, this.effectiveDeadline(a) - this.now())), combined);
      this.put('evidence', a.id, { attemptId: a.id, packetHash: a.packetHash, submittedAt: a.submittedAt, recordedAt: this.iso(), native });
      a.confirmation = this.confirmation(a, native); a.phase = 'observing'; this.persist(a);
      if (!this.stopped) {
        // Fresh identity check also covers fast completion in the startup receipt.
        const latest = verifyWorker(a.worker, await this.transport.get(a.worker, this.controller.signal), a.confirmation.sequence, a.confirmation.status);
        this.observe(a, latest); this.arm(a);
      }
    } catch (e) {
      if (!submissionInvoked) { a.phase = 'not-sent'; a.reason = briefError(e); }
      else if (a.phase === 'submitting') { a.phase = 'uncertain'; a.reason = 'Native submission not confirmed; inspect retained evidence, never resend blindly'; }
      else { a.reason = briefError(e); }
      try {
        this.persist(a);
        if (!this.stopped && a.phase !== 'not-sent') {
          this.emit(a, 'reconciliation', a.reason ?? briefError(e));
          this.arm(a, false);
        }
      } catch (storageError) { this.fail(storageError); }
    }
    return this.attemptSummary(a);
  }
  confirmation(a: any, receipt: any) {
    if (receipt?.code !== 0) throw new Error('No successful native acknowledgment');
    const r = JSON.parse(receipt.stdout);
    if (r.result?.type !== 'agent_prompted') throw new Error('Unsupported native acknowledgment');
    const live = verifyWorker(a.worker, r.result.agent);
    if (live.state_change_seq <= a.baseline || live.agent_status === 'unknown') throw new Error('No post-submission startup evidence');
    return { sequence: live.state_change_seq, status: live.agent_status, source: 'native', confirmedAt: this.iso() };
  }

  observe(a: any, live: any) {
    const prior = a.observed ?? a.confirmation;
    verifyWorker(a.worker, live, prior?.sequence ?? (a.baseline + 1), prior?.status);
    const same = a.observed?.sequence === live.state_change_seq && a.observed?.status === live.agent_status;
    a.observed = { sequence: live.state_change_seq, status: live.agent_status, at: this.iso() };
    this.persist(a);
    if (same) return;
    if (a.phase === 'uncertain') { this.emit(a, 'reconciliation', 'Worker activity observed without confirmed submission; inspect the ID-matched report'); return; }
    if (live.agent_status === 'unknown') this.emit(a, 'failure', 'Worker status unknown; reconcile exact identity');
    else if (live.agent_status === 'blocked') this.emit(a, 'blocked', 'Inspect the actual native approval/blocker; do not infer permission');
    else if (['idle', 'done'].includes(live.agent_status)) this.emit(a, 'completion', 'Inspect the ID-matched report and executed checks; this is not acceptance');
    else if (prior && prior.status !== 'working') this.emit(a, 'resumed', 'Worker resumed; reconcile current direction and retain observation');
  }
  arm(a: any, watch = true) {
    if (this.stopped || a.phase === 'retired' || a.phase === 'not-sent') return;
    if (!this.timers.has(a.id)) {
      const remain = this.effectiveDeadline(a) - this.now();
      if (remain <= 0) { this.deadline(a); return; }
      const timer = this.clock.set(() => this.deadline(a), remain); timer?.unref?.(); this.timers.set(a.id, timer);
    }
    if (watch && !this.observers.has(a.id)) {
      const controller = new AbortController(); this.observers.set(a.id, controller);
      void this.track(this.watch(a, controller)).catch(e => this.fail(e));
    }
  }
  async watch(a: any, controller: AbortController) {
    const active = () => !this.stopped && !controller.signal.aborted && a.phase !== 'retired';
    try {
      while (active()) {
        const remain = this.effectiveDeadline(a) - this.now();
        if (remain <= 0) { this.deadline(a); break; }
        const live = await this.transport.get(a.worker, controller.signal);
        if (!active()) break;
        this.observe(a, live);
        if (live.agent_status === 'unknown') break;
        await this.transport.wait(a.worker, live.agent_status, remain, controller.signal);
        if (!active()) break;
        const latest = await this.transport.get(a.worker, controller.signal);
        if (!active()) break;
        // A meaningful wait returning unchanged state must not create a busy loop.
        if (latest.state_change_seq === live.state_change_seq && latest.agent_status === live.agent_status) throw new Error('Native wait returned unchanged state; explicit reconciliation needed');
        this.observe(a, latest);
      }
    } catch (e) {
      if (active()) {
        try { this.emit(a, 'failure', briefError(e)); } catch (storageError) { this.fail(storageError); }
      }
    } finally { if (this.observers.get(a.id) === controller) this.observers.delete(a.id); }
  }
  deadline(a: any) {
    this.stopObserver(a.id);
    if (this.stopped || a.phase === 'retired') return;
    try { this.emit(a, 'deadline', 'Attempt/current goal deadline reached; no worker was stopped'); }
    catch (e) { this.fail(e); }
  }
  stopObserver(attemptId: string) {
    this.observers.get(attemptId)?.abort(); this.observers.delete(attemptId);
    this.clock.clear(this.timers.get(attemptId)); this.timers.delete(attemptId);
  }

  emit(a: any, kind: string, reason: string) {
    if (this.stopped) return;
    const eventId = digest(`${this.goal.id}:${a.id}:${kind}:${kind === 'deadline' ? this.effectiveDeadline(a) : a.observed?.sequence ?? a.phase}`);
    const old = this.store.get('events', eventId);
    if (old) return; // Stable transition identity: duplicates do not wake or accept twice.
    const event = { id: eventId, kind, goalId: this.goal.id, revision: a.revision,
      attemptId: a.id, assignment: a.assignment, worker: a.worker, at: this.iso(), reason: reason.slice(0, 700),
      status: 'pending', observedStatus: a.observed?.status, deadline: a.deadline,
      evidencePath: this.store.path('attempts', a.id) };
    this.put('events', event.id, event); this.deliver(event);
  }
  deliver(event: any) {
    if (this.stopped || ['acknowledged', 'retired'].includes(event.status)) return;
    try {
      const delivery = this.notify({ ...event, activation: this.activation, currentRevision: this.goal.revision });
      event.status = 'queued'; event.delivery = { ...delivery, activation: this.activation, at: this.iso() };
      delete event.deliveryError; this.put('events', event.id, event);
    } catch (e) {
      event.status = 'pending'; event.deliveryError = briefError(e);
      try { this.put('events', event.id, event); } catch (failure) { this.fail(failure); }
      this.fail(e);
    }
  }
  replay() {
    for (const event of this.store.list('events')) {
      if (event.goalId !== this.goal.id) throw new Error('Foreign notification in goal storage');
      if (event.attemptId && this.getAttempt(event.attemptId).phase === 'retired') {
        if (event.status !== 'retired') { event.status = 'retired'; this.put('events', event.id, event); }
      } else if (event.kind === 'probe' && event.activation !== this.activation) {
        event.status = 'retired'; this.put('events', event.id, event);
      } else if (event.status !== 'scheduled') this.deliver(event);
    }
  }
  ack(eventId: string) {
    this.requireGoal();
    if (!/^[a-f0-9]{64}$/.test(eventId)) throw new Error('Exact event ID required');
    const event = this.store.get('events', eventId);
    if (!event || event.id !== eventId || event.goalId !== this.goal.id) throw new Error('Unknown event');
    if (event.attemptId && this.getAttempt(event.attemptId).phase === 'retired') event.status = 'retired';
    if (event.status !== 'retired' && event.status !== 'acknowledged') {
      if (event.status !== 'queued') throw new Error('Event has not been queued');
      event.status = 'acknowledged'; event.acknowledgedAt = this.iso();
    }
    this.put('events', event.id, event);
    if (event.kind === 'probe' && event.status === 'acknowledged' && event.delivery?.activation === this.activation && event.delivery?.editorUnchanged === true) {
      this.verified[event.delivery.idleAtEnqueue ? 'idle' : 'busy'] = true;
    }
    return { eventId, status: event.status, acceptance: false, capabilities: this.capabilities() };
  }
  probe(delayMs = 0, probeWhen = 'now') {
    this.requireGoal();
    if (!Number.isInteger(delayMs) || delayMs < 0 || delayMs > 5000) throw new Error('Probe delay must be 0..5000ms');
    if (!['now', 'idle'].includes(probeWhen) || (probeWhen === 'idle' && delayMs !== 0)) throw new Error('Idle probes use the settled event, not a delay');
    if (this.goal.status !== 'active' || Date.parse(this.goal.envelope.deadline) <= this.now()) throw new Error('Probe outside active goal');
    if (probeWhen === 'idle' && this.pendingIdleProbe) return { eventId: this.pendingIdleProbe, status: 'scheduled', probeWhen, duplicate: true };
    const event: any = { id: digest(randomUUID()), kind: 'probe', goalId: this.goal.id, revision: this.goal.revision,
      activation: this.activation, probeWhen, status: 'scheduled', at: this.iso(), reason: 'Notification test only; not a new assignment', evidencePath: this.store.root };
    this.put('events', event.id, event);
    if (probeWhen === 'idle') {
      this.pendingIdleProbe = event.id;
      return { eventId: event.id, status: 'scheduled', probeWhen };
    }
    const key = `probe:${event.id}`;
    const timer = this.clock.set(() => {
      this.timers.delete(key); if (this.stopped) return;
      try { event.status = 'pending'; this.put('events', event.id, event); this.deliver(event); }
      catch (e) { this.fail(e); }
    }, delayMs);
    timer?.unref?.(); this.timers.set(key, timer);
    return { eventId: event.id, status: 'scheduled' };
  }

  // Called only by the adapter at Pi's verified agent_settled boundary.
  deliverIdleProbe() {
    if (this.stopped || !this.goal || !this.store || !this.pendingIdleProbe) return;
    const eventId = this.pendingIdleProbe; this.pendingIdleProbe = undefined;
    try {
      const event = this.store.get('events', eventId);
      if (!event || event.status !== 'scheduled' || event.activation !== this.activation || event.goalId !== this.goal.id) return;
      if (this.goal.status !== 'active' || Date.parse(this.goal.envelope.deadline) <= this.now()) {
        event.status = 'retired'; this.put('events', event.id, event); return;
      }
      event.status = 'pending'; this.put('events', event.id, event); this.deliver(event);
    } catch (e) { this.fail(e); }
  }

  async inspect(attemptId?: string, reconcile = false, signal?: AbortSignal) {
    this.requireGoal(); const goal = this.goal;
    if (!attemptId) return this.summary();
    const a = this.getAttempt(attemptId);
    if (reconcile && a.phase !== 'retired' && a.phase !== 'preparing' && a.phase !== 'submitting') {
      const live = verifyWorker(a.worker, await this.transport.get(a.worker, signal)); this.afterIO(goal, signal);
      if (a.phase === 'retired') return this.attemptSummary(a);
      if (a.phase !== 'not-sent') { this.observe(a, live); this.arm(a); }
      return { ...this.attemptSummary(a), live: { status: live.agent_status, sequence: live.state_change_seq, revision: live.revision, ready: ready(live) } };
    }
    return this.attemptSummary(a);
  }
  async control(input: any, signal?: AbortSignal) {
    this.requireGoal(); const goal = this.goal;
    const op = input.operation;
    if (op === 'probe') return this.probe(input.delayMs, input.probeWhen);
    text(input.reason, 'control reason');
    this.put('revisions', `control-${randomUUID()}`, { kind: 'control-request', operation: op, at: this.iso(),
      revision: this.goal.revision, attemptId: input.attemptId, reason: input.reason,
      evidence: input.evidence, handoff: input.handoff, disposition: input.disposition });
    if (op === 'revise') {
      const envelope = validateEnvelope(input.envelope);
      if (Date.parse(envelope.deadline) - this.now() > 24 * 3600_000) throw new Error('Revised deadline exceeds supported window');
      if (this.goal.status === 'cancelled') throw new Error('Cancelled goal cannot be revived');
      const revision = this.goal.revision + 1;
      this.put('revisions', String(revision), { envelope, priorEnvelope: this.goal.envelope, basis: input.reason, at: this.iso() });
      this.goal.envelope = envelope; this.goal.revision = revision; this.persistGoal();
      for (const a of this.attempts.values()) if (['observing', 'uncertain'].includes(a.phase)) {
        this.clock.clear(this.timers.get(a.id)); this.timers.delete(a.id); this.arm(a, false);
      }
    } else if (op === 'reserve-direct') {
      if (!Array.isArray(input.directCwds)) throw new Error('directCwds required');
      const paths = input.directCwds.map(canonical);
      if (paths.some((p: string) => !this.goal.envelope.workspaces.includes(p) || [...this.attempts.values(), ...this.handoffs.values()].some(a => a.role === 'writer' &&
        (within(p, a.worker.cwd) || within(a.worker.cwd, p))))) throw new Error('Direct writer scope is unauthorized or overlaps unresolved work');
      this.goal.directCwds = paths; this.persistGoal();
    } else if (['pause', 'resume', 'cancel', 'supersede'].includes(op)) {
      if (this.goal.status === 'cancelled' && op === 'resume') throw new Error('Cancelled goal cannot be resumed');
      if (input.attemptId) {
        const a = this.getAttempt(input.attemptId);
        if (a.phase === 'retired') throw new Error('Attempt already retired');
        if (op === 'resume') this.goal.pausedAssignments = this.goal.pausedAssignments.filter((x: string) => x !== a.assignment);
        else this.goal.pausedAssignments = [...new Set([...this.goal.pausedAssignments, a.assignment])];
        a.intent = op === 'resume' ? 'active' : op; this.persist(a);
      } else {
        if (op === 'supersede') throw new Error('Supersession requires an exact attempt');
        this.goal.status = op === 'pause' ? 'paused' : op === 'cancel' ? 'cancelled' : 'active';
      }
      this.persistGoal();
      if (op === 'cancel' && !input.attemptId) {
        this.pendingIdleProbe = undefined;
        for (const [key, timer] of this.timers) if (key.startsWith('probe:')) { this.clock.clear(timer); this.timers.delete(key); }
        for (const event of this.store.list('events')) if (event.kind === 'probe' && event.status !== 'acknowledged') {
          event.status = 'retired'; this.put('events', event.id, event);
        }
      }
      if (op === 'resume') { this.fault = undefined; this.replay(); }
    } else if (op === 'adopt') {
      const a = this.getAttempt(input.attemptId);
      if (a.phase !== 'uncertain') throw new Error('Only uncertain attempts require adoption');
      text(input.evidence, 'ID-matched reconciliation evidence');
      const live = verifyWorker(a.worker, await this.transport.get(a.worker, signal)); this.afterIO(goal, signal);
      if (a.phase !== 'uncertain') throw new Error('Attempt changed during reconciliation');
      if (live.state_change_seq <= a.baseline || live.agent_status === 'unknown') throw new Error('No post-submission activity to reconcile');
      a.confirmation = { sequence: live.state_change_seq, status: live.agent_status, source: 'coordinator-reconciliation', evidence: input.evidence, at: this.iso() };
      a.phase = 'observing'; this.persist(a); this.observe(a, live); this.arm(a);
    } else if (op === 'retire') {
      const a = this.getAttempt(input.attemptId);
      if (a.phase === 'retired') {
        if (a.retirement.quiescentVerified === false && !input.handoff) {
          text(input.evidence, 'handoff release evidence');
          const revision = this.goal.revision;
          const live = verifyWorker(a.worker, await this.transport.get(a.worker, signal)); this.afterIO(goal, signal);
          if (revision !== this.goal.revision || !ready(live)) throw new Error('Handoff release requires current verified quiescence');
          a.retirement.quiescentVerified = true; a.retirement.releaseEvidence = input.evidence; a.retirement.reconciledAt = this.iso();
          this.persist(a); this.handoffs.delete(a.id);
        }
        return this.attemptSummary(a);
      }
      if (this.dispatching.has(a.id) || a.phase === 'preparing' || a.phase === 'submitting') throw new Error('Settle the bounded submission before retiring it');
      const revision = this.goal.revision;
      text(input.evidence, 'acceptance/partial-work evidence');
      if (!['accepted', 'incomplete', 'cancelled', 'superseded', 'not-sent'].includes(input.disposition)) throw new Error('Explicit disposition required');
      if (a.phase === 'not-sent' && input.disposition === 'accepted') throw new Error('Unsent work cannot be accepted');
      let quiescent = a.phase === 'not-sent';
      if (input.handoff) {
        text(input.handoff, 'handoff owner and next action');
        if (input.disposition === 'accepted') throw new Error('Acceptance requires verified quiescence, not an unresolved handoff');
      } else if (!quiescent) {
        const live = verifyWorker(a.worker, await this.transport.get(a.worker, signal)); this.afterIO(goal, signal);
        if (a.phase === 'retired' || revision !== this.goal.revision) throw new Error('Attempt/goal changed during retirement; inspect again');
        if (!ready(live)) throw new Error('Worker is not quiescent; interrupt/reconcile through supported controls or explicitly hand off');
        quiescent = true;
      }
      this.stopObserver(a.id);
      a.phase = 'retired'; a.retirement = { disposition: input.disposition, evidence: input.evidence,
        handoff: input.handoff, quiescentVerified: quiescent, at: this.iso() };
      this.persist(a); this.attempts.delete(a.id);
      if (!quiescent) this.handoffs.set(a.id, a);
      for (const e of this.store.list('events').filter((e: any) => e.attemptId === a.id)) { e.status = 'retired'; this.put('events', e.id, e); }
      return this.attemptSummary(a);
    } else throw new Error('Unsupported control operation');
    return { ...this.summary(), workerInterrupted: false };
  }
  close(outcome: string, evidence: string, cleanup: string) {
    this.requireGoal();
    if (this.attempts.size || this.pending.size) throw new Error('Unresolved attempts/operations remain; reconcile or explicitly hand off first');
    if (!['delivered', 'blocked', 'limit-reached', 'cancelled'].includes(outcome)) throw new Error('Explicit terminal outcome required');
    if (this.goal.status === 'cancelled' && outcome !== 'cancelled') throw new Error('A cancelled goal must remain cancelled');
    text(evidence, 'final evidence'); text(cleanup, 'verified cleanup or retained-resource record');
    this.goal.status = 'closed'; this.goal.finishedAt = this.iso(); this.goal.outcome = outcome;
    this.goal.evidence = evidence; this.goal.cleanup = cleanup; this.persistGoal();
    for (const event of this.store.list('events')) { event.status = 'retired'; this.put('events', event.id, event); }
    for (const timer of this.timers.values()) this.clock.clear(timer); this.timers.clear();
    const result = { goalId: this.goal.id, outcome, evidencePath: this.store.root, conversationClosed: false };
    this.store.close(); this.store = undefined; this.goal = undefined; this.handoffs.clear(); this.pendingIdleProbe = undefined;
    return result;
  }
  async shutdown() {
    if (this.stopped) return;
    this.stopped = true; this.pendingIdleProbe = undefined; this.controller.abort();
    for (const c of this.observers.values()) c.abort(); this.observers.clear();
    for (const t of this.timers.values()) this.clock.clear(t); this.timers.clear();
    await Promise.allSettled([...this.pending]);
    if (this.store) {
      try {
        for (const e of this.store.list('events')) if (e.kind === 'probe' && e.status === 'scheduled') { e.status = 'retired'; this.put('events', e.id, e); }
      } finally { this.store.close(); this.store = undefined; }
    }
  }
}
