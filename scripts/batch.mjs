// Batch mode for /batch-sites. Outputs live under leads/batches/ (gitignored, like the lead lists).
//
//   node scripts/batch.mjs plan <csv> [--sector "Tyre shop,Auto repair"] [--limit N]
//     Reads a lead list, writes <batch>/rows.json, and prints the batch folder. A row is queued unless its
//     sector has no ready sub-type or a site with the same phone already exists.
//   node scripts/batch.mjs report <batch-dir>
//     Reads the agents' results/<id>.json and writes batch-report.csv and needs-disambiguation.md.
//
// Result file, written by the agent working a row (results/<id>.json):
//   { "status": "built", "slug": "…", "webPresence": "none|social-only|outdated|decent" }
//   { "status": "needs-disambiguation", "candidates": [{ "name", "address", "phone", "url" }] }
//   { "status": "failed", "reason": "…" }
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PREVIEWS_ORIGIN } from '../template/config.ts';
import { missingAssets } from '../template/lib/readiness.ts';
import { analyseSite } from './lib/analyse.mjs';
import { parseCsv, phoneKey, toBatchRow } from './lib/leads.mjs';
import { fail, ROOT, tryLoadSite } from './lib/sites.mjs';

const RESULT_STATUSES = ['built', 'needs-disambiguation', 'failed'];
const PRESENCE = ['none', 'social-only', 'outdated', 'decent'];

const [command, target, ...rest] = process.argv.slice(2);
if (command === 'plan' && target) plan(target, options(rest));
else if (command === 'report' && target) report(path.resolve(target));
else fail('Usage: node scripts/batch.mjs plan <csv> [--sector "A,B"] [--limit N] | report <batch-dir>');

function options(args) {
  const value = (flag) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };
  return {
    sectors: value('--sector')?.split(',').map((s) => s.trim()),
    limit: value('--limit') ? Number(value('--limit')) : Infinity,
  };
}

function plan(csvPath, { sectors, limit }) {
  const leads = parseCsv(readFileSync(csvPath, 'utf8'));
  const existing = existingSitesByPhone();
  let queued = 0;
  const rows = leads.map(toBatchRow).map((row) => {
    if (sectors && !sectors.includes(row.sector)) return { ...row, status: 'excluded', reason: 'sector not selected' };
    if (!row.subtype) return { ...row, status: 'skipped', reason: `no sub-type for sector "${row.sector}"` };
    const notReady = missingAssets(row.subtype);
    if (notReady.length) return { ...row, status: 'skipped', reason: `sub-type ${row.subtype} not ready (${notReady.join(', ')})` };
    const slug = existing.get(phoneKey(row.anchor.phone));
    if (row.anchor.phone && slug) return { ...row, status: 'skipped', reason: `site exists: ${slug}` };
    if (queued >= limit) return { ...row, status: 'excluded', reason: 'over --limit' };
    queued++;
    return { ...row, status: 'queued' };
  });

  const dir = batchDir(csvPath);
  mkdirSync(path.join(dir, 'results'), { recursive: true });
  writeFileSync(path.join(dir, 'rows.json'), `${JSON.stringify({ csv: path.relative(ROOT, csvPath), rows }, null, 2)}\n`);

  const skipped = rows.filter((r) => r.status === 'skipped');
  console.log(`Batch folder: ${path.relative(ROOT, dir)}`);
  console.log(`${queued} queued, ${skipped.length} skipped, ${rows.length - queued - skipped.length} excluded.`);
  for (const r of rows.filter((r) => r.status === 'queued')) console.log(`  queued ${r.id} ${r.name} (${r.comune}, ${r.subtype})`);
  for (const r of skipped) console.log(`  skipped ${r.id} ${r.name}: ${r.reason}`);
}

