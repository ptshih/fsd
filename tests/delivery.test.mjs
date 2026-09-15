// Development-only documentation contracts. Tool calls are captured, never executed.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const method = read('references/pi-herdr.md');
const example = method.match(/<!-- fsd-example: pi-herdr-dispatch -->\n```js\n([\s\S]*?)\n```/)?.[1];

function capture(observerTimeoutMs) {
  assert(example, 'Preferred method must include its concrete agent-side tool call');
  const calls = [];
  const values = {
    herdrPromptCommand: "herdr agent prompt 'fixture-worker' 'approved fixture task' --wait --timeout 1000",
    coordinatorCwd: '/private/fixture',
    observerTimeoutMs,
  };
  runInNewContext(example, {
    ...values,
    interactive_shell: args => calls.push(JSON.parse(JSON.stringify(args))),
  }, { timeout: 1000 });
  assert.equal(calls.length, 1, 'Exactly one background controller submission');
  return { args: calls[0], values };
}

test('Pi-in-Herdr default directs discovery to a concrete preferred method', () => {
  const skill = read('SKILL.md');
  assert.match(skill, /default environment is \*\*Pi as coordinator inside Herdr\*\*/);
  for (const path of ['SKILL.md', 'README.md', 'references/setup.md', 'references/delivery.md', 'references/herdr.md']) {
    assert.match(read(path), /\]\((?:references\/)?pi-herdr\.md\)/, `${path} must link the preferred method`);
  }
  assert.match(method, /separately installed and approved host\nextension/);
  assert.match(method, /No `pi-subagents` tool/);
});

test('preferred command uses headless dispatch with quiet auto-close disabled, not an agent spawn', () => {
  const { args, values } = capture(5000);
  assert.deepEqual(args, {
    command: values.herdrPromptCommand,
    cwd: values.coordinatorCwd,
    mode: 'dispatch',
    background: true,
    handsFree: { autoExitOnQuiet: false },
    timeout: 5000,
  });
  assert.equal(args.spawn, undefined);
  assert.equal(args.monitor, undefined);
});

test('dispatch example preserves the validated caller timeout rather than inventing a new allowance', () => {
  for (const remaining of [1500, 5000, 9000]) {
    const { args } = capture(remaining);
    assert.equal(args.timeout, remaining);
  }
  assert.match(method, /Neither timeout\nmay extend the goal deadline/);
});

test('discovery distinguishes unverified from verified and unavailable without waiving authority', () => {
  for (const status of ['unverified', 'verified', 'unavailable'])
    assert(method.includes(`**${status}:**`));
  assert.match(method, /Live qualification needs the goal's approval/);
  assert.match(method, /Reuse still-applicable proof/);
  assert.match(method, /Do not silently install a package, change preferences, create a bridge/);
  assert.match(read('SKILL.md'), /Direct work requires no worker-completion wakeup/);
});

test('attempt records distinguish the background job receipt from native worker evidence', () => {
  const attempt = read('templates/attempt.md');
  assert.match(attempt, /provider job ID and owning coordinator session/);
  assert.match(attempt, /Provider job receipt versus actual worker startup\/completion receipt/);
  assert.match(method, /job-start receipt proves neither worker startup nor/);
  assert.match(method, /new\n  approved observer uses `herdr agent wait`, \*\*not another prompt\*\*/);
  assert.match(method, /Stopping\/dismissing the controller job does not prove the Herdr worker stopped/);
});

test('method documentation does not convert source review or local checks into live qualification', () => {
  assert.match(method, /\*\*not a live Pi\/Herdr pass\*\*/);
  assert.match(method, /Do not claim recovery across reload, session switch or host exit/);
  assert.match(method, /Do not claim coverage of every Pi\npermission\/question UI without proof/);
});
