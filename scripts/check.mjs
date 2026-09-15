// Development-only package/document validation. Not loaded by either harness.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

export const templateFields = {
  goal: ['goal_id', 'revision', 'fsd_version', 'status', 'started_at', 'deadline', 'goal_path',
    'coordinator_host', 'coordinator_session', 'supervision', 'max_workers', 'max_attempts'],
  assignment: ['goal_id', 'revision', 'assignment_id', 'attempt_id', 'goal_path', 'worker_guide', 'worker_host',
    'worker_pane', 'worker_tab', 'worker_terminal', 'worker_session', 'worker_kind', 'cwd',
    'branch_and_base', 'role', 'implementation_write_paths', 'output_write_paths', 'report_channel', 'deadline'],
  attempt: ['goal_id', 'revision', 'assignment_id', 'attempt_id', 'worker_session', 'status', 'created_at', 'deadline'],
  message: ['event_id', 'goal_id', 'revision', 'assignment_id', 'attempt_id', 'worker_session', 'kind', 'created_at'],
  acknowledgment: ['event_id', 'goal_id', 'revision', 'attempt_id', 'received_at', 'classification'],
};

export function validate(root) {
  const read = path => readFileSync(join(root, path), 'utf8');
  const pkg = JSON.parse(read('package.json'));
  const plugin = JSON.parse(read('.claude-plugin/plugin.json'));
  const market = JSON.parse(read('.claude-plugin/marketplace.json'));
  const skill = read('SKILL.md');
  assert.match(pkg.version, /^\d+\.\d+\.\d+$/);
  assert.equal(plugin.version, pkg.version, 'Release versions disagree');
  assert.equal(skill.match(/^  version: "([^"]+)"$/m)?.[1], pkg.version, 'Skill version disagrees');
  assert.match(read('README.md'), new RegExp(`FSD ${pkg.version.replaceAll('.', '\\.')}\\b`));
  assert.match(read('templates/goal.md'), new RegExp(`fsd_version: "${pkg.version.replaceAll('.', '\\.')}"`));
  assert.match(skill, /^---\nname: fsd\n/);
  for (const [field, limit] of [['description', 1024], ['compatibility', 500]]) {
    const value = skill.match(new RegExp(`^${field}: "(.+)"$`, 'm'))?.[1];
    assert(value?.length > 0 && value.length <= limit, `Invalid skill ${field}`);
  }
  assert.deepEqual(pkg.pi, { skills: ['SKILL.md'] }, 'Pi package must contain only the skill');
  for (const key of ['dependencies', 'peerDependencies', 'optionalDependencies'])
    assert.equal(pkg[key], undefined, 'Skill package must not require executable dependencies');
  assert.deepEqual(pkg.scripts, { test: 'node --test tests/*.test.mjs', check: 'node scripts/check.mjs' });
  assert.deepEqual(pkg.files, ['SKILL.md', 'README.md', 'LICENSE', 'references/', 'templates/', '.claude-plugin/']);
  assert.deepEqual(Object.keys(plugin).sort(), ['author', 'description', 'license', 'name', 'repository', 'version']);
  assert.equal(plugin.name, 'fsd');
  assert.equal(market.name, 'fsd');
  assert.deepEqual(Object.keys(market).sort(), ['description', 'name', 'owner', 'plugins']);
  assert.equal(market.plugins.length, 1);
  assert.deepEqual(Object.keys(market.plugins[0]).sort(), ['description', 'name', 'source']);
  assert.equal(market.plugins[0].name, plugin.name);
  assert.equal(market.plugins[0].source, './');

  const files = [];
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (['.git', 'node_modules', '.agents'].includes(entry.name)) continue;
      const path = join(dir, entry.name);
      assert(!entry.isSymbolicLink(), `Unexpected symlink: ${path}`);
      if (entry.isDirectory()) walk(path); else files.push(path);
    }
  }
  walk(root);
  let links = 0;
  for (const path of files) {
    const name = relative(root, path);
    const text = readFileSync(path, 'utf8');
    const ext = extname(path);
    assert(name === 'LICENSE' || name === '.gitignore' || ['.md', '.json', '.mjs'].includes(ext), `Unexpected file: ${name}`);
    if (ext === '.mjs') assert(/^(scripts|tests)\//.test(name), `Executable outside development checks: ${name}`);
    const documents = ['LICENSE', '.gitignore', 'README.md', 'SKILL.md'].includes(name) || /^(references|templates)\/.+\.md$/.test(name);
    const manifests = ['package.json', '.claude-plugin/plugin.json', '.claude-plugin/marketplace.json'].includes(name);
    const development = /^(scripts|tests)\/.+\.mjs$/.test(name);
    assert(documents || manifests || development, `Unexpected package artifact: ${name}`);
    if (ext === '.json') JSON.parse(text);
    if (ext === '.mjs') execFileSync(process.execPath, ['--check', path], { stdio: 'pipe' });
    if (ext !== '.md') continue;
    assert.equal([...text.matchAll(/^```/gm)].length % 2, 0, `Unbalanced code fence: ${name}`);
    for (const [, target] of text.matchAll(/\[[^\]]*\]\(([^\s)]+)\)/g)) {
      if (/^[a-z]+:/.test(target)) continue;
      const [file, anchor] = target.split('#');
      const destination = file ? resolve(dirname(path), file) : path;
      assert(!relative(root, destination).startsWith('..'), `Link escapes package: ${target}`);
      assert(existsSync(destination), `Broken link in ${name}: ${target}`);
      if (anchor) {
        const headings = [...readFileSync(destination, 'utf8').matchAll(/^#{1,6}\s+(.+)$/gm)]
          .map(([, heading]) => heading.toLowerCase().replace(/[^\p{L}\p{N}_\- ]/gu, '').replaceAll(' ', '-'));
        assert(headings.includes(anchor), `Missing anchor in ${name}: ${target}`);
      }
      links++;
    }
  }
  for (const [template, fields] of Object.entries(templateFields)) {
    const text = read(`templates/${template}.md`);
    for (const field of fields) assert.match(text, new RegExp(`^${field}: .+$`, 'm'), `Missing ${template}.${field}`);
  }
  assert(existsSync(join(root, 'templates/state.md')));
  return { version: pkg.version, files: files.length, links };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = validate(fileURLToPath(new URL('..', import.meta.url)));
  console.log(`PASS: skill-only packaging ${result.version}, ${result.files} files, ${result.links} local links/anchors, templates and JS syntax. No agents launched.`);
}
