// Development-only execution of the exact documented shell blocks. No agents or host settings.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, closeSync, existsSync, lstatSync, mkdirSync, mkdtempSync, openSync,
  readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

const document = readFileSync(new URL('../references/recipes.md', import.meta.url), 'utf8');
const blocks = [...document.matchAll(/<!-- fsd-example: ([a-z-]+) -->\n```sh\n([\s\S]*?)\n```/g)];
const recipes = new Map(blocks.map(([, name, code]) => [name, code]));
const posix = process.platform !== 'win32';
const shellOptions = { skip: posix ? false : 'Examples require an existing POSIX shell and local filesystem' };

function fixture(t) {
  // Physical paths matter on hosts where the OS temporary-directory path contains symlinks.
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'fsd recipe-')));
  chmodSync(root, 0o700);
  t.after(() => rmSync(root, { recursive: true, force: true }));
  // Keep even a broken traversal guard's ../escape destination inside this owned fixture.
  for (const name of ['goals', 'inbox', 'drafts', 'goal', 'outside', 'bin'])
    mkdirSync(join(root, name), { mode: 0o700 });
  const env = {
    GOAL_PARENT: join(root, 'goals'), GOAL_ID: 'new-goal', GOAL: join(root, 'goal'),
    INBOX: join(root, 'inbox'), EVENT_ID: 'E1',
    MESSAGE: join(root, 'drafts', 'message.txt'), STATE_DRAFT: join(root, 'drafts', 'state.txt'),
  };
  writeFileSync(env.MESSAGE, 'event_id: E1\nkind: result-ready\n\nSynthetic complete report: ✓\n', { mode: 0o600 });
  writeFileSync(env.STATE_DRAFT, '# State\n\nInspection pending.\n', { mode: 0o600 });
  return { root, env };
}

function run(name, f, overrides = {}) {
  assert(recipes.has(name), `Missing example: ${name}`);
  const result = spawnSync('/bin/sh', ['-c', recipes.get(name)], {
    cwd: f.root, env: { ...process.env, ...f.env, ...overrides },
    encoding: 'utf8', timeout: 5000,
  });
  assert.ifError(result.error);
  assert.equal(result.signal, null, 'Example must finish normally, not time out');
  return result;
}

function success(result) {
  assert.equal(result.status, 0, result.stderr);
}

function failure(result) {
  assert.notEqual(result.status, 0, 'Unsafe or failed operation must not report success');
}

function mode(path) {
  return lstatSync(path).mode & 0o777;
}

function temporaries(path) {
  return readdirSync(path).filter(name => name.startsWith('.tmp-'));
}

function fault(f, command, body) {
  // Isolated command failure injection, never an installed helper or changed global PATH.
  writeFileSync(join(f.root, 'bin', command), `#!/bin/sh\n${body}\n`, { mode: 0o700 });
  return { PATH: `${join(f.root, 'bin')}:${process.env.PATH ?? '/usr/bin:/bin'}` };
}

