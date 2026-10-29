// Cross-process lock, so parallel agents (batch mode) don't run two Astro builds or two deploys at once:
// builds share .astro/ and the Vite cache, and deploys share dist/_previews/.
import { mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './sites.mjs';

const STALE_MS = 15 * 60_000;

/** Blocks until the named lock is free, takes it, and returns a release function (also run on exit). */
export function acquireLock(name) {
  const dir = path.join(ROOT, 'dist');
  const file = path.join(dir, `.${name}.lock`);
  mkdirSync(dir, { recursive: true });
  let waited = false;
  for (;;) {
    try {
      writeFileSync(file, String(process.pid), { flag: 'wx' });
      break;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      // A crashed holder leaves its file behind; nothing we lock runs this long.
      try {
        if (Date.now() - statSync(file).mtimeMs > STALE_MS) rmSync(file, { force: true });
      } catch {}
      if (!waited) console.log(`Waiting for the ${name} lock (another build or deploy is running)…`);
      waited = true;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500);
    }
  }
  const release = () => rmSync(file, { force: true });
  process.on('exit', release);
  return release;
}
