import { execFile } from 'node:child_process';
import { accessSync, constants, lstatSync, realpathSync } from 'node:fs';
import { delimiter, isAbsolute, join } from 'node:path';

export type Binding = { sessionId: string; sessionFile: string; cwd: string; parentPane: string; socketPath: string; socketIdentity: string };
export type Worker = { pane: string; tab: string; terminal: string; nativeSession: string; kind: string; cwd: string };
export type Receipt = { code: number | string | null; stdout: string; stderr: string; aborted?: boolean };

export function socketIdentity(path: string): string {
  const s = lstatSync(path);
  if (!s.isSocket() || s.isSymbolicLink() || s.uid !== process.getuid()) throw new Error('Herdr socket must be an owned native socket');
  return `${s.dev}:${s.ino}`;
}

export function resolveHerdr(pathEnv = process.env.PATH ?? ''): string {
  for (const dir of pathEnv.split(delimiter).filter(isAbsolute)) {
    const candidate = join(dir, 'herdr');
    try { accessSync(candidate, constants.X_OK); return realpathSync(candidate); } catch { /* try next PATH entry */ }
  }
  throw new Error('Herdr executable unavailable on PATH');
}

export function verifyWorker(worker: Worker, a: any, minimum?: number, previousStatus?: string) {
  if (!a || a.pane_id !== worker.pane || a.tab_id !== worker.tab || a.terminal_id !== worker.terminal ||
      a.agent !== worker.kind || a.agent_session?.value !== worker.nativeSession || a.cwd !== worker.cwd ||
      (a.foreground_cwd && a.foreground_cwd !== worker.cwd)) throw new Error('Worker identity/cwd changed; reconcile, never follow a replacement');
  if (!Number.isSafeInteger(a.state_change_seq) || a.state_change_seq < 1 ||
      !['idle', 'done', 'working', 'blocked', 'unknown'].includes(a.agent_status)) throw new Error('Unsupported native worker state');
  if (minimum !== undefined && (a.state_change_seq < minimum ||
      (a.state_change_seq === minimum && previousStatus && previousStatus !== a.agent_status))) {
    throw new Error('Stale/out-of-order worker state or restarted Herdr host');
  }
  return a;
}

export function nativeCommand(binary: string, args: string[], binding: Binding, signal?: AbortSignal, timeout = 5000): Promise<Receipt> {
  if (socketIdentity(binding.socketPath) !== binding.socketIdentity) throw new Error('Herdr host socket incarnation changed');
  signal?.throwIfAborted();
  return new Promise(resolve => {
    execFile(binary, args, {
      signal, timeout, maxBuffer: 512 * 1024, encoding: 'utf8',
      env: { ...process.env, HERDR_ENV: '1', HERDR_SOCKET_PATH: binding.socketPath, HERDR_PANE_ID: binding.parentPane },
    }, (error: any, stdout, stderr) => resolve({
      code: error ? (error.code ?? null) : 0, stdout, stderr, aborted: signal?.aborted ?? false,
    }));
  });
}

export function createTransport(binding: Binding, command = nativeCommand, resolveBinary = resolveHerdr) {
  let binary: string | undefined;
  const run = (args: string[], signal?: AbortSignal, timeout?: number) => command(binary ??= resolveBinary(), args, binding, signal, timeout);
  const parse = (receipt: Receipt) => {
    if (receipt.code !== 0) throw new Error(`Herdr request failed (${receipt.code ?? 'unknown'}); native transport did not establish success`);
    const result = JSON.parse(receipt.stdout);
    if (result.error || !result.result) throw new Error('Herdr returned an error or unsupported response');
    return result.result;
  };
  return {
    async get(worker: Worker, signal?: AbortSignal) {
      return parse(await run(['agent', 'get', worker.pane], signal)).agent;
    },
    async prompt(worker: Worker, prompt: string, timeout: number, signal?: AbortSignal) {
      // Herdr consumes TARGET and TEXT positionally before parsing options. Unlike
      // generic option parsers, moving flags before them is invalid. TEXT remains
      // one argv element even when it starts with '-' or contains shell syntax.
      return run(['agent', 'prompt', worker.pane, prompt, '--wait', '--until', 'working', '--until', 'idle',
        '--until', 'done', '--until', 'blocked', '--timeout', String(timeout)], signal, timeout + 1000);
    },
    async wait(worker: Worker, status: string, remaining: number, signal?: AbortSignal) {
      // Wait for a different meaningful state. No immediate-return loop on blocked/idle.
      const until = status === 'working' ? ['idle', 'done', 'blocked', 'unknown'] :
        status === 'blocked' ? ['working', 'idle', 'done', 'unknown'] : ['working', 'blocked', 'unknown'];
      return parse(await run(['agent', 'wait', worker.pane, ...until.flatMap(s => ['--until', s]),
        '--timeout', String(Math.max(1, Math.ceil(remaining)))], signal, remaining + 1000));
    },
  };
}
