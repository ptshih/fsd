// Optional native CLI contract test. Uses an isolated Unix socket, never the live
// Herdr server or actual workers. Current qualified wire generation: Herdr 0.9 / 22.
import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { mkdtempSync, rmSync } from 'node:fs';
import { once } from 'node:events';
import { createTransport, nativeCommand, resolveHerdr, socketIdentity } from '../runtime/transport.ts';

const root = mkdtempSync('/tmp/fsd-wire-');
const socketPath = `${root}/s`;
const requests = [];
const server = createServer(socket => {
  let buffer = '';
  socket.on('data', bytes => {
    buffer += bytes.toString();
    while (buffer.includes('\n')) {
      const at = buffer.indexOf('\n'); const line = buffer.slice(0, at); buffer = buffer.slice(at + 1);
      const request = JSON.parse(line); requests.push(request);
      const response = request.method === 'ping'
        ? { id: request.id, result: { type: 'pong', version: '0.9.0', protocol: 22 } }
        : { id: request.id, error: { code: 'agent_not_found', message: 'Isolated wire fixture; no real target' } };
      socket.end(JSON.stringify(response) + '\n');
    }
  });
});
try {
  server.listen(socketPath); await once(server, 'listening');
  const binding = { sessionId: 'fixture', sessionFile: '/fixture', cwd: root, parentPane: 'w1:p1', socketPath, socketIdentity: socketIdentity(socketPath) };
  const transport = createTransport(binding), worker = { pane: 'fsd-nonexistent-wire-target' };
  const text = '--text-not-a-flag; $(never-execute)';
  const receipt = await transport.prompt(worker, text, 1000);
  assert.equal(receipt.code, 1); assert.match(receipt.stderr, /agent_not_found/);
  assert.deepEqual(requests.find(r => r.method === 'agent.prompt')?.params, {
    target: worker.pane, text, wait: { until: ['working', 'idle', 'done', 'blocked'], timeout_ms: 1000 },
  });
  await assert.rejects(transport.wait(worker, 'blocked', 1000), /Herdr request failed/);
  assert.deepEqual(requests.find(r => r.method === 'agent.wait')?.params, {
    target: worker.pane, until: ['working', 'idle', 'done', 'unknown'], timeout_ms: 1000,
  });
  const count = requests.length;
  const bad = await nativeCommand(resolveHerdr(), ['agent', 'prompt', '--wait', '--until', 'working', '--', worker.pane, text], binding);
  assert.equal(bad.code, 2); assert.equal(requests.length, count);
  console.log('PASS: native Herdr TARGET/TEXT/options and wait request schemas; leading-dash/shell-like text preserved. Old argument order rejected before socket I/O. No live server or workers touched.');
} finally {
  await new Promise(resolve => server.close(resolve)); rmSync(root, { recursive: true, force: true });
}
