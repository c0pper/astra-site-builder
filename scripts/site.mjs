// Runs a command for one site: node scripts/site.mjs <validate|dev|build|preview|check> <slug>
// Validates site.json, then passes the site folder to astro.config.mjs through SITE_SLUG / SITE_DIR / SITE_BASE.
import { spawnSync } from 'node:child_process';
import { acquireLock } from './lib/lock.mjs';
import { fail, loadSite, ROOT } from './lib/sites.mjs';

const ASTRO_COMMANDS = ['dev', 'build', 'preview', 'check'];
const COMMANDS = ['validate', ...ASTRO_COMMANDS];

const [command, slug] = process.argv.slice(2);
if (!COMMANDS.includes(command) || !slug) fail(`Usage: node scripts/site.mjs <${COMMANDS.join('|')}> <slug>`);

const { siteDir, base } = loadSite(slug);

if (command === 'validate') {
  console.log(`site.json for "${slug}" is valid.`);
  process.exit(0);
}

// dev and preview are long-running servers and don't write the shared caches the way a build does.
if (command === 'build' || command === 'check') acquireLock('build');

const astro = spawnSync('pnpm', ['exec', 'astro', command], {
  cwd: ROOT,
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, SITE_SLUG: slug, SITE_DIR: siteDir, SITE_BASE: base },
});

process.exit(astro.status ?? 1);
