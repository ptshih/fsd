import test from 'node:test';
import assert from 'node:assert/strict';
import { Runtime } from '../runtime/core.ts';
import { fixture, qualify, retire, worker, agent, flush } from './support.mjs';

function setup(t) { const f = fixture(); t.after(() => f.runtime.shutdown()); return f; }

test('open is fresh-session initialization without worker or watcher I/O; direct close stays in conversation', async t => {
  const f = setup(t);
  assert.equal(f.transport.gets, 0); assert.equal(f.transport.prompts.length, 0); assert.equal(f.clock.timers.size, 0);
  const result = f.runtime.close('delivered', 'Direct checks passed', 'No workers created');
  assert.equal(result.conversationClosed, false);
  assert.equal(f.store.manifest().outcome, 'delivered');
});
test('requires actual idle and busy probe acknowledgment; neither enqueue nor stale activation qualifies', async t => {
  const f = setup(t); const w = f.transport.add(worker());
  assert.throws(() => f.runtime.submit(f.submission(w)), /unverified/);
  f.idle = false; const p = f.runtime.probe(); f.clock.tick(0);
  assert.equal(f.runtime.capabilities().automaticDeliveryVerified, false);
  f.runtime.ack(p.eventId); assert.equal(f.runtime.verified.busy, true); assert.equal(f.runtime.verified.idle, false);
  f.runtime.activation = 'different-runtime'; f.runtime.verified.busy = false;
  f.runtime.ack(p.eventId); assert.equal(f.runtime.verified.busy, false);
  await qualify(f); assert.equal(f.runtime.capabilities().automaticDeliveryVerified, true);
});
test('combined submit retains native startup evidence and observes fast completion exactly once', async t => {
  const f = setup(t); await qualify(f); const w = f.transport.add(worker()); f.transport.fast = true;
  const input = f.submission(w); const result = await f.runtime.submit(input); await flush();
  assert.equal(result.phase, 'observing'); assert.equal(result.observedStatus, 'done');
  assert.equal(f.transport.prompts.length, 1); assert.equal(f.events('completion').length, 1);
  assert.equal(f.store.get('evidence', input.attemptId).native.code, 0);
  const duplicate = await f.runtime.submit(input); assert.equal(duplicate.duplicate, true); assert.equal(f.transport.prompts.length, 1);
  assert.throws(() => f.runtime.submit({ ...input, prompt: 'Different work' }), /different inputs/);
});
test('independent parallel workers in separate worktrees complete in either order without replacing watches', async t => {
  const f = setup(t); await qualify(f); const a = f.transport.add(worker(2)), b = f.transport.add(worker(3));
  await Promise.all([f.runtime.submit(f.submission(a, 'A1-1')), f.runtime.submit(f.submission(b, 'A2-1'))]); await flush();
  assert.equal(f.runtime.observers.size, 2); assert.equal(f.transport.prompts.length, 2);
  f.transport.move(b, 'done'); await flush(); assert.equal(f.events('completion').length, 1);
  f.transport.move(a, 'done'); await flush(); assert.deepEqual(new Set(f.events('completion').map(e => e.attemptId)), new Set(['A1-1', 'A2-1']));
  assert.equal(f.runtime.observers.size, 2); // Completion is not acceptance/retirement.
});
test('rejects overlapping worker and coordinator writers, including canonical nested scopes', async t => {
  const f = setup(t); await qualify(f); const a = f.transport.add(worker());
  await f.runtime.control({ operation: 'reserve-direct', directCwds: [a.cwd], reason: 'Coordinator implements here' });
  assert.throws(() => f.runtime.submit(f.submission(a)), /ownership/);
  await f.runtime.control({ operation: 'reserve-direct', directCwds: [], reason: 'Handoff complete' });
  await f.runtime.submit(f.submission(a));
  const b = f.transport.add(worker(3, a.cwd));
  assert.throws(() => f.runtime.submit(f.submission(b, 'A2-1')), /ownership/);
  await assert.rejects(f.runtime.control({ operation: 'reserve-direct', directCwds: [a.cwd], reason: 'Take over' }), /overlaps/);
});
test('nested worker cwds do not evade exclusive writer ownership even with disjoint declared files', async t => {
  const f = setup(t); await qualify(f); const w = f.transport.add(worker()); await f.runtime.submit(f.submission(w));
  const b = f.transport.add(worker(3, `${w.cwd}/nested`));
  await f.runtime.control({ operation: 'revise', reason: 'Owner permits another workspace', envelope: { ...f.envelope, workspaces: [...f.envelope.workspaces, b.cwd] } });
  assert.throws(() => f.runtime.submit(f.submission(b, 'A2-1')), /ownership/);
});
test('same worker cannot receive another assignment while original ownership is unresolved', async t => {
  const f = setup(t); await qualify(f); const w = f.transport.add(worker());
  await f.runtime.submit(f.submission(w));
  await f.runtime.control({ operation: 'cancel', attemptId: 'A1-1', reason: 'Owner cancelled' });
  assert.throws(() => f.runtime.submit(f.submission(w, 'A2-1')), /unresolved/);
  assert.equal(f.transport.prompts.length, 1); assert.equal(f.runtime.observers.size, 1);
});
for (const [name, patch] of [
  ['stale screen', { revision: 11 }], ['old ready state now working', { agent_status: 'working' }],
  ['missing native readiness', { interactive_ready: undefined }], ['replaced native session', { agent_session: { value: 'new' } }],
  ['different cwd', { cwd: '/other' }], ['unknown state', { agent_status: 'unknown' }],
]) test(`preflight rejects ${name} without any native submission`, async t => {
  const f = setup(t); await qualify(f); const w = f.transport.add(worker()); const input = f.submission(w);
  Object.assign(f.transport.states.get(w.pane), patch);
  const r = await f.runtime.submit(input); assert.equal(r.phase, 'not-sent'); assert.equal(f.transport.prompts.length, 0);
});
test('read-only scopes cannot be upgraded to writers; state directory remains excluded', async t => {
  const f = setup(t); await qualify(f); const w = f.transport.add(worker());
  assert.throws(() => f.runtime.submit({ ...f.submission(w), role: 'read-only' }), /role/);
  assert.throws(() => f.runtime.submit({ ...f.submission(w), writePaths: ['/fsd-test/mission/runtime'] }), /scope/);
  const r = await f.runtime.submit({ ...f.submission(w), role: 'read-only', writePaths: [] });
  assert.equal(r.phase, 'observing'); assert.match(f.transport.prompts[0].text, /Role: read-only/);
});
test('native acknowledgment cannot reuse the old idle state or an unrelated response', async t => {
  const f = setup(t); await qualify(f); const w = f.transport.add(worker());
  f.transport.promptHook = async () => ({ code: 0, stdout: JSON.stringify({ result: { type: 'agent_prompted', agent: agent(w) } }), stderr: '' });
  const r = await f.runtime.submit(f.submission(w)); assert.equal(r.phase, 'uncertain');
  assert.equal(f.events('completion').length, 0); assert.equal(f.events('reconciliation').length, 1);
});
test('transport timeout is uncertain, retained, and never automatically resent', async t => {
  const f = setup(t); await qualify(f); const w = f.transport.add(worker());
  f.transport.promptHook = async () => { f.transport.move(w, 'working'); throw new Error('timeout'); };
  const input = f.submission(w), r = await f.runtime.submit(input);
  assert.equal(r.phase, 'uncertain'); await f.runtime.submit(input); assert.equal(f.transport.prompts.length, 1);
  await f.runtime.inspect(input.attemptId, true); assert.equal(f.runtime.getAttempt(input.attemptId).phase, 'uncertain');
  await f.runtime.control({ operation: 'adopt', attemptId: input.attemptId, reason: 'Reconciled original report', evidence: 'ID-matched report confirms this exact packet' });
  assert.equal(f.runtime.getAttempt(input.attemptId).confirmation.source, 'coordinator-reconciliation');
});
test('blocker acknowledgment retains observation and original deadline; resumed worker can finish', async t => {
  const f = setup(t); await qualify(f); const w = f.transport.add(worker());
  await f.runtime.submit(f.submission(w)); await flush(); f.transport.move(w, 'blocked'); await flush();
  const e = f.events('blocked')[0]; assert.ok(e); f.runtime.ack(e.id);
  assert.equal(f.runtime.observers.size, 1); assert.ok(f.runtime.timers.has('A1-1'));
  f.transport.move(w, 'working'); await flush(); f.transport.move(w, 'done'); await flush();
  assert.equal(f.events('completion').length, 1); assert.equal(f.events('blocked').length, 1);
});
test('deadline still fires after blocker acknowledgment, and never stops the worker', async t => {
  const f = setup(t); await qualify(f); const w = f.transport.add(worker());
  await f.runtime.submit(f.submission(w)); await flush(); f.transport.move(w, 'blocked'); await flush();
  f.runtime.ack(f.events('blocked')[0].id); f.clock.tick(3600000); await flush();
  assert.equal(f.events('deadline').length, 1); assert.equal(f.transport.states.get(w.pane).agent_status, 'blocked');
  assert.throws(() => f.runtime.submit(f.submission(f.transport.add(worker(3)), 'A2-1')), /deadline/);
});
test('worker identity reuse, out-of-order sequence, and unchanged waits fail without poll loops', async t => {
  const f = setup(t); await qualify(f); const w = f.transport.add(worker());
  f.transport.wait = async () => ({});
  await f.runtime.submit(f.submission(w)); await flush();
  assert.equal(f.events('failure').length, 1); assert.ok(f.transport.gets < 10);
  const a = f.runtime.getAttempt('A1-1');
  assert.throws(() => f.runtime.observe(a, { ...agent(w), state_change_seq: 1 }), /Stale/);
  assert.throws(() => f.runtime.observe(a, { ...agent(w, 'done', 13), terminal_id: 'replacement' }), /identity/);
});
test('owner revision gates stale submissions without resetting start or extending existing attempt deadlines', async t => {
  const f = setup(t); await qualify(f); const w = f.transport.add(worker());
  await f.runtime.submit(f.submission(w)); const started = f.runtime.mission.startedAt, deadline = f.runtime.getAttempt('A1-1').deadline;
  await f.runtime.control({ operation: 'revise', reason: 'Owner explicitly expanded the time allowance', envelope: { ...f.envelope, deadline: new Date(f.clock.time + 7200000).toISOString() } });
  assert.equal(f.runtime.mission.startedAt, started); assert.equal(f.runtime.getAttempt('A1-1').deadline, deadline);
  const b = f.transport.add(worker(3)); assert.throws(() => f.runtime.submit({ ...f.submission(b, 'A2-1'), revision: 1 }), /Superseded/);
  assert.equal(f.store.get('revisions', '2').priorEnvelope.deadline, f.envelope.deadline);
});
test('pause/cancel during preflight prevents input; cancellation after input preserves uncertain effects', async t => {
  const f = setup(t); await qualify(f); const w = f.transport.add(worker()); let release;
  f.transport.getHook = () => new Promise(r => { release = r; });
  const p = f.runtime.submit(f.submission(w));
  await f.runtime.control({ operation: 'pause', reason: 'Owner steering' }); release(agent(w));
  assert.equal((await p).phase, 'not-sent'); assert.equal(f.transport.prompts.length, 0);
  f.transport.getHook = undefined; await retire(f, 'A1-1', 'not-sent');
  await f.runtime.control({ operation: 'resume', reason: 'Owner resumes original work' });
  f.transport.promptHook = async () => { await f.runtime.control({ operation: 'cancel', reason: 'Owner cancels after submission' }); throw new Error('receipt lost'); };
  const result = await f.runtime.submit(f.submission(w, 'A2-1'));
  assert.equal(result.phase, 'uncertain'); assert.equal(f.runtime.mission.status, 'cancelled'); assert.equal(f.transport.prompts.length, 1);
});
test('cannot retire busy work, reuse an occupied worker, or silently turn cancellation into acceptance', async t => {
  const f = setup(t); await qualify(f); const w = f.transport.add(worker()); await f.runtime.submit(f.submission(w));
  await assert.rejects(f.runtime.control({ operation: 'retire', attemptId: 'A1-1', disposition: 'accepted', reason: 'Checked', evidence: 'Report' }), /quiescent/);
  await assert.rejects(f.runtime.control({ operation: 'retire', attemptId: 'A1-1', disposition: 'accepted', handoff: 'Owner must stop worker', reason: 'Checked', evidence: 'Report' }), /Acceptance/);
  const r = await f.runtime.control({ operation: 'retire', attemptId: 'A1-1', disposition: 'cancelled', handoff: 'Owner retains worker; stop through Herdr', reason: 'Explicit handoff', evidence: 'Partial patch retained' });
  assert.equal(r.phase, 'retired'); assert.equal(f.store.get('attempts', 'A1-1').retirement.quiescentVerified, false);
});
test('late acknowledgments after retirement are harmless and never revive watchers', async t => {
  const f = setup(t); await qualify(f); const w = f.transport.add(worker()); f.transport.fast = true;
  await f.runtime.submit(f.submission(w)); await flush(); const e = f.events('completion')[0];
  await retire(f, 'A1-1'); assert.equal(f.runtime.ack(e.id).status, 'retired'); assert.equal(f.runtime.ack(e.id).status, 'retired');
  assert.equal(f.runtime.attempts.size, 0); assert.equal(f.runtime.observers.size, 0);
  assert.throws(() => f.runtime.ack('0'.repeat(64)), /Unknown/);
});
test('pending delivery survives failure; recovery replays exact event and does not resend work', async t => {
  const f = setup(t); await qualify(f); const w = f.transport.add(worker()); f.throwDelivery = true; f.transport.fast = true;
  await f.runtime.submit(f.submission(w)); await flush(); const e = f.events('completion')[0];
  assert.equal(e.status, 'pending'); assert.ok(f.runtime.fault);
  f.throwDelivery = false; await f.runtime.control({ operation: 'resume', reason: 'Delivery bridge recovered' });
  assert.equal(f.store.get('events', e.id).status, 'queued'); assert.equal(f.transport.prompts.length, 1);
  f.runtime.ack(e.id); f.runtime.replay(); assert.equal(f.sent.filter(x => x.id === e.id).length, 1);
});
test('storage failure before input blocks native side effects; failure after input preserves uncertain durable intent', async t => {
  const f = setup(t); await qualify(f); const w = f.transport.add(worker());
  f.store.failWrite = (kind, key, a) => kind === 'attempts' && a.phase === 'submitting';
  const r = await f.runtime.submit(f.submission(w)); assert.equal(f.transport.prompts.length, 0); assert.ok(f.runtime.fault);
  assert.equal(r.phase, 'not-sent');
});
test('post-input receipt persistence failure freezes new dispatch instead of fabricating confirmation', async t => {
  const f = setup(t); await qualify(f); const w = f.transport.add(worker());
  f.store.failWrite = kind => kind === 'evidence';
  const r = await f.runtime.submit(f.submission(w)); assert.equal(r.phase, 'uncertain'); assert.equal(f.transport.prompts.length, 1);
  assert.equal(f.events('completion').length, 0); assert.ok(f.runtime.fault);
  assert.throws(() => f.runtime.submit(f.submission(f.transport.add(worker(3)), 'A2-1')), /reconciliation/);
});
for (const phase of ['preparing', 'submitting']) test(`restart from ${phase} never replays a prompt`, async t => {
  const f = setup(t); await qualify(f); const w = f.transport.add(worker()); const p = f.submission(w);
  await f.runtime.submit(p); await f.runtime.shutdown();
  const a = f.store.get('attempts', p.attemptId); a.phase = phase; delete a.confirmation; f.store.put('attempts', a.id, a);
  f.store.data.delete(`evidence/${a.id}`);
  f.runtime = new Runtime(f.options); await f.runtime.restore(f.store.root); await flush();
  assert.equal(f.transport.prompts.length, 1);
  assert.equal(f.runtime.getAttempt(a.id).phase, phase === 'preparing' ? 'not-sent' : 'uncertain');
  assert.equal(f.runtime.capabilities().automaticDeliveryVerified, false);
});
test('crash after native receipt but before state save adopts only matching receipt, not an old idle state', async t => {
  const f = setup(t); await qualify(f); const w = f.transport.add(worker()); const p = f.submission(w);
  await f.runtime.submit(p); await f.runtime.shutdown(); const a = f.store.get('attempts', p.attemptId); a.phase = 'submitting'; delete a.confirmation; f.store.put('attempts', a.id, a);
  f.runtime = new Runtime(f.options); await f.runtime.restore(f.store.root); await flush();
  assert.equal(f.runtime.getAttempt(a.id).phase, 'observing'); assert.equal(f.transport.prompts.length, 1);
});
test('restart replays queued completion with stable identity but never replays acknowledged events', async t => {
  const f = setup(t); await qualify(f); const w = f.transport.add(worker()); f.transport.fast = true;
  await f.runtime.submit(f.submission(w)); await flush(); const e = f.events('completion')[0]; await f.runtime.shutdown();
  f.runtime = new Runtime(f.options); await f.runtime.restore(f.store.root); await flush();
  assert.equal(f.sent.filter(x => x.id === e.id).length, 2); f.runtime.ack(e.id); await f.runtime.shutdown();
  f.runtime = new Runtime(f.options); await f.runtime.restore(f.store.root); await flush();
  assert.equal(f.sent.filter(x => x.id === e.id).length, 2); assert.equal(f.transport.prompts.length, 1);
});
test('another coordinator session cannot adopt the mission', async t => {
  const f = setup(t); await f.runtime.shutdown();
  f.runtime = new Runtime({ ...f.options, binding: { ...f.options.binding, sessionId: 'another-session' } });
  await assert.rejects(f.runtime.restore(f.store.root), /binding mismatch/);
});
test('more than 32 checkpoints retain evidence without a lifetime registration cap', async t => {
  const f = setup(t); await qualify(f); const w = f.transport.add(worker()); f.transport.fast = true;
  for (let n = 0; n < 50; n++) { const p = f.submission(w, `A${n}-1`); await f.runtime.submit(p); await flush(); await retire(f, p.attemptId); }
  assert.equal(f.store.list('attempts').length, 50); assert.equal(f.store.list('evidence').length, 50);
  assert.equal(f.runtime.attempts.size, 0); assert.equal(f.transport.prompts.length, 50);
  f.runtime.close('delivered', 'Integrated checks passed', 'All disposable workers closed by coordinator');
});
test('closing refuses unresolved ownership and preserves original usage and terminal evidence', async t => {
  const f = setup(t); await qualify(f); const w = f.transport.add(worker()); await f.runtime.submit(f.submission(w));
  assert.throws(() => f.runtime.close('delivered', 'Report', 'No cleanup'), /Unresolved/);
  await retire(f, 'A1-1'); f.runtime.close('delivered', 'ID-matched report and actual tests', 'Native pane removal independently verified');
  assert.equal(f.store.manifest().envelope.usage, f.envelope.usage); assert.ok(f.store.manifest().finishedAt);
});
test('idempotent submit ignores JSON object key order and retains the original default deadline after revision', async t => {
  const f = setup(t); await qualify(f); const w = f.transport.add(worker()); const p = f.submission(w);
  await f.runtime.submit(p);
  await f.runtime.control({ operation: 'revise', reason: 'Owner explicitly adjusts allowance', envelope: { ...f.envelope, deadline: new Date(f.clock.time + 4000000).toISOString() } });
  const reordered = Object.fromEntries(Object.entries(p).reverse());
  assert.equal((await f.runtime.submit(reordered)).duplicate, true); assert.equal(f.transport.prompts.length, 1);
});
test('mission cancellation retires scheduled probes and cannot later be labeled delivered', async t => {
  const f = setup(t); const p = f.runtime.probe(50);
  await f.runtime.control({ operation: 'cancel', reason: 'Owner cancels mission' }); f.clock.tick(100);
  assert.equal(f.sent.length, 0); assert.equal(f.runtime.ack(p.eventId).status, 'retired');
  assert.throws(() => f.runtime.close('delivered', 'nothing', 'no workers'), /remain cancelled/);
  f.runtime.close('cancelled', 'Nothing dispatched', 'No resources created');
});
test('mission revision during retirement forces fresh inspection instead of accepting against old direction', async t => {
  const f = setup(t); await qualify(f); const w = f.transport.add(worker()); await f.runtime.submit(f.submission(w));
  // Stop only the fixture observer so the pending get is specifically the retirement call.
  f.runtime.stopObserver('A1-1'); await flush(); f.transport.move(w, 'done'); let resolve;
  f.transport.getHook = () => new Promise(r => { resolve = r; });
  const pending = f.runtime.control({ operation: 'retire', attemptId: 'A1-1', disposition: 'accepted', reason: 'Review complete', evidence: 'Old criteria' });
  await f.runtime.control({ operation: 'revise', reason: 'Owner changed done criteria', envelope: { ...f.envelope, doneCriteria: 'New checks required' } });
  resolve(structuredClone(f.transport.states.get(w.pane))); await assert.rejects(pending, /changed during retirement/);
  assert.notEqual(f.runtime.getAttempt('A1-1').phase, 'retired'); f.transport.getHook = undefined;
});
test('shutdown during native submission retains uncertainty before releasing state and emits no late wake', async t => {
  const f = setup(t); await qualify(f); const w = f.transport.add(worker()); let entered;
  const waiting = new Promise(r => { entered = r; });
  f.transport.promptHook = (_w, _text, _timeout, signal) => new Promise((_resolve, reject) => {
    entered(); signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
  });
  const p = f.runtime.submit(f.submission(w)); await waiting;
  const before = f.sent.length; await f.runtime.shutdown(); await p;
  assert.equal(f.store.get('attempts', 'A1-1').phase, 'uncertain'); assert.equal(f.sent.length, before); assert.equal(f.store.closed, true);
});
test('a shortened mission deadline applies now without overwriting original attempt allowance', async t => {
  const f = setup(t); await qualify(f); const w = f.transport.add(worker()); await f.runtime.submit(f.submission(w));
  const original = f.runtime.getAttempt('A1-1').deadline;
  await f.runtime.control({ operation: 'revise', reason: 'Owner shortens remaining time', envelope: { ...f.envelope, deadline: new Date(f.clock.time + 1000).toISOString() } });
  f.clock.tick(1000); await flush(); assert.equal(f.events('deadline').length, 1);
  assert.equal(f.runtime.getAttempt('A1-1').deadline, original);
});
test('handed-off running work still reserves its worker/workspace until explicitly reconciled quiescent', async t => {
  const f = setup(t); await qualify(f); const w = f.transport.add(worker()); await f.runtime.submit(f.submission(w));
  await f.runtime.control({ operation: 'retire', attemptId: 'A1-1', disposition: 'cancelled', reason: 'Hand off', evidence: 'Partial patch retained', handoff: 'Owner will stop this worker' });
  assert.equal(f.runtime.summary().retainedHandoffs.length, 1);
  assert.throws(() => f.runtime.submit(f.submission(w, 'A2-1')), /unresolved/);
  const b = f.transport.add(worker(3, w.cwd)); assert.throws(() => f.runtime.submit(f.submission(b, 'A2-1')), /ownership/);
  await f.runtime.shutdown(); f.runtime = new Runtime(f.options); await f.runtime.restore(f.store.root); await qualify(f);
  assert.throws(() => f.runtime.submit(f.submission(b, 'A2-1')), /ownership/);
  f.transport.move(w, 'done');
  await f.runtime.control({ operation: 'retire', attemptId: 'A1-1', reason: 'Owner confirms stop', evidence: 'Live quiescence and retained files checked' });
  assert.equal(f.runtime.summary().retainedHandoffs.length, 0);
  assert.equal((await f.runtime.submit(f.submission(b, 'A2-1'))).phase, 'observing');
});
test('corrupt persisted deadlines fail before any resumed native I/O', async t => {
  const f = setup(t); await qualify(f); const w = f.transport.add(worker()); await f.runtime.submit(f.submission(w)); await f.runtime.shutdown();
  const a = f.store.get('attempts', 'A1-1'); a.deadline = 'not-a-time'; f.store.put('attempts', a.id, a);
  const gets = f.transport.gets; f.runtime = new Runtime(f.options); await assert.rejects(f.runtime.restore(f.store.root));
  assert.equal(f.transport.gets, gets); assert.equal(f.transport.prompts.length, 1);
});
test('idle probe has no timer race, coalesces pending requests, and resume cannot deliver it early', async t => {
  const f = setup(t); const p = f.runtime.probe(0, 'idle');
  assert.equal(f.runtime.probe(0, 'idle').eventId, p.eventId);
  f.clock.tick(20000); f.runtime.replay();
  await f.runtime.control({ operation: 'resume', reason: 'Reconcile delivery' });
  assert.equal(f.sent.length, 0); assert.equal(f.clock.timers.size, 0);
  assert.throws(() => f.runtime.ack(p.eventId), /not been queued/);
  f.idle = true; f.runtime.deliverIdleProbe(); assert.equal(f.sent.length, 1);
  f.runtime.ack(p.eventId); assert.equal(f.runtime.verified.idle, true);
  f.runtime.deliverIdleProbe(); assert.equal(f.sent.length, 1);
});
for (const stop of ['cancel', 'deadline', 'shutdown']) test(`${stop} prevents a pending idle probe from reviving work`, async t => {
  const f = setup(t); const p = f.runtime.probe(0, 'idle');
  if (stop === 'cancel') await f.runtime.control({ operation: 'cancel', reason: 'Stop qualification' });
  if (stop === 'deadline') f.clock.tick(3600000);
  if (stop === 'shutdown') await f.runtime.shutdown();
  f.idle = true; f.runtime.deliverIdleProbe(); assert.equal(f.sent.length, 0);
  assert.equal(f.store.get('events', p.eventId).status, 'retired');
});
test('idle probe rejects timer mixing and invalid delivery modes', t => {
  const f = setup(t); assert.throws(() => f.runtime.probe(5000, 'idle'), /settled event/);
  assert.throws(() => f.runtime.probe(0, 'invented'), /settled event/);
});
