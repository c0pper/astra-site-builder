// Screenshot diff for a built site against its committed baseline (tests/visual/<slug>/).
// Usage: node scripts/visual.mjs <slug> [--update]
// --update rewrites the baseline: do it only after reviewing the diff of an intended change.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import pixelmatch from 'pixelmatch';
import { chromium, devices } from 'playwright';
import { PNG } from 'pngjs';
import { serve } from './lib/serve.mjs';
import { fail, loadSite, ROOT } from './lib/sites.mjs';

const VIEWPORTS = {
  desktop: { viewport: { width: 1280, height: 800 } },
  // 1x density: Chrome repeats the page in full-page captures taller than 16384 device pixels, which a long
  // page at the iPhone's 3x reaches (~5500 CSS px). The CSS layout is the same at any density.
  mobile: { ...devices['iPhone 13'], deviceScaleFactor: 1 },
};
// Outside the seasonal-banner windows and before any fixture closure, so date-driven UI is stable.
const FIXED_TIME = new Date('2026-07-01T10:00:00Z');
// Renders are pixel-identical run to run (measured: 0 px). The small allowance absorbs anti-aliasing shifts
// across Chrome updates. Absolute, not a share of the page: on a tall page a share would hide a whole footer.
const MAX_CHANGED_PIXELS = 50;

export async function runVisual(slug, { update = false } = {}) {
  const { outDir, base } = loadSite(slug);
  if (!existsSync(outDir)) fail(`dist/${slug} not found. Run \`pnpm build:site ${slug}\` first.`);
  const baselineDir = path.join(ROOT, 'tests', 'visual', slug);
  const diffDir = path.join(ROOT, 'dist', '_visual', slug);
  mkdirSync(baselineDir, { recursive: true });
  mkdirSync(diffDir, { recursive: true });

  const server = await serve(outDir, base);
  const browser = await chromium.launch({ channel: 'chrome' });
  const problems = [];
  try {
    for (const [name, options] of Object.entries(VIEWPORTS)) {
      const context = await browser.newContext({ ...options, reducedMotion: 'reduce' });
      const page = await context.newPage();
      await page.clock.setFixedTime(FIXED_TIME);
      await page.goto(server.url, { waitUntil: 'networkidle' });
      // Load lazy images, then wait for fonts so text metrics are final.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight / 2) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 50));
        }
        window.scrollTo(0, 0);
        await document.fonts.ready;
        // Fixed and sticky elements (the mobile action bar, the header) land at a scroll-dependent spot in
        // full-page captures; render them in normal flow so the capture is deterministic.
        for (const el of document.querySelectorAll('body *')) {
          if (['fixed', 'sticky'].includes(getComputedStyle(el).position)) el.style.position = 'static';
        }
      });
      await page.waitForLoadState('networkidle');
      const shot = await page.screenshot({ fullPage: true, animations: 'disabled' });
      await context.close();

      const baselineFile = path.join(baselineDir, `${name}.png`);
      if (update || !existsSync(baselineFile)) {
        if (!update) {
          problems.push(`${name}: no baseline. Review the page, then run \`pnpm visual ${slug} --update\``);
          writeFileSync(path.join(diffDir, `${name}-actual.png`), shot);
          continue;
        }
        writeFileSync(baselineFile, shot);
        continue;
      }

      const expected = PNG.sync.read(readFileSync(baselineFile));
      const actual = PNG.sync.read(shot);
      if (expected.width !== actual.width || expected.height !== actual.height) {
        writeFileSync(path.join(diffDir, `${name}-actual.png`), shot);
        problems.push(
          `${name}: size changed ${expected.width}×${expected.height} → ${actual.width}×${actual.height} (see dist/_visual/${slug}/)`,
        );
        continue;
      }
      const diff = new PNG({ width: actual.width, height: actual.height });
      const changed = pixelmatch(expected.data, actual.data, diff.data, actual.width, actual.height, { threshold: 0.1 });
      if (changed > MAX_CHANGED_PIXELS) {
        writeFileSync(path.join(diffDir, `${name}-actual.png`), shot);
        writeFileSync(path.join(diffDir, `${name}-diff.png`), PNG.sync.write(diff));
        problems.push(`${name}: ${changed} pixels changed (see dist/_visual/${slug}/${name}-diff.png)`);
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }
  return { ok: problems.length === 0, problems, updated: update };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const slug = args.find((a) => !a.startsWith('--'));
  if (!slug) fail('Usage: node scripts/visual.mjs <slug> [--update]');
  const { ok, problems, updated } = await runVisual(slug, { update: args.includes('--update') });
  console.log(updated ? `${slug}: baseline updated` : ok ? `${slug}: matches baseline` : `${slug}: visual diff`);
  if (!ok) console.error(problems.map((p) => `  ${p}`).join('\n'));
  process.exit(ok ? 0 : 1);
}
