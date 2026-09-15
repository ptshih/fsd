import type { ExtensionAPI, ExtensionContext } from '@earendil-works/pi-coding-agent';
import { Type } from 'typebox';
import { StringEnum } from '@earendil-works/pi-ai';
import { existsSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { Runtime, MESSAGE_TYPE, validateEnvelope } from './core.ts';
import { acquireLease, canonical, digest, optionalJson, privateDirectory, stableJson, writeJson } from './storage.ts';
import { createTransport, socketIdentity } from './transport.ts';
import { inspectLegacy } from './legacy.ts';
import { installUIBlockerBridge } from './ui-blocked.ts';

const short = (max = 2000) => Type.String({ minLength: 1, maxLength: max });
const WorkerSchema = Type.Object({ pane: short(128), tab: short(128), terminal: short(256),
  nativeSession: short(1024), kind: StringEnum(['pi', 'claude', 'codex', 'agy']), cwd: short(1024) }, { additionalProperties: false });
const EnvelopeSchema = Type.Object({ goal: short(), doneCriteria: short(), scope: short(),
  authorityBasis: short(), limits: short(), usage: short(), deadline: short(64),
  maxWorkers: Type.Integer({ minimum: 1, maximum: 16 }),
  kinds: Type.Array(StringEnum(['pi', 'claude', 'codex', 'agy']), { minItems: 1, maxItems: 4 }),
  workspaces: Type.Array(short(1024), { minItems: 1, maxItems: 32 }) }, { additionalProperties: false });
const SubmissionSchema = Type.Object({ attemptId: short(128), assignment: short(128), revision: Type.Integer({ minimum: 1 }),
  worker: WorkerSchema, role: StringEnum(['writer', 'read-only']), writePaths: Type.Array(short(1024), { maxItems: 64 }),
  prompt: short(48000), deadline: Type.Optional(short(64)), readyRevision: Type.Integer({ minimum: 0 }),
  emptyPromptVerified: Type.Boolean(), readinessEvidence: short() }, { additionalProperties: false });

export function ensureIgnored(path: string) {
  let existing = path;
  while (!existsSync(existing)) existing = dirname(existing);
  let repo: string;
  try { repo = execFileSync('git', ['-C', existing, 'rev-parse', '--show-toplevel'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 3000 }).trim(); }
  catch (e: any) {
    if (e.status === 128 && String(e.stderr).includes('not a git repository')) return;
    throw new Error('Could not establish repository privacy; reconcile before opening mission storage');
  }
  const tracked = execFileSync('git', ['-C', repo, 'ls-files', '-z', '--', path], { encoding: 'utf8', stdio: 'pipe', timeout: 3000 });
  if (tracked) throw new Error('Mission storage contains tracked files; Git-ignore does not protect existing tracked data');
  try { execFileSync('git', ['-C', repo, 'check-ignore', '--quiet', '--', path], { stdio: 'pipe', timeout: 3000 }); }
  catch { throw new Error('Git-ignore the repository-local mission directory before opening FSD runtime storage'); }
}

// Factory registers tools/hooks only. No process, watcher, model, or state writes.
export function installRuntime(pi: ExtensionAPI, dependencies: any = {}) {
  let ctx: ExtensionContext | undefined;
  let runtime: Runtime | undefined;
  let bootError: string | undefined;
  let releaseSession: (() => void) | undefined;
  let pointerPath: string | undefined;
  let opening = false;
  const stateRoot = dependencies.stateRoot ?? join(homedir(), '.local/state/fsd/herdr-pi-v3');
  const legacyRoot = dependencies.legacyRoot ?? join(homedir(), '.local/state/fsd/herdr-pi');
  const bind = (context: ExtensionContext) => dependencies.binding ?? {
    sessionId: context.sessionManager.getSessionId(), sessionFile: context.sessionManager.getSessionFile(),
    cwd: realpathSync(context.cwd), parentPane: process.env.HERDR_PANE_ID,
    socketPath: process.env.HERDR_SOCKET_PATH,
    socketIdentity: socketIdentity(process.env.HERDR_SOCKET_PATH!),
  };
  const notify = (event: any) => {
    if (!ctx || !runtime || ctx.sessionManager.getSessionId() !== runtime.binding.sessionId) throw new Error('Coordinator session unavailable for delivery');
    const draft = ctx.ui.getEditorText();
    const idleAtEnqueue = ctx.isIdle();
    const notice = `FSD ${event.assignment ?? 'runtime'}: ${event.kind === 'completion' ? 'ready for review' : event.kind}.`;
    pi.sendMessage({ customType: MESSAGE_TYPE, display: false, details: event,
      content: `${notice}\nMission ${event.missionId}; revision ${event.revision} (current ${event.currentRevision}).\n` +
        `Attempt: ${event.attemptId ?? 'probe'}\nEvent: ${event.id}\nEvidence: ${event.evidencePath}\n` +
        'Use fsd_runtime to inspect current disposition and acknowledge this exact event. Respect latest owner steering. ' +
        'This is machine evidence, not user approval, acceptance, or an instruction to resend work.',
    }, { triggerTurn: true, deliverAs: 'steer' });
    const editorUnchanged = draft === ctx.ui.getEditorText();
    try { ctx.ui.notify(notice, 'info'); } catch { /* Enqueue is distinct from the human notice. */ }
    return { idleAtEnqueue, editorUnchanged };
  };
  const makeRuntime = (context: ExtensionContext) => {
    const binding = bind(context);
    if (!binding.sessionFile || !binding.sessionId || !binding.parentPane || !binding.socketPath) throw new Error('A persisted Pi session and live Herdr binding are required');
    return new Runtime({ binding, transport: dependencies.transport ?? createTransport(binding), notify,
      onError: (error: Error) => ctx?.ui.notify(`FSD runtime needs reconciliation: ${error.message}`, 'error'),
      now: dependencies.now, clock: dependencies.clock, createStore: dependencies.createStore });
  };
  const sessionPath = (sessionId: string) => join(canonical(stateRoot), digest(sessionId));
  const claimSession = (sessionId: string) => {
    if (releaseSession) return;
    const directory = sessionPath(sessionId);
    privateDirectory(directory); releaseSession = acquireLease(directory);
    pointerPath = join(directory, 'active.json');
  };
  const stop = async () => {
    const old = runtime; runtime = undefined; ctx = undefined;
    try { await old?.shutdown(); }
    finally { releaseSession?.(); releaseSession = undefined; pointerPath = undefined; }
  };

  pi.on('session_start', async (_event, context) => {
    await stop(); bootError = undefined;
    if (context.mode !== 'tui' || (dependencies.herdrEnabled ?? process.env.HERDR_ENV === '1') !== true) return;
    ctx = context;
    try {
      const directory = sessionPath(context.sessionManager.getSessionId());
      if (!existsSync(directory)) return; // Ordinary conversations remain inert.
      const pointer = optionalJson(join(directory, 'active.json'));
      if (!pointer?.active) return;
      runtime = makeRuntime(context); claimSession(runtime.binding.sessionId);
      const legacy = inspectLegacy(legacyRoot, runtime.binding.sessionId);
      if (!legacy.settled) throw new Error('Legacy observation is unsettled; reconcile through its original bridge before migration');
      await runtime.restore(pointer.active);
    } catch (e: any) {
      bootError = String(e.message); await stop(); ctx = context;
      context.ui.notify(`FSD runtime: ${bootError}`, 'error');
    }
  });
  pi.on('session_shutdown', stop);
  pi.on('agent_settled', (_event, context) => {
    if (ctx && runtime && context.mode === 'tui' && context.sessionManager.getSessionId() === runtime.binding.sessionId && context.isIdle()) {
      runtime.deliverIdleProbe();
    }
  });

  pi.registerTool({
    name: 'fsd_runtime', label: 'FSD runtime',
    description: 'Explicit authorized FSD mission operations in this Pi conversation. open initializes private state; submit registers, sends ONE native Herdr prompt and retains the receipt before asynchronous observation. Multiple workers/worktrees; one writer per cwd including declared coordinator work. Never launches, interrupts or closes workers, approves prompts, or accepts results automatically. Probe/ack actual idle and busy delivery before dispatch. inspect is bounded; no polling. control pauses/revises/adopts/retires records, not worker processes. Authority/evidence inputs are coordinator attestations, not guard overrides. Code v3 requires separate live qualification; no blanket reliability claim.',
    parameters: Type.Object({ action: StringEnum(['open', 'submit', 'inspect', 'control', 'ack', 'close']),
      missionId: Type.Optional(short(128)), missionPath: Type.Optional(short(1024)), envelope: Type.Optional(EnvelopeSchema),
      submission: Type.Optional(SubmissionSchema), attemptId: Type.Optional(short(128)), reconcile: Type.Optional(Type.Boolean()),
      eventId: Type.Optional(short(128)), operation: Type.Optional(StringEnum(['probe', 'pause', 'resume', 'cancel', 'supersede', 'revise', 'reserve-direct', 'adopt', 'retire'])),
      reason: Type.Optional(short()), delayMs: Type.Optional(Type.Integer({ minimum: 0, maximum: 5000 })),
      probeWhen: Type.Optional(StringEnum(['now', 'idle'])),
      directCwds: Type.Optional(Type.Array(short(1024), { maxItems: 32 })), evidence: Type.Optional(short()),
      disposition: Type.Optional(StringEnum(['accepted', 'incomplete', 'cancelled', 'superseded', 'not-sent'])),
      handoff: Type.Optional(short()), outcome: Type.Optional(StringEnum(['delivered', 'blocked', 'limit-reached', 'cancelled'])),
      cleanup: Type.Optional(short()) }, { additionalProperties: false }),
    async execute(_id, args, signal, _update, context) {
      if (args.action === 'inspect' && !runtime?.mission) return { content: [{ type: 'text', text: bootError ?? 'No active FSD runtime mission. Reading status does not open one.' }], details: { loaded: false } };
      if (bootError) throw new Error(bootError);
      if (!ctx || ctx.mode !== 'tui' || ctx.sessionManager.getSessionId() !== context.sessionManager.getSessionId()) throw new Error('FSD requires this active interactive Herdr/Pi session');
      let result: any;
      if (args.action === 'open') {
        if (opening) throw new Error('Mission open already in progress');
        if (!args.missionId || !args.missionPath || !args.envelope) throw new Error('missionId, absolute missionPath, and approved envelope are required');
        opening = true;
        try {
          runtime ??= makeRuntime(ctx);
          const legacy = inspectLegacy(legacyRoot, runtime.binding.sessionId);
          if (!legacy.settled) throw new Error('Legacy observation/probe unsettled; no v3 dispatch or migration permitted');
          const missionPath = canonical(args.missionPath);
          (dependencies.ensureIgnored ?? ensureIgnored)(missionPath);
          privateDirectory(missionPath); claimSession(runtime.binding.sessionId);
          const pointer = optionalJson(pointerPath!);
          const root = join(missionPath, 'runtime');
          if (pointer?.active && pointer.active !== root) throw new Error('An existing mission must be resumed/reconciled, not replaced');
          const existing = existsSync(root) ? optionalJson(join(root, 'mission.json')) : undefined;
          if (existing) {
            if (runtime.mission || existing.id !== args.missionId || stableJson(existing.envelope) !== stableJson(validateEnvelope(args.envelope))) throw new Error('Existing mission differs; inspect or explicitly revise instead of resetting it');
            const current = runtime;
            result = await current.restore(root);
            if (runtime !== current || !ctx) throw new Error('Session changed during mission restore');
            if (!runtime.mission) throw new Error('Closed missions cannot be reopened; use a new mission ID/directory');
          } else result = runtime.open(args.missionId, root, args.envelope);
          runtime.put('evidence', 'legacy-inventory', legacy);
          writeJson(pointerPath!, { version: 3, active: runtime.store.root });
        } catch (e) {
          if (runtime?.mission) runtime.fail(e);
          throw e;
        } finally { opening = false; }
      } else {
        if (!runtime) throw new Error('Open an authorized FSD mission first');
        const binding = bind(context);
        if (stableJson(binding) !== stableJson(runtime.binding)) throw new Error('Coordinator/Herdr binding changed; reconcile before operations');
        if (args.action === 'submit') {
          if (optionalJson(pointerPath!)?.active !== runtime.store?.root) throw new Error('Mission pointer was not durably established; reconcile before dispatch');
          if (!inspectLegacy(legacyRoot, runtime.binding.sessionId).settled) throw new Error('Legacy bridge acquired unsettled work; reconcile before dispatch');
          result = await runtime.submit(args.submission, signal);
        }
        if (args.action === 'inspect') result = await runtime.inspect(args.attemptId, args.reconcile, signal);
        if (args.action === 'control') result = await runtime.control(args, signal);
        if (args.action === 'ack') result = runtime.ack(args.eventId!);
        if (args.action === 'close') {
          result = runtime.close(args.outcome!, args.evidence!, args.cleanup!);
          writeJson(pointerPath!, { version: 3, active: null, last: result.evidencePath });
        }
      }
      const phase = result.phase ?? result.status ?? result.outcome ?? 'updated';
      return { content: [{ type: 'text', text: `FSD ${result.assignment ?? result.missionId ?? 'runtime'}: ${phase}.` +
        `${result.fault ? ` Needs reconciliation: ${result.fault}` : ''}` +
        `${result.capabilities && !result.capabilities.automaticDeliveryVerified ? '\nAutomatic delivery unverified for this activation; use explicit idle/busy probes before dispatch.' : ''}` +
        `\n${JSON.stringify(result)}` }], details: result };
    },
  });
}
export default function (pi: ExtensionAPI) {
  installUIBlockerBridge(pi);
  installRuntime(pi);
}
