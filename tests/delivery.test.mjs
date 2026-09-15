// Development-only documentation contracts. No host tools, agents or watches are run.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const text = path => read(path).replace(/\s+/g, ' ');

test('one Herdr/filesystem/native-wakeup path has no prescribed extension dependency', () => {
  const skill = text('SKILL.md');
  assert.match(skill, /Herdr is the only runtime dependency/);
  assert.match(skill, /## One usage path/);
  assert.match(skill, /already-available native host facility/);
  assert.match(text('README.md'), /Herdr tabs → filesystem reports → existing native wakeup → coordinator verification/);
  assert(!existsSync(new URL('../references/pi-herdr.md', import.meta.url)), 'Remove the superseded transport guide');
  const docs = ['SKILL.md', 'README.md'];
  for (const dir of ['references', 'templates']) {
    for (const name of readdirSync(new URL(`../${dir}/`, import.meta.url))) {
      if (name.endsWith('.md')) docs.push(`${dir}/${name}`);
    }
  }
  for (const path of docs)
    assert.doesNotMatch(read(path), /pi-interactive-shell|interactive_shell|pi-inbox|pi-herdr\.md|fsd_runtime|provider job ID|observerTimeoutMs/, path);
});

test('Herdr harness integrations are an installed baseline, not a setup project', () => {
  assert.match(text('SKILL.md'), /Assume Herdr's integration for each coding harness is installed/);
  assert.match(text('references/setup.md'), /do not run an integration installer/);
  assert.match(text('references/herdr.md'), /Assume Herdr's integration for each coding harness is installed/);
});

test('workers get dedicated Herdr tabs with no split-pane fallback', () => {
  const herdr = text('references/herdr.md');
  assert.match(text('SKILL.md'), /each new worker in its own Herdr tab, never a split pane/);
  assert.match(herdr, /one new, goal-owned Herdr tab per worker/);
  assert.match(herdr, /Do not use `herdr pane split`/);
  assert.match(herdr, /Do not fall back to split panes/);
  assert.match(herdr, /generic sibling-pane default/);
  assert.match(herdr, /\.result\.root_pane\.pane_id/);
  assert.match(herdr, /`agent start --pane` targets that tab's root pane; it does not create a split/);
  const command = read('references/herdr.md').match(/<!-- fsd-example: herdr-worker-tab -->\n```sh\n([\s\S]*?)\n```/)?.[1];
  assert.equal(command, 'herdr tab create --workspace WORKSPACE_ID --cwd WORKER_CWD --label WORKER_LABEL --no-focus');
  for (const choice of ['workerLayout: "tab-per-worker"', 'allowPaneSplits: false', 'preserveFocus: true'])
    assert(text('references/setup.md').includes(choice));
});

test('direct Herdr submission uses a bounded startup receipt, never a controller completion wait', () => {
  const herdr = text('references/herdr.md');
  assert.match(herdr, /submit through native `agent prompt` exactly once/);
  assert.match(herdr, /herdr agent prompt TARGET TEXT --wait --until working --until idle --until done --until blocked --timeout 10000/);
  assert.match(herdr, /Use the shorter remaining goal\/attempt allowance/);
  assert.match(herdr, /Do not run default `agent prompt --wait` or `agent wait` as a task-completion wait/);
  assert.match(herdr, /already-armed native wakeup facility/);
});

test('unattended wakeup is required but missing capabilities cannot authorize new machinery', () => {
  const delivery = text('references/delivery.md');
  assert.match(text('SKILL.md'), /Automatic wakeup is required for unattended delegation/);
  assert.match(delivery, /already-exposed native filesystem-watch facility/);
  assert.match(delivery, /native worker-lifecycle events/);
  assert.match(delivery, /Do not add packages, extensions, services, helper models or custom watcher\/controller code/);
  assert.match(delivery, /stop affected unattended delegation before launching workers/);
  assert.match(delivery, /Do not silently switch to manual resumption/);
  assert.match(delivery, /Continue independent direct work/);
  assert.match(delivery, /unverified/);
  assert.match(delivery, /unavailable/);
});

test('native observation requires actual busy/idle, session, deadline and cleanup evidence', () => {
  const delivery = text('references/delivery.md');
  assert.match(delivery, /after it becomes genuinely idle/);
  assert.match(delivery, /without typing into or changing the human editor/);
  assert.match(delivery, /specific-handle stop controls/);
  assert.match(delivery, /silently stops observation is not a deadline notification/);
  assert.match(delivery, /Reuse applicable proof/);
  assert.match(delivery, /Arm observation before the final inbox scan and before dispatch/);
  assert.match(delivery, /blocked-worker detection are different capabilities/);
  assert.match(delivery, /already-available host facility/);
  assert.match(delivery, /Cancelling a watch does not stop a Herdr worker/);
});

test('multiple workers share wakeups but retain distinct inboxes and report identities', () => {
  const delivery = text('references/delivery.md');
  assert.match(delivery, /each worker attempt its own inbox and unique report identity/);
  assert.match(delivery, /one native recursive watch/);
  assert.match(delivery, /native watches for each assigned inbox before dispatch/);
  assert.match(delivery, /Scan all pending inboxes on every wakeup/);
  assert.match(delivery, /Never equate event count with completed-worker count/);
});

test('records distinguish native watch registration, startup, reports and acceptance', () => {
  const attempt = text('templates/attempt.md');
  assert.match(attempt, /Armed native watch handle/);
  assert.match(attempt, /distinct from the startup receipt and watch registration/);
  assert.match(text('templates/goal.md'), /Missing capabilities that block unattended dispatch/);
  assert.match(text('templates/state.md'), /Already-available native wakeup facility/);
  assert.match(text('references/filesystem.md'), /Neither sent bytes nor an armed watch prove worker startup or completion/);
  assert.match(text('README.md'), /not agent compliance or end-to-end delivery/);
});
