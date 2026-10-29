// Creates sites/<slug>/ for a new spec site: a site.json skeleton (fails validation until filled in) and notes.md.
// Usage: node scripts/scaffold-site.mjs <slug> <subtype> [secondary-subtype...]
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { SUBTYPES } from '../template/registry.ts';
import { fail, ROOT } from './lib/sites.mjs';

const PREVIEW_DAYS = 90;
const [slug, subtype, ...secondary] = process.argv.slice(2);
if (!slug || !subtype) fail('Usage: node scripts/scaffold-site.mjs <slug> <subtype> [secondary-subtype...]');
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 40) {
  fail(`Slug "${slug}": lowercase letters, digits and single hyphens, at most 40 characters (e.g. salemme-pneumatici-caserta)`);
}
for (const id of [subtype, ...secondary]) {
  if (!SUBTYPES[id]) fail(`Unknown sub-type "${id}". Known: ${Object.keys(SUBTYPES).join(', ')}`);
}

const dir = path.join(ROOT, 'sites', slug);
if (existsSync(dir)) fail(`sites/${slug} already exists.`);

const expires = new Date(Date.now() + PREVIEW_DAYS * 86_400_000).toISOString().slice(0, 10);
const site = {
  status: 'spec',
  previewExpires: expires,
  category: SUBTYPES[subtype].category,
  subtype,
  secondarySubtypes: secondary,
  business: { name: '', address: { street: '', postalCode: '', city: '', province: '' } },
  copy: {},
  sources: {},
};
mkdirSync(dir, { recursive: true });
writeFileSync(path.join(dir, 'site.json'), `${JSON.stringify(site, null, 2)}\n`);
writeFileSync(
  path.join(dir, 'notes.md'),
  `## Identity\n\n## Searched, not found\n\n## Existing web presence\n`,
);
console.log(`Created sites/${slug}/ (site.json, notes.md). Preview expires ${expires}.`);
