import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { locatePi } from './pi-host.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const files = [];
function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', '.agents'].includes(e.name)) continue;
    const p = join(dir, e.name); if (e.isDirectory()) walk(p); else files.push(p);
  }
}
walk(root);
let links = 0;
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  if (extname(file) === '.json') JSON.parse(text);
  if (['.ts', '.mjs'].includes(extname(file))) execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
  if (extname(file) !== '.md') continue;
  for (const [, target] of text.matchAll(/\[[^\]]*\]\(([^\s)]+)\)/g)) {
    if (/^[a-z]+:/.test(target)) continue;
    const [name, anchor] = target.split('#'); const path = name ? resolve(dirname(file), name) : file;
    assert.ok(existsSync(path), `Broken link in ${file}: ${target}`);
    if (anchor) {
      const headings = [...readFileSync(path, 'utf8').matchAll(/^#{1,6}\s+(.+)$/gm)]
        .map(([, h]) => h.toLowerCase().replace(/[^\p{L}\p{N}_\- ]/gu, '').replaceAll(' ', '-'));
      assert.ok(headings.includes(anchor), `Missing anchor in ${file}: ${target}`);
    }
    links++;
  }
}
const prefs = JSON.parse(readFileSync(join(root, 'config/herdr-defaults.json'), 'utf8'));
assert.equal(prefs.version, 2);
assert.equal(prefs.autoLaunch, false); assert.equal(prefs.nativeSubagents, false);
assert.equal(prefs.goalDefaults.mode, 'bounded-outcome');
const { loadSkillsFromDir } = await import(pathToFileURL(join(locatePi(), 'dist/core/skills.js')).href);
const loaded = loadSkillsFromDir({ dir: root, source: 'fsd-check' });
assert.equal(loaded.skills.length, 1); assert.equal(loaded.skills[0].name, 'fsd'); assert.deepEqual(loaded.diagnostics, []);
console.log(`PASS: JS/TS syntax, JSON, ${links} local Markdown links/anchors, and installed Pi skill discovery. No workers launched.`);
