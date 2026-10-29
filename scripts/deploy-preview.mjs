// Deploys spec previews to the shared Cloudflare Pages project: https://<project>.pages.dev/<slug>/
// Usage: node scripts/deploy-preview.mjs <slug...> | --all
//
// A Pages deployment replaces the whole site, so every deploy uploads the full tree of current previews:
// the named slugs are rebuilt, every other spec site in sites/ reuses dist/<slug> (built if missing), and
// --all rebuilds them all (after a template change). Expired previews are left out. Fixtures are included
// only when named, so a fixture drops out at the next deploy that doesn't name it.
// Wrangler uploads only files whose hash it hasn't seen, so the unchanged previews cost nothing.
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PREVIEWS_ORIGIN, PREVIEWS_PROJECT } from '../template/config.ts';
import { acquireLock } from './lib/lock.mjs';
import { fail, loadSite, ROOT, specSlugs, tryLoadSite } from './lib/sites.mjs';

const args = process.argv.slice(2);
const all = args.includes('--all');
const named = args.filter((a) => !a.startsWith('--'));
if (!all && !named.length) fail('Usage: node scripts/deploy-preview.mjs <slug...> | --all');

acquireLock('deploy');
const today = new Date().toISOString().slice(0, 10);
const stage = path.join(ROOT, 'dist', '_previews');

for (const slug of named) {
  const { site } = loadSite(slug);
  if (site.status !== 'spec') fail(`"${slug}" is live: live sites get their own Pages project (/promote-site), not a preview.`);
  if (site.previewExpires < today) fail(`"${slug}" expired on ${site.previewExpires}. Renew it before deploying.`);
}

const slugs = [...new Set([...named, ...specSlugs()])].filter((slug) => {
  // Another agent may be mid-research on a site: an invalid site.json keeps it out of this deploy only.
  const result = tryLoadSite(slug);
  if (!result.ok) {
    console.log(`- ${slug}: invalid site.json, left out`);
    return false;
  }
  const { site } = result;
  if (site.previewExpires >= today) return true;
  console.log(`- ${slug}: expired ${site.previewExpires}, left out`);
  return false;
});

rmSync(stage, { recursive: true, force: true });
for (const slug of slugs) {
  const { outDir } = loadSite(slug);
  if (all || named.includes(slug) || !existsSync(path.join(outDir, 'index.html'))) {
    console.log(`Building ${slug}…`);
    const build = spawnSync('node', ['scripts/site.mjs', 'build', slug], { cwd: ROOT, encoding: 'utf8' });
    if (build.status !== 0) fail(`Build failed for "${slug}":\n${(build.stderr || build.stdout).trim().split('\n').slice(-15).join('\n')}`);
  }
  cpSync(outDir, path.join(stage, slug), { recursive: true });
}
writeRootFiles(stage);

ensureProject();
const deploy = wrangler(['pages', 'deploy', stage, `--project-name=${PREVIEWS_PROJECT}`, '--branch=main', '--commit-dirty=true']);
if (deploy.status !== 0) fail(`Deploy failed:\n${output(deploy)}`);

// "Take a peek over at https://<hash>.<project-subdomain>.pages.dev": the production alias drops the hash.
const deployUrl = output(deploy).match(/https:\/\/[a-z0-9-]+\.([a-z0-9-]+\.pages\.dev)/);
const origin = deployUrl ? `https://${deployUrl[1]}` : PREVIEWS_ORIGIN;
if (origin !== PREVIEWS_ORIGIN) console.warn(`! Cloudflare serves ${origin}: set PREVIEWS_ORIGIN in template/config.ts to it.`);
console.log(`\nDeployed ${slugs.length} preview(s):`);
for (const slug of named.length ? named : slugs) console.log(`  ${origin}/${slug}/`);

/** The previews root: crawler block for the whole domain, and no page that lists the prospects. */
function writeRootFiles(dir) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
  writeFileSync(
    path.join(dir, '_headers'),
    [
      '/*',
      '  X-Robots-Tag: noindex, nofollow',
      '  X-Content-Type-Options: nosniff',
      '  Referrer-Policy: strict-origin-when-cross-origin',
      '/:slug/_astro/*',
      '  Cache-Control: public, max-age=31536000, immutable',
      '',
    ].join('\n'),
  );
  const page = (title, text) =>
    `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<meta name="robots" content="noindex, nofollow"><title>${title}</title></head>` +
    `<body style="font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem;color:#222">` +
    `<h1 style="font-size:1.5rem">${title}</h1><p>${text}</p></body></html>\n`;
  writeFileSync(path.join(dir, 'index.html'), page('Anteprime', 'Qui vengono pubblicate anteprime di siti web. Per vederne una serve il link completo.'));
  writeFileSync(path.join(dir, '404.html'), page('Pagina non trovata', "L'anteprima che cerchi non esiste o è scaduta."));
}

// --force keeps a plain static Pages project: without it, wrangler 4.15x delegates to Workers and tries to
// rewrite the repo (`astro add cloudflare`, new package.json scripts).
function ensureProject() {
  const create = wrangler(['pages', 'project', 'create', PREVIEWS_PROJECT, '--production-branch=main', '--force']);
  if (create.status !== 0 && !/already exists/i.test(output(create))) fail(`Could not create the Pages project:\n${output(create)}`);
}

function wrangler(wranglerArgs) {
  // One command string: the arguments are ours and contain no spaces (pnpm needs a shell on Windows).
  const result = spawnSync(['pnpm', 'exec', 'wrangler', ...wranglerArgs].join(' '), { cwd: ROOT, encoding: 'utf8', shell: true });
  if (/not authenticated|wrangler login|CLOUDFLARE_API_TOKEN/i.test(output(result)) && result.status !== 0) {
    fail('Wrangler is not logged in. Run `pnpm exec wrangler login` once (opens the browser; Google sign-in works).');
  }
  return result;
}

function output(result) {
  return `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
}
