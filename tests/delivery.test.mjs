// Development-only documentation contracts. The two tagged shell blocks run against
// fixtures and a stub `herdr`; no agents, host facilities or watches are started.
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const text = path => read(path).replace(/\s+/g, ' ');

test('one Herdr/filesystem/native-wakeup path prescribes no extension beyond Pi background dispatch', () => {
  const skill = text('SKILL.md');
  assert.match(skill, /Herdr is the only runtime dependency/);
  assert.match(skill, /## One usage path/);
  assert.match(skill, /already-available native host facility/);
  assert.match(text('README.md'), /Herdr tabs → filesystem reports → existing native wakeup → coordinator verification/);
  const docs = ['SKILL.md', 'README.md'];
  for (const dir of ['references', 'templates']) {
    for (const name of readdirSync(new URL(`../${dir}/`, import.meta.url))) {
      if (name.endsWith('.md')) docs.push(`${dir}/${name}`);
    }
  }
  for (const name of readdirSync(new URL('../agents/', import.meta.url)))
    if (name.endsWith('.md')) docs.push(`agents/${name}`);
  for (const path of docs) {
    assert.doesNotMatch(read(path), /pi-inbox|pi-herdr\.md|fsd_runtime|provider job ID|observerTimeoutMs/, path);
    if (!['SKILL.md', 'README.md', 'references/setup.md'].includes(path))
      assert.doesNotMatch(read(path), /pi-interactive-shell|interactive_shell/, `${path} must not name the Pi extension`);
  }
  assert.equal((read('README.md').match(/^pi install npm:/gm) ?? []).length, 1, 'exactly one prescribed Pi extension');
});

test('pi coordinators require the background-dispatch extension and never wait through the blocking shell tool', () => {
  const setup = text('references/setup.md');
  const delivery = text('references/delivery.md');
  assert.match(setup, /## Pi coordinators/);
  assert.match(setup, /Pi's built-in shell tool returns only when its command exits/);
  assert.match(setup, /requires the `pi-interactive-shell` extension, which the owner installs once with `pi install npm:pi-interactive-shell`/);
  assert.match(setup, /Direct work needs nothing, Pi workers do not need it/);
  assert.match(setup, /returns at once with a `sessionId` — the handle to record in goal state, query \(`sessionId` alone\) and stop \(`kill: true`, or `dismissBackground` with that id\)/);
  assert.match(setup, /`monitor` mode with the `file-watch` strategy is a native inbox watcher/);
  assert.match(setup, /give it an absolute inbox path \(a relative one resolves from the cwd\), `recursive` only where the platform supports it, and the same bounded `timeout`, whose expiry is notified/);
  assert.match(setup, /`mode: "dispatch"` with `background: true`, `handsFree: \{ autoExitOnQuiet: false \}`/);
  assert.match(setup, /a `timeout` in milliseconds above the wait's own \(Herdr's `--timeout` is milliseconds; the inbox poll's `REMAINING_S` is seconds\)/);
  assert.match(setup, /Redirect the wait's output to the attempt's evidence directory/);
  assert.match(setup, /its own guidelines and `spawn` parameter offer agent delegation through the shell, which is not the FSD route/);
  assert.match(setup, /Verified 2026-09-15 with pi-interactive-shell 0\.15\.2/);
  assert.match(setup, /check your own tool list for `interactive_shell` \(a package listing is not tool availability\), call `enable_interactive_shell` first/);
  assert.match(setup, /Never install, update or change the extension's stored settings for a goal/);
  assert.match(setup, /unattended delegation is \*\*unavailable\*\*: continue direct work and make the one specific install request/);
  assert.match(setup, /the tool appears only in a reloaded or new Pi session; treat that as a new coordinator session/);
  assert.match(delivery, /on Pi, the required extension's background dispatch/);
  assert.match(delivery, /the tool's own timeout \(milliseconds\) above the wait's/);
  assert.match(delivery, /Codex has no verified idle-wakeup facility \(as of 2026-09-17\)/);
  assert.match(delivery, /A shell tool that returns only when its command exits is not a facility: a wait run through it holds the turn/);
  assert.match(delivery, /prerequisites are verified, never installed by the coordinator/);
  assert.match(delivery, /no native filesystem watcher \(Claude Code on macOS\)/);
  assert.match(delivery, /lacks the required extension's tool \(after trying its deferred loader\) has an unavailable facility, not an unverified one/);
  assert.match(text('SKILL.md'), /a Pi coordinator's tools must include the \[background-dispatch extension\]\(references\/setup\.md#pi-coordinators\)/);
  assert.match(text('SKILL.md'), /must include the pi-interactive-shell extension \(background dispatch; see references\/setup\.md\)/);
  assert.match(text('SKILL.md'), /never the built-in shell tool, which holds the turn until its command exits/);
  assert.match(text('README.md'), /the first line only where Pi will coordinate; workers do not need it/);
  assert.match(text('README.md'), /native in Claude Code; on Pi, from the `pi-interactive-shell` extension/);
  assert.match(text('README.md'), /`pi update npm:pi-interactive-shell`/);
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

test('Herdr submission has a bounded startup receipt and native-wakeup mode yields to its facility', () => {
  const herdr = text('references/herdr.md');
  assert.match(herdr, /submit through native `agent prompt` exactly once/);
  assert.match(herdr, /herdr agent prompt TARGET TEXT --wait --until working --until idle --until done --until blocked --timeout 10000/);
  assert.match(herdr, /Use the shorter remaining goal\/attempt allowance/);
  assert.match(herdr, /In native-wakeup mode, do not run default `agent prompt --wait` or `agent wait` as a task-completion wait/);
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

test('workers wake the coordinator through a background settled-state wait, with inbox watch as fallback', () => {
  const delivery = text('references/delivery.md');
  const herdr = read('references/herdr.md');
  assert.match(delivery, /Settled-state wait \(preferred\)/);
  assert.match(delivery, /one wait per worker attempt, armed immediately after the startup receipt/);
  assert.match(delivery, /A worker that already settled returns at once/);
  assert.match(delivery, /Inbox watch \(fallback and supplement\)/);
  assert.match(delivery, /block the model turn on a completion wait/);
  assert.match(text('references/herdr.md'), /`agent wait` belongs only inside the host's already-available background facility/);
  const start = herdr.match(/<!-- fsd-example: herdr-worker-start -->\n```sh\n([\s\S]*?)\n```/)?.[1];
  assert.equal(start, 'herdr agent start WORKER_NAME --kind HARNESS --pane ROOT_PANE_ID --timeout 30000 -- LAUNCH_ARGS');
  const wait = herdr.match(/<!-- fsd-example: herdr-worker-wait -->\n```sh\n([\s\S]*?)\n```/)?.[1];
  assert.equal(wait, 'herdr agent wait WORKER_NAME --timeout REMAINING_MS');
  assert.match(text('SKILL.md'), /arm the worker's settled-state wait/);
  assert.match(text('templates/attempt.md'), /settled-state wait handle/);
});

test('the settled-state wait is primary only where qualified; agy and codex pair it with inbox observation', () => {
  const delivery = text('references/delivery.md');
  assert.match(delivery, /stays primary on every harness where it is qualified/);
  assert.match(delivery, /Qualified so far: Claude Code \(2026-09-17\) and Pi \(2026-09-17, goal `sh-compat-01`: a builder's wait returned with its report already in the inbox, and a status read three seconds later showed `done`; Herdr 0\.9\.1, Pi 0\.85\.1\)/);
  assert.match(delivery, /on an Antigravity \(`agy`\) worker is now qualified as \*\*unreliable\*\*/);
  assert.match(delivery, /on a `codex` worker \(as of 2026-09-17\), so it remains \*\*unverified\*\*/);
  assert.match(delivery, /\*\*On any harness whose settled-state wait is not qualified — `agy` \(unreliable\) and `codex` \(unverified\) — always pair the wait with inbox observation or visible output inspection\.\*\*/);
  assert.match(delivery, /is evidence about the facility's contract, not this session's proof: a new coordinator session still runs the harmless probe once before its first dispatch/);
  assert.match(delivery, /the inbox poll is the primary completion signal/);
  assert.match(delivery, /a hint to inspect, not proof of settlement/);
  assert.match(delivery, /A harness leaves this list only when its qualifying observation is recorded above/);
  assert.match(text('references/herdr.md'), /On a harness whose wait is not qualified \(`agy` and `codex` as of 2026-09-17\), also arm the inbox observation/);
});

test('worker selections come from the owner\'s preferences roster or direction, and the packet\'s worker_kind matches', () => {
  assert.match(text('SKILL.md'), /owner's preferences file \(`\$XDG_CONFIG_HOME\/fsd\/preferences\.json`, else `~\/\.config\/fsd\/preferences\.json`\) once per goal; a worker's harness, model and effort come from its `roles\.<name>` entry there, or from the owner's current direction, and go into the packet — "your default model" is not a selection/);
  assert.match(text('references/setup.md'), /Read the file itself, not only this page \(\[role files\]\(#role-files\) say what it supplies\)/);
  assert.match(text('references/setup.md'), /the packet's `worker_kind` is that harness; anything else is a disclosed substitution/);
  assert.match(text('templates/assignment.md'), /Approved effective harness, model, effort, tools and authority \(from preferences `roles\.<name>` or the owner's direction; never "your default model"; `worker_kind` above must be this harness\)/);
});

test('smoke-qualified lessons: effective launch, dialog waits, native exit, current revision', () => {
  const herdr = text('references/herdr.md');
  assert.match(herdr, /Many owners alias `claude` to add `--dangerously-skip-permissions`/);
  const startCommand = read('references/herdr.md').match(/<!-- fsd-example: herdr-worker-start-command -->\n```sh\n([\s\S]*?)\n```/)?.[1];
  assert.equal(startCommand, 'herdr pane run ROOT_PANE_ID "command claude LAUNCH_ARGS"');
  assert.match(text('references/setup.md'), /hardened Claude workers start with the alias bypassed/);
  assert.match(herdr, /read the footer back until it matches/);
  assert.match(herdr, /After answering a dialog, wait for `working` or `idle` only/);
  assert.match(herdr, /`agent send-keys TARGET ctrl\+c ctrl\+c`, both presses in one call/);
  assert.match(herdr, /a retry or replacement packet must not inherit an earlier packet's values/);
  assert.match(text('templates/assignment.md'), /never copy them from an earlier packet/);
  assert.match(text('references/setup.md'), /Hardened Claude Code plan mode still permits read-only shell commands/);
  assert.match(text('agents/reviewer.md'), /run them only if your mode permits shell commands/);
});

test('native reports are captured before teardown and startup dialogs are handled before dispatch', () => {
  const herdr = text('references/herdr.md');
  assert.match(herdr, /Capture any native report to evidence first with `agent read --source recent-unwrapped`/);
  assert.match(herdr, /If `agent start` returns `agent_not_ready`, the pane is at a startup dialog/);
  assert.match(text('references/filesystem.md'), /A native report has no inbox event/);
  assert.match(text('references/delivery.md'), /and the facility's own maximum; renew on expiry after reconciling/);
  assert.match(text('SKILL.md'), /or report natively when hardened read-only/);
});

test('coordinator names itself, drafts are private, and harness exit keys are named', () => {
  const herdr = read('references/herdr.md');
  const agent = herdr.match(/<!-- fsd-example: herdr-coordinator-agent -->\n```sh\n([\s\S]*?)\n```/)?.[1];
  assert.equal(agent, 'herdr agent rename "$HERDR_PANE_ID" fsd-GOAL_SLUG');
  const tab = herdr.match(/<!-- fsd-example: herdr-coordinator-tab -->\n```sh\n([\s\S]*?)\n```/)?.[1];
  assert.equal(tab, 'herdr tab rename "$HERDR_TAB_ID" "FSD GOAL_SLUG"');
  assert.match(text('references/herdr.md'), /rename your own tab only when it is dedicated to this goal/);
  assert.match(text('references/herdr.md'), /Pi: `ctrl\+d`/);
  assert.match(text('SKILL.md'), /name yourself in Herdr/);
  assert.match(text('templates/goal.md'), /Coordinator Herdr agent name, tab label and the tab's prior label/);
  assert.match(text('references/worker.md'), /set `umask 077`, write a complete private `\.tmp-` draft/);
  assert.match(text('references/recipes.md'), /set `umask 077` before writing them/);
});

test('codex workers get a writable inbox, unknown native identity, and a named exit key', () => {
  assert.match(text('references/setup.md'), /Replace `REPORT_INBOX` with the attempt's inbox directory/);
  assert.match(text('references/setup.md'), /a Codex worker reports `worker_session: "unknown"`/);
  assert.match(text('references/herdr.md'), /Claude Code and Codex: `agent send-keys TARGET ctrl\+c ctrl\+c`, both presses in one call, because Claude Code only exits on a second ctrl\+c inside its short confirmation window and two presses sent as separate commands did not exit it; Pi: `ctrl\+d`/);
  assert.match(text('references/herdr.md'), /can also return `agent_started`\/`idle` while such a dialog is showing/);
});

test('evidence captures are bounded: one footer line and header-to-verdict reports', () => {
  const herdr = text('references/herdr.md');
  assert.match(herdr, /keep the single footer line that shows the effective model, thinking level and permission mode/);
  assert.match(herdr, /for a native report keep the text from its identity header to its verdict or final line/);
});

const example = (path, name) => read(path).match(new RegExp(`<!-- fsd-example: ${name} -->\\n\`\`\`sh\\n([\\s\\S]*?)\\n\`\`\``))?.[1];
const quote = value => `'${value.replace(/'/g, "'\\''")}'`;
const shells = () => ['/bin/sh', ...(spawnSync('zsh', ['-f', '-c', ':'], { timeout: 5000 }).status === 0 ? ['zsh'] : [])];
const argv = shell => shell === 'zsh' ? ['-f', '-c'] : ['-c'];
const posix = { skip: process.platform === 'win32' && 'Requires a POSIX shell' };
function run(shell, script, options = {}) {
  return new Promise(resolve => {
    const child = spawn(shell, [...argv(shell), script], { encoding: 'utf8', timeout: 10000, ...options });
    let stdout = '', stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('close', status => resolve({ status, stdout, stderr }));
    options.after?.(child);
  });
}

test('the inbox poll exits on the first new report or its deadline and fails loudly on bad input', posix, async t => {
  const block = example('references/delivery.md', 'inbox-poll');
  assert(block, 'inbox poll example required');
  assert.equal(spawnSync('/bin/sh', ['-n'], { input: block, encoding: 'utf8', timeout: 5000 }).status, 0);
  // Physical paths matter on hosts where the OS temporary-directory path contains symlinks.
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'fsd poll-')));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const poll = (inbox, remaining) => block.replace('ATTEMPT_INBOX', quote(inbox)).replace('REMAINING_S', remaining);
  await Promise.all(shells().flatMap(shell => {
    // A path with a space checks the quoted replacement; a pre-existing report and a
    // leading-dot draft belong to the snapshot and must not fire.
    const label = shell.replaceAll('/', '_'), quiet = join(root, `${label} quiet`), live = join(root, `${label} live`);
    for (const inbox of [quiet, live]) {
      mkdirSync(inbox);
      writeFileSync(join(inbox, 'E1.md'), '');
      writeFileSync(join(inbox, '.tmp-draft.md'), '');
    }
    return [
      run(shell, poll(quiet, '1')).then(result => {
        assert.equal(result.status, 0, `${shell}: ${result.stderr}`);
        assert.match(result.stdout, /^POLL_EXPIRED \d\d:\d\d:\d\dZ\n$/, shell);
      }),
      run(shell, poll(live, '5'), { after: child => {
        const timer = setTimeout(() => writeFileSync(join(live, 'E2.md'), ''), 300);
        child.on('close', () => clearTimeout(timer));
      } }).then(result => {
        assert.equal(result.status, 0, `${shell}: ${result.stderr}`);
        assert.match(result.stdout, /^INBOX_CHANGED \d\d:\d\d:\d\dZ\n$/, `${shell} must exit on the first change`);
      }),
      run(shell, poll(join(root, 'missing'), '1')).then(result => assert.equal(result.status, 1, `${shell}: missing inbox`)),
      run(shell, block.replace('ATTEMPT_INBOX', quote(quiet))).then(result => assert.equal(result.status, 1, `${shell}: unreplaced REMAINING_S`)),
    ];
  }));
});

test('the dispatch receipt keeps stdout, stderr and exit status, refuses to overwrite, and propagates the status', posix, t => {
  const block = example('references/herdr.md', 'dispatch-receipt');
  assert(block, 'dispatch receipt example required');
  assert.equal(spawnSync('/bin/sh', ['-n'], { input: block, encoding: 'utf8', timeout: 5000 }).status, 0);
  assert.match(block, /^\( umask 077; set -C; /);
  const root = mkdtempSync(join(tmpdir(), 'fsd receipt-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  // The stub records every invocation, so a refused rerun is proven never to submit.
  mkdirSync(join(root, 'bin'));
  writeFileSync(join(root, 'bin', 'herdr'), '#!/bin/sh\nprintf \'%s\\n\' "$*" >> "$FSD_TEST_LOG"\necho \'{"status":"agent_prompted"}\'\necho "stub: timed out" >&2\nexit "$FSD_TEST_EXIT"\n', { mode: 0o700 });
  const env = { ...process.env, PATH: `${join(root, 'bin')}:${process.env.PATH ?? '/usr/bin:/bin'}`, FSD_TEST_LOG: join(root, 'calls') };
  const calls = () => { try { return readFileSync(join(root, 'calls'), 'utf8').trim().split('\n'); } catch { return []; } };
  for (const shell of shells()) {
    const goal = join(root, `${shell.replaceAll('/', '_')} goal`);
    mkdirSync(join(goal, 'evidence'), { recursive: true });
    const script = block.replace('GOAL_DIR', goal).replace('ATTEMPT_ID', 'A1');
    const receipt = suffix => join(goal, 'evidence', `A1.receipt.${suffix}`);
    const submit = exit => spawnSync(shell, [...argv(shell), script], { encoding: 'utf8', timeout: 5000, env: { ...env, FSD_TEST_EXIT: String(exit) } });
    const before = calls().length;
    const first = submit(3);
    assert.equal(first.status, 3, `${shell}: Herdr's own exit status is the command's`);
    assert.equal(calls().length, before + 1);
    assert.match(calls().at(-1), /^agent prompt TARGET TEXT --wait /);
    assert.equal(readFileSync(receipt('json'), 'utf8'), '{"status":"agent_prompted"}\n');
    assert.equal(readFileSync(receipt('err'), 'utf8'), 'stub: timed out\nexit 3\n');
    for (const suffix of ['json', 'err']) assert.equal(statSync(receipt(suffix)).mode & 0o777, 0o600);
    const rerun = submit(0);
    assert.equal(rerun.status, 1, `${shell}: an existing receipt must be refused`);
    assert.equal(calls().length, before + 1, `${shell}: a refused rerun must not submit`);
    assert.equal(readFileSync(receipt('err'), 'utf8'), 'stub: timed out\nexit 3\n');
    rmSync(receipt('json'));
    assert.equal(submit(0).status, 1, `${shell}: a lone .err is still a retained receipt`);
    assert.equal(calls().length, before + 1);
    assert.deepEqual(readdirSync(join(goal, 'evidence')), ['A1.receipt.err']);
  }
});
