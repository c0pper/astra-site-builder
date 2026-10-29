// Shared by the scripts: find a site folder, validate its site.json, and work out where it is served.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSite } from '../../template/schema/site.ts';
import { missingAssets } from '../../template/lib/readiness.ts';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** Real sites live in sites/<slug>; test fixtures in sites/_fixtures/<slug>. Exits with a message on any problem. */
export function loadSite(slug) {
  const result = tryLoadSite(slug);
  if (!result.ok) fail(result.error);
  return result;
}

/** Like loadSite, but returns { ok: false, error } instead of exiting. */
export function tryLoadSite(slug) {
  const candidates = [path.join(ROOT, 'sites', slug), path.join(ROOT, 'sites', '_fixtures', slug)];
  const siteDir = candidates.find((dir) => existsSync(path.join(dir, 'site.json')));
  if (!siteDir) return { ok: false, error: `No site.json for "${slug}". Looked in:\n${candidates.map((c) => `  ${c}`).join('\n')}` };

  const result = parseSite(JSON.parse(readFileSync(path.join(siteDir, 'site.json'), 'utf8')));
  if (!result.ok) return { ok: false, error: `Invalid site.json for "${slug}":\n${result.error}` };

  // Real sites may only use sub-types with a curated image pack and tone guide. Fixtures are exempt.
  const isFixture = path.basename(path.dirname(siteDir)) === '_fixtures';
  if (!isFixture) {
    const { subtype, secondarySubtypes } = result.site;
    const problems = [subtype, ...secondarySubtypes].flatMap((id) => missingAssets(id).map((m) => `  ${id}: missing ${m}`));
    if (problems.length) return { ok: false, error: `Sub-types used by "${slug}" are not ready:\n${problems.join('\n')}` };
  }

  const base = result.site.status === 'spec' ? `/${slug}` : '/';
  return { ok: true, slug, siteDir, site: result.site, isFixture, base, outDir: path.join(ROOT, 'dist', slug) };
}

/** Slugs of every live site (fixtures included, so the gates have something to check before real sites exist). */
export function liveSlugs() {
  return slugsWithStatus('live', ['sites', 'sites/_fixtures']);
}

/** Slugs of every real spec site: the previews that share the Cloudflare previews project. */
export function specSlugs() {
  return slugsWithStatus('spec', ['sites']);
}

function slugsWithStatus(status, dirs) {
  return dirs.map((d) => path.join(ROOT, d)).flatMap((dir) =>
    readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith('_') && existsSync(path.join(dir, d.name, 'site.json')))
      .filter((d) => JSON.parse(readFileSync(path.join(dir, d.name, 'site.json'), 'utf8')).status === status)
      .map((d) => d.name),
  );
}

export function fail(message) {
  console.error(message);
  process.exit(1);
}