test('every documented shell example has a unique development-test identity', () => {
  assert.equal(blocks.length, recipes.size);
  assert.deepEqual([...recipes.keys()], ['private-goal', 'publish-message', 'replace-state']);
  assert.equal([...document.matchAll(/^```sh$/gm)].length, recipes.size);
});

test('exact documented examples pass POSIX shell syntax checks', shellOptions, () => {
  for (const [name, code] of recipes) {
    const result = spawnSync('/bin/sh', ['-n'], { input: code, encoding: 'utf8', timeout: 5000 });
    assert.ifError(result.error);
    assert.equal(result.status, 0, `${name}: ${result.stderr}`);
  }
});

test('fresh goal creation is private and refuses to adopt an existing goal', shellOptions, t => {
  const f = fixture(t);
  success(run('private-goal', f));
  const goal = join(f.env.GOAL_PARENT, f.env.GOAL_ID);
  assert.equal(mode(goal), 0o700);
  for (const name of ['assignments', 'attempts', 'inbox', 'acknowledgments', 'evidence'])
    assert.equal(mode(join(goal, name)), 0o700);
  writeFileSync(join(goal, 'keep.txt'), 'preserved');
  failure(run('private-goal', f));
  assert.equal(readFileSync(join(goal, 'keep.txt'), 'utf8'), 'preserved');
});

test('goal creation rejects unsafe IDs and a symlinked parent or destination', shellOptions, t => {
  const f = fixture(t);
  for (const id of ['', '..', '../escape', 'with space', 'a/b', 'x;echo', 'é', 'x'.repeat(129)])
    failure(run('private-goal', f, { GOAL_ID: id }));
  assert(!existsSync(join(f.env.GOAL_PARENT, f.env.GOAL_ID)));
  const alias = join(f.root, 'alias');
  symlinkSync(f.env.GOAL_PARENT, alias);
  failure(run('private-goal', f, { GOAL_PARENT: alias }));
  symlinkSync(join(f.root, 'outside'), join(f.env.GOAL_PARENT, f.env.GOAL_ID));
  failure(run('private-goal', f));
  assert.deepEqual(readdirSync(join(f.root, 'outside')), []);
});

test('publication exposes complete private bytes, retains the draft and removes its temporary link', shellOptions, t => {
  const f = fixture(t);
  const result = run('publish-message', f);
  success(result);
  const final = join(f.env.INBOX, 'E1.md');
  assert.equal(result.stdout.trim(), final);
  assert.equal(mode(final), 0o600);
  assert.equal(lstatSync(final).nlink, 1);
  assert.deepEqual(readFileSync(final), readFileSync(f.env.MESSAGE));
  assert.deepEqual(temporaries(f.env.INBOX), []);
});

test('duplicate publication cannot replace a previously published event', shellOptions, t => {
  const f = fixture(t);
  success(run('publish-message', f));
  const final = join(f.env.INBOX, 'E1.md'), original = readFileSync(final);
  writeFileSync(f.env.MESSAGE, 'different bytes');
  failure(run('publish-message', f));
  assert.deepEqual(readFileSync(final), original);
  assert.deepEqual(temporaries(f.env.INBOX), []);
});

test('native linking still refuses a file that appeared after the destination precheck', shellOptions, t => {
  const f = fixture(t);
  const lookup = spawnSync('/bin/sh', ['-c', 'command -v ln'], { encoding: 'utf8', timeout: 5000 });
  assert.ifError(lookup.error);
  assert.equal(lookup.status, 0, lookup.stderr);
  const env = fault(f, 'ln', 'printf \'competing complete event\\n\' > "$2"\nexec "$FSD_TEST_NATIVE_LN" "$@"');
  failure(run('publish-message', f, { ...env, FSD_TEST_NATIVE_LN: lookup.stdout.trim() }));
  assert.equal(readFileSync(join(f.env.INBOX, 'E1.md'), 'utf8'), 'competing complete event\n');
  assert.equal(temporaries(f.env.INBOX).length, 1);
});

test('publication rejects unsafe event IDs before creating temporary or final files', shellOptions, t => {
  const f = fixture(t);
  for (const id of ['', '.', '..', '../escape', 'a/b', 'with space', 'x;echo', 'é', 'x'.repeat(129)])
    failure(run('publish-message', f, { EVENT_ID: id }));
  assert.deepEqual(readdirSync(f.env.INBOX), []);
});

test('publication rejects symlinked inboxes, draft files and draft parents', shellOptions, t => {
  const f = fixture(t);
  const inboxAlias = join(f.root, 'inbox-alias'), draftAlias = join(f.root, 'draft-alias');
  const parentAlias = join(f.root, 'draft-parent-alias');
  symlinkSync(f.env.INBOX, inboxAlias);
  symlinkSync(f.env.MESSAGE, draftAlias);
  symlinkSync(join(f.root, 'drafts'), parentAlias);
  failure(run('publish-message', f, { INBOX: inboxAlias }));
  failure(run('publish-message', f, { MESSAGE: draftAlias }));
  failure(run('publish-message', f, { MESSAGE: join(parentAlias, 'message.txt') }));
  assert.deepEqual(readdirSync(f.env.INBOX), []);
});

for (const target of ['directory', 'symlink', 'dangling-symlink']) {
  test(`publication rejects a final-path ${target} instead of redirecting the link`, shellOptions, t => {
    const f = fixture(t), final = join(f.env.INBOX, 'E1.md');
    if (target === 'directory') mkdirSync(final);
    else symlinkSync(join(f.root, target === 'symlink' ? 'outside' : 'missing'), final);
    failure(run('publish-message', f));
    assert.deepEqual(temporaries(f.env.INBOX), []);
    assert.deepEqual(readdirSync(join(f.root, 'outside')), []);
    if (target === 'directory') assert.deepEqual(readdirSync(final), []);
  });
}

test('an inbox-local draft must remain temporary and is preserved after publication', shellOptions, t => {
  const f = fixture(t), visible = join(f.env.INBOX, 'wrong.md');
  writeFileSync(visible, readFileSync(f.env.MESSAGE), { mode: 0o600 });
  failure(run('publish-message', f, { MESSAGE: visible }));
  assert(!existsSync(join(f.env.INBOX, 'E1.md')));
  rmSync(visible);
  const draft = join(f.env.INBOX, '.tmp-draft');
  writeFileSync(draft, readFileSync(f.env.MESSAGE), { mode: 0o600 });
  success(run('publish-message', f, { MESSAGE: draft }));
  assert.deepEqual(readFileSync(join(f.env.INBOX, 'E1.md')), readFileSync(draft));
});

test('interrupted message copying cannot expose partial final content', shellOptions, t => {
  const f = fixture(t), env = fault(f, 'cat', "printf 'partial'; exit 23");
  const result = run('publish-message', f, env);
  assert.equal(result.status, 23);
  assert(!existsSync(join(f.env.INBOX, 'E1.md')));
  const leftovers = temporaries(f.env.INBOX);
  assert.equal(leftovers.length, 1);
  assert.equal(readFileSync(join(f.env.INBOX, leftovers[0]), 'utf8'), 'partial');
});

test('a native link failure leaves complete private temporary evidence, not a sent message', shellOptions, t => {
  const f = fixture(t), env = fault(f, 'ln', 'exit 47');
  assert.equal(run('publish-message', f, env).status, 47);
  assert(!existsSync(join(f.env.INBOX, 'E1.md')));
  const leftovers = temporaries(f.env.INBOX);
  assert.equal(leftovers.length, 1);
  const temporary = join(f.env.INBOX, leftovers[0]);
  assert.equal(mode(temporary), 0o600);
  assert.deepEqual(readFileSync(temporary), readFileSync(f.env.MESSAGE));
});

test('cleanup failure after linking means publication already occurred, despite the exit status', shellOptions, t => {
  const f = fixture(t), env = fault(f, 'rm', 'exit 49');
  assert.equal(run('publish-message', f, env).status, 49);
  const final = join(f.env.INBOX, 'E1.md');
  assert.deepEqual(readFileSync(final), readFileSync(f.env.MESSAGE));
  assert.equal(lstatSync(final).nlink, 2);
  assert.equal(temporaries(f.env.INBOX).length, 1);
  // Inspection, not a successful receipt or a fresh attempt, establishes the effect.
  assert.equal(mode(final), 0o600);
});

test('coordinator state is created privately and replaced rather than truncated in place', shellOptions, t => {
  const f = fixture(t), state = join(f.env.GOAL, 'state.md');
  success(run('replace-state', f));
  assert.equal(mode(state), 0o600);
  const before = readFileSync(state), fd = openSync(state, 'r');
  try {
    writeFileSync(f.env.STATE_DRAFT, '# State\n\nVerified; integration pending.\n');
    success(run('replace-state', f));
    assert.deepEqual(readFileSync(fd), before, 'Existing reader retains the previous complete inode');
    assert.deepEqual(readFileSync(state), readFileSync(f.env.STATE_DRAFT));
    assert.equal(mode(state), 0o600);
    assert.deepEqual(temporaries(f.env.GOAL), []);
  } finally {
    closeSync(fd);
  }
});

for (const target of ['directory', 'symlink', 'dangling-symlink']) {
  test(`state replacement rejects a destination ${target}`, shellOptions, t => {
    const f = fixture(t), state = join(f.env.GOAL, 'state.md');
    const outside = join(f.root, 'outside', 'state.md');
    if (target === 'directory') mkdirSync(state);
    else {
      if (target === 'symlink') writeFileSync(outside, 'untouched');
      symlinkSync(outside, state);
    }
    failure(run('replace-state', f));
    assert.deepEqual(temporaries(f.env.GOAL), []);
    if (target === 'directory') assert.deepEqual(readdirSync(state), []);
    else if (target === 'symlink') assert.equal(readFileSync(outside, 'utf8'), 'untouched');
    else assert(!existsSync(outside));
  });
}

test('state replacement rejects symlinked goal and draft paths', shellOptions, t => {
  const f = fixture(t), goalAlias = join(f.root, 'goal-alias'), draftAlias = join(f.root, 'state-alias');
  symlinkSync(f.env.GOAL, goalAlias);
  symlinkSync(f.env.STATE_DRAFT, draftAlias);
  failure(run('replace-state', f, { GOAL: goalAlias }));
  failure(run('replace-state', f, { STATE_DRAFT: draftAlias }));
  assert.deepEqual(readdirSync(f.env.GOAL), []);
});

test('state replacement rejects a symlinked draft parent', shellOptions, t => {
  const f = fixture(t), alias = join(f.root, 'draft-parent-alias');
  symlinkSync(join(f.root, 'drafts'), alias);
  failure(run('replace-state', f, { STATE_DRAFT: join(alias, 'state.txt') }));
  assert.deepEqual(readdirSync(f.env.GOAL), []);
});

test('failed state renaming preserves both the previous state and the complete replacement draft', shellOptions, t => {
  const f = fixture(t), state = join(f.env.GOAL, 'state.md');
  writeFileSync(state, '# Previous complete state\n', { mode: 0o600 });
  const env = fault(f, 'mv', 'exit 51');
  assert.equal(run('replace-state', f, env).status, 51);
  assert.equal(readFileSync(state, 'utf8'), '# Previous complete state\n');
  const leftovers = temporaries(f.env.GOAL);
  assert.equal(leftovers.length, 1);
  assert.deepEqual(readFileSync(join(f.env.GOAL, leftovers[0])), readFileSync(f.env.STATE_DRAFT));
});

test('interrupted state copying preserves the previous control record', shellOptions, t => {
  const f = fixture(t), state = join(f.env.GOAL, 'state.md');
  writeFileSync(state, '# Previous complete state\n', { mode: 0o600 });
  const env = fault(f, 'cat', "printf 'partial'; exit 23");
  assert.equal(run('replace-state', f, env).status, 23);
  assert.equal(readFileSync(state, 'utf8'), '# Previous complete state\n');
  assert.equal(temporaries(f.env.GOAL).length, 1);
});
