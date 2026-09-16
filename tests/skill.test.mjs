import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { templateFields, validate } from '../scripts/check.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
function fixture(t) {
  const destination = mkdtempSync(join(tmpdir(), 'fsd-skill-check-'));
  t.after(() => rmSync(destination, { recursive: true, force: true }));
  for (const path of ['SKILL.md', 'README.md', 'LICENSE', 'package.json', '.claude-plugin', 'references', 'templates', 'agents'])
    cpSync(join(root, path), join(destination, path), { recursive: true });
  return destination;
}
function changeJson(dir, path, update) {
  const file = join(dir, path);
  const value = JSON.parse(readFileSync(file, 'utf8'));
  update(value);
  writeFileSync(file, JSON.stringify(value));
}

test('package, links, frontmatter, templates and development scripts validate', () => {
  const result = validate(root);
  assert.equal(result.version, '1.1.0');
  assert(result.links > 20);
});

test('copied distribution validates without Pi, Claude, Herdr or private preferences', t => {
  assert.equal(validate(fixture(t)).version, '1.1.0');
});

test('release versions must agree', t => {
  const dir = fixture(t);
  changeJson(dir, '.claude-plugin/plugin.json', value => { value.version = '9.0.0'; });
  assert.throws(() => validate(dir), /Release versions disagree/);
});

test('Pi package cannot register executable components', t => {
  const dir = fixture(t);
  changeJson(dir, 'package.json', value => { value.pi.extensions = ['extra.ts']; });
  assert.throws(() => validate(dir), /only the skill/);
});

test('Claude plugin cannot register hooks or other executable components', t => {
  const dir = fixture(t);
  changeJson(dir, '.claude-plugin/plugin.json', value => { value.hooks = './hooks.json'; });
  assert.throws(() => validate(dir), assert.AssertionError);
});

test('installation cannot require executable dependencies', t => {
  const dir = fixture(t);
  changeJson(dir, 'package.json', value => { value.dependencies = { example: '1.0.0' }; });
  assert.throws(() => validate(dir), /executable dependencies/);
});

test('missing references and anchors are detected', t => {
  const dir = fixture(t);
  const file = join(dir, 'README.md');
  const original = readFileSync(file, 'utf8');
  writeFileSync(file, `${original}\n[missing](references/missing.md)\n`);
  assert.throws(() => validate(dir), /Broken link/);
  writeFileSync(file, `${original}\n[missing](SKILL.md#missing)\n`);
  assert.throws(() => validate(dir), /Missing anchor/);
});

test('message identity fields cannot disappear from the template', t => {
  const dir = fixture(t);
  const path = join(dir, 'templates/message.md');
  writeFileSync(path, readFileSync(path, 'utf8').replace(/^attempt_id: .*\n/m, ''));
  assert.throws(() => validate(dir), /Missing message.attempt_id/);
  assert(templateFields.message.includes('revision'));
  assert(templateFields.message.includes('worker_session'));
});

test('worker entry point is explicit, short and separate from coordinator setup', () => {
  const skill = readFileSync(join(root, 'SKILL.md'), 'utf8');
  const guide = readFileSync(join(root, 'references/worker.md'), 'utf8');
  const worker = skill.indexOf('(references/worker.md)');
  const coordinator = skill.indexOf('## One usage path');
  assert(worker >= 0 && coordinator > worker, 'Route assigned workers before coordinator setup');
  assert(guide.trim().split(/\s+/).length <= 500, 'Keep the worker guide under 500 words');
});

test('assignments retain the installed worker-guide path field', t => {
  const dir = fixture(t);
  const path = join(dir, 'templates/assignment.md');
  writeFileSync(path, readFileSync(path, 'utf8').replace(/^worker_guide: .*\n/m, ''));
  assert.throws(() => validate(dir), /Missing assignment.worker_guide/);
});

test('pure distribution rejects executable assets', t => {
  const dir = fixture(t);
  writeFileSync(join(dir, 'templates/helper.mjs'), 'export const helper = true;');
  assert.throws(() => validate(dir), /Executable outside development checks/);
});

test('unlisted root configuration cannot silently add host behavior', t => {
  const dir = fixture(t);
  writeFileSync(join(dir, 'settings.json'), '{}');
  assert.throws(() => validate(dir), /Unexpected package artifact/);
});

test('published documents do not include an owner profile or machine paths', () => {
  for (const name of ['SKILL.md', 'README.md', 'references/setup.md', 'references/filesystem.md', 'references/herdr.md', 'references/delivery.md', 'references/worker.md', 'references/recipes.md', 'agents/reviewer.md', 'agents/builder.md', 'agents/scout.md', 'agents/judge.md', 'agents/workhorse.md', 'references/example.md']) {
    const text = readFileSync(join(root, name), 'utf8');
    assert.doesNotMatch(text, /\/Users\/|approvedOn|confirmedOn|gpt-\d|startupPromptApprovals/);
  }
});

test('role files fix scope, launch arguments and report shape without deployment policy', () => {
  for (const name of ['reviewer', 'builder', 'scout', 'judge', 'workhorse']) {
    const text = readFileSync(join(root, `agents/${name}.md`), 'utf8');
    const flat = text.replace(/\s+/g, ' ');
    assert.match(text, new RegExp(`^name: ${name}$`, 'm'));
    for (const field of ['description', 'implementation_write', 'report_write', 'model', 'default_limits', 'launch_args'])
      assert.match(text, new RegExp(`^${field}:`, 'm'), `Missing ${name}.${field}`);
    assert.match(text, /^model: owner-preferences roles\./m, 'Role files point at owner preferences for model routing');
    assert.match(text, /"ROLE_FILE"/, 'Launch arguments inject the role file, not inline prompt text');
    assert.match(flat, /kind: "question"/, 'Role files define the escalation message');
    assert.match(flat, /A report requests inspection; it is not acceptance/);
    assert(text.trim().split(/\s+/).length <= 550, `Keep the ${name} role under 550 words`);
  }
  for (const name of ['reviewer', 'scout', 'judge'])
    assert.match(readFileSync(join(root, `agents/${name}.md`), 'utf8'), /^hardened_report_channel: native$/m, `Read-only role ${name} reports natively when hardened`);
  for (const name of ['builder', 'workhorse'])
    assert.match(readFileSync(join(root, `agents/${name}.md`), 'utf8'), /^implementation_write: assigned-worktree-only$/m);
});

test('worked example traces a real goal including its corrections', () => {
  const example = readFileSync(join(root, 'references/example.md'), 'utf8').replace(/\s+/g, ' ');
  for (const phrase of ['agent_not_ready', 'shift+tab', 'herdr agent wait', 'Merge verdict: BLOCK', 'revision: 1', 'Closed — delivered'])
    assert(example.includes(phrase), `Example should mention ${phrase}`);
  assert.match(readFileSync(join(root, 'SKILL.md'), 'utf8'), /\(references\/example\.md\)/);
});
