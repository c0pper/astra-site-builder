// Lighthouse (mobile) for a built site. Gate: Performance and Accessibility ≥ 95, and no failing critical
// accessibility audit (a single contrast failure costs only ~4 points, so the score alone lets it through).
// Usage: node scripts/lighthouse.mjs <slug>   (build first: pnpm build:site <slug>)
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import lighthouse from 'lighthouse';
import { chromium } from 'playwright';
import { serve } from './lib/serve.mjs';
import { fail, loadSite } from './lib/sites.mjs';

export const MIN_SCORE = 95;
const GATED = ['performance', 'accessibility'];
const REPORTED = [...GATED, 'best-practices', 'seo'];
const CRITICAL_AUDITS = [
  'color-contrast',
  'image-alt',
  'label',
  'link-name',
  'button-name',
  'document-title',
  'html-has-lang',
  'meta-viewport',
  'heading-order',
];

export async function runLighthouse(slug) {
  const { outDir, base } = loadSite(slug);
  if (!existsSync(outDir)) fail(`dist/${slug} not found. Run \`pnpm build:site ${slug}\` first.`);

  const server = await serve(outDir, base);
  // Lighthouse drives the locally installed Chrome over the DevTools protocol.
  const port = 9300 + Math.floor(Math.random() * 600);
  const browser = await chromium.launch({ channel: 'chrome', args: [`--remote-debugging-port=${port}`] });
  try {
    const result = await lighthouse(server.url, { port, logLevel: 'error', onlyCategories: REPORTED });
    const { categories, audits } = result.lhr;
    const scores = Object.fromEntries(REPORTED.map((id) => [id, Math.round((categories[id]?.score ?? 0) * 100)]));
    const failing = GATED.filter((id) => scores[id] < MIN_SCORE);
    const critical = CRITICAL_AUDITS.filter((id) => audits[id] && audits[id].score === 0);

    // For each failing category, the audits that cost points.
    const reasons = failing.flatMap((id) =>
      categories[id].auditRefs
        .filter((ref) => ref.weight > 0 && audits[ref.id].score !== null && audits[ref.id].score < 1)
        .map((ref) => `  ${id}: ${audits[ref.id].title}${audits[ref.id].displayValue ? ` (${audits[ref.id].displayValue})` : ''}`),
    );
    reasons.push(
      ...critical.filter((id) => !failing.includes('accessibility')).map((id) => `  accessibility (critical): ${audits[id].title}`),
    );
    return { ok: failing.length === 0 && critical.length === 0, scores, reasons };
  } finally {
    await browser.close();
    await server.close();
  }
}

export function formatScores(scores) {
  return Object.entries(scores)
    .map(([id, s]) => `${id} ${s}${GATED.includes(id) && s < MIN_SCORE ? ' ✗' : ''}`)
    .join(' · ');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [slug] = process.argv.slice(2);
  if (!slug) fail('Usage: node scripts/lighthouse.mjs <slug>');
  const { ok, scores, reasons } = await runLighthouse(slug);
  console.log(`${slug}: ${formatScores(scores)}`);
  if (!ok) console.error(reasons.join('\n'));
  process.exit(ok ? 0 : 1);
}