function report(dir) {
  const rowsFile = path.join(dir, 'rows.json');
  if (!existsSync(rowsFile)) fail(`No rows.json in ${dir}. Run \`pnpm batch plan <csv>\` first.`);
  const { rows } = JSON.parse(readFileSync(rowsFile, 'utf8'));

  const lines = [['id', 'business', 'comune', 'subtype', 'status', 'slug', 'preview_url', 'web_presence', 'confidence', 'check_first', 'flags', 'reason']];
  const ambiguous = [];
  for (const row of rows.filter((r) => r.status !== 'excluded')) {
    const base = [row.id, row.name, row.comune, row.subtype ?? ''];
    if (row.status === 'skipped') {
      lines.push([...base, 'skipped', '', '', '', '', '', '', row.reason]);
      continue;
    }
    const result = readResult(dir, row.id);
    if (!result) {
      lines.push([...base, 'pending', '', '', '', '', '', '', 'no result file']);
    } else if (result.status === 'needs-disambiguation') {
      ambiguous.push({ row, candidates: result.candidates ?? [] });
      lines.push([...base, result.status, '', '', '', '', '', '', `${result.candidates?.length ?? 0} candidates`]);
    } else if (result.status === 'failed') {
      lines.push([...base, 'failed', result.slug ?? '', '', '', '', '', '', result.reason ?? '']);
    } else {
      const loaded = tryLoadSite(result.slug);
      if (!loaded.ok) {
        lines.push([...base, 'failed', result.slug, '', '', '', '', '', loaded.error.split('\n')[0]]);
        continue;
      }
      const a = analyseSite(loaded.site);
      // The lead tool's Town is often the search area ("Caserta (search area)"); the site holds the real comune.
      const city = loaded.site.business.address.city;
      base[2] = city;
      base[3] = [loaded.site.subtype, ...loaded.site.secondarySubtypes].join('+');
      const flags = [
        city.toLowerCase() !== row.comune.toLowerCase() && `comune: lead said ${row.comune}`,
        a.generic.length && 'generic services',
        ...['business.phone', 'business.hours', 'business.geo'].filter((p) => a.missing.includes(p)).map((p) => `no ${p.split('.')[1]}`),
        loaded.site.business.geo?.approximate && 'approximate map',
        ...a.facts.filter((f) => f.source?.confidence === 'low' && f.path !== 'business.geo').map((f) => `low: ${f.path.split('.')[1]}`),
      ].filter(Boolean);
      lines.push([
        ...base,
        'built',
        result.slug,
        `${PREVIEWS_ORIGIN}/${result.slug}/`,
        result.webPresence ?? '',
        String(a.confidence),
        String(a.checkFirst.length + (a.generic.length ? 1 : 0)),
        flags.join('; '),
        '',
      ]);
    }
  }

  writeFileSync(path.join(dir, 'batch-report.csv'), `${lines.map((l) => l.map(csvField).join(',')).join('\n')}\n`);
  writeFileSync(
    path.join(dir, 'needs-disambiguation.md'),
    ambiguous.length
      ? ambiguous
          .map(({ row, candidates }) =>
            [
              `## ${row.id} ${row.name} (${row.comune})`,
              '',
              `Lead: ${row.anchor.address} · ${row.anchor.phone} · ${row.anchor.googleMapsUrl}`,
              '',
              ...candidates.map((c) => `- ${c.name} · ${c.address ?? '?'} · ${c.phone ?? '?'}${c.url ? ` · ${c.url}` : ''}`),
              '',
            ].join('\n'),
          )
          .join('\n')
      : 'No ambiguous rows.\n',
  );

  const counts = Object.groupBy(lines.slice(1), (l) => l[4]);
  console.log(`Wrote ${path.relative(ROOT, dir)}/batch-report.csv`);
  console.log(Object.entries(counts).map(([status, l]) => `${l.length} ${status}`).join(' · '));
}

function readResult(dir, id) {
  const file = path.join(dir, 'results', `${id}.json`);
  if (!existsSync(file)) return null;
  const result = JSON.parse(readFileSync(file, 'utf8'));
  if (!RESULT_STATUSES.includes(result.status)) fail(`results/${id}.json: status must be one of ${RESULT_STATUSES.join(', ')}`);
  if (result.status === 'built' && !result.slug) fail(`results/${id}.json: a built row needs "slug"`);
  if (result.webPresence && !PRESENCE.includes(result.webPresence)) fail(`results/${id}.json: webPresence must be one of ${PRESENCE.join(', ')}`);
  return result;
}

/** Phone → slug for every site already built, archived ones included: a lead with a site is not rebuilt. */
function existingSitesByPhone() {
  const map = new Map();
  for (const dir of [path.join(ROOT, 'sites'), path.join(ROOT, 'sites', '_archive')]) {
    if (!existsSync(dir)) continue;
    for (const d of readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, d.name, 'site.json');
      if (!d.isDirectory() || d.name.startsWith('_') || !existsSync(file)) continue;
      const phone = JSON.parse(readFileSync(file, 'utf8')).business?.phone;
      if (phone) map.set(phoneKey(phone), d.name);
    }
  }
  return map;
}

/** leads/batches/<date>-<csv name>, with -2, -3… when that day's batch of the same list exists. */
function batchDir(csvPath) {
  const stem = `${new Date().toISOString().slice(0, 10)}-${path.basename(csvPath, path.extname(csvPath))}`;
  const root = path.join(ROOT, 'leads', 'batches');
  let dir = path.join(root, stem);
  for (let n = 2; existsSync(dir); n++) dir = path.join(root, `${stem}-${n}`);
  return dir;
}

function csvField(value) {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}
