// Fills business.geo (and its source) in sites/<slug>/site.json from the address, via OpenStreetMap Nominatim.
// A house-number match is a pin at the address (medium confidence); a street-only match is an approximate pin
// (low confidence, the map says "Posizione indicativa"); no street match leaves geo out.
// Usage: node scripts/geocode.mjs <slug...> [--force]   (--force replaces an existing geo)
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fail, loadSite } from './lib/sites.mjs';

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
// Nominatim's usage policy: an identifying User-Agent and at most one request per second.
const USER_AGENT = 'astro-site-builder/0.1 (spec-site geocoding)';
const PAUSE_MS = 1100;

const args = process.argv.slice(2);
const force = args.includes('--force');
const slugs = args.filter((a) => !a.startsWith('--'));
if (!slugs.length) fail('Usage: node scripts/geocode.mjs <slug...> [--force]');

for (const slug of slugs) {
  const { siteDir, site } = loadSite(slug);
  if (site.business.geo && !force) {
    console.log(`${slug}: has geo, skipped (--force to replace)`);
    continue;
  }
  const { street, postalCode, city } = site.business.address;
  // "Via Cimitile, 88" / "Via Belvedere, 41/a" → street name + house number.
  const [, name, number] = street.match(/^(.*?)[,\s]+(\d+[\w/-]*)\s*$/) ?? [, street, ''];

  let match = number ? await search({ street: `${number} ${name}`, city, postalcode: postalCode }) : null;
  let approximate = false;
  if (!match?.result.address?.house_number) {
    match = (await search({ street: name, city, postalcode: postalCode })) ?? (await search({ street: name, city }));
    approximate = true;
  }
  if (!match) {
    console.log(`${slug}: no street match for "${name}, ${city}", geo left out`);
    continue;
  }

  // Edit the raw file so defaults the schema adds on parse don't leak into it.
  const file = path.join(siteDir, 'site.json');
  const raw = JSON.parse(readFileSync(file, 'utf8'));
  raw.business.geo = { lat: Number(match.result.lat), lng: Number(match.result.lon), ...(approximate && { approximate: true }) };
  raw.sources ??= {};
  raw.sources['business.geo'] = {
    urls: [match.url],
    retrieved: new Date().toISOString().slice(0, 10),
    confidence: approximate ? 'low' : 'medium',
    note: approximate
      ? `Street-level match (${match.result.display_name}): OpenStreetMap has no house number ${number || ''} here.`.replace(' .', '.')
      : `House-number match: ${match.result.display_name}`,
  };
  writeFileSync(file, `${JSON.stringify(raw, null, 2)}\n`);
  console.log(`${slug}: ${approximate ? 'approximate (street)' : 'address'} → ${raw.business.geo.lat}, ${raw.business.geo.lng}`);
}

async function search(params) {
  const url = `${NOMINATIM}?${new URLSearchParams({ format: 'jsonv2', addressdetails: '1', limit: '1', countrycodes: 'it', ...params })}`;
  await new Promise((r) => setTimeout(r, PAUSE_MS));
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) fail(`Nominatim ${response.status} for ${url}`);
  const [result] = await response.json();
  return result ? { result, url } : null;
}
