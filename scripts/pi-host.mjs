import { accessSync, constants, existsSync, readFileSync, realpathSync } from 'node:fs';
import { delimiter, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

export function locatePi() {
  const candidates = [];
  if (process.env.PI_PACKAGE_DIR) candidates.push(resolve(process.env.PI_PACKAGE_DIR));
  try { candidates.push(dirname(fileURLToPath(import.meta.resolve('@earendil-works/pi-coding-agent')))); } catch { /* try installed CLI */ }
  for (const dir of (process.env.PATH ?? '').split(delimiter)) {
    const bin = join(dir, 'pi');
    try { accessSync(bin, constants.X_OK); candidates.push(dirname(realpathSync(bin))); } catch { /* next path */ }
  }
  for (let dir of candidates) {
    while (true) {
      const path = join(dir, 'package.json');
      if (existsSync(path) && JSON.parse(readFileSync(path, 'utf8')).name === '@earendil-works/pi-coding-agent') return dir;
      const parent = dirname(dir); if (parent === dir) break; dir = parent;
    }
  }
  throw new Error('Pi is required for entrypoint/reload tests: install it or set PI_PACKAGE_DIR. Core tests need only Node.');
}
export async function loader() {
  const host = locatePi();
  const require = createRequire(join(host, 'package.json'));
  const { createJiti } = require('jiti');
  const ai = join(host, 'node_modules/@earendil-works/pi-ai');
  const manifest = JSON.parse(readFileSync(join(ai, 'package.json'), 'utf8'));
  const aiExport = manifest.exports?.['./compat']?.import ?? manifest.exports?.['.']?.import;
  return createJiti(import.meta.url, { moduleCache: false, alias: {
    typebox: require.resolve('typebox'), '@earendil-works/pi-ai': join(ai, aiExport),
  } });
}
