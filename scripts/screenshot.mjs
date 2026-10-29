// Full-page screenshots of a built site, desktop and mobile, plus a horizontal-overflow check.
// Usage: node scripts/screenshot.mjs <url> <outDir>
// Uses the locally installed Chrome (channel "chrome"), so no Playwright browser download is needed.
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { chromium, devices } from 'playwright';

const [url, outDir] = process.argv.slice(2);
if (!url || !outDir) {
  console.error('Usage: node scripts/screenshot.mjs <url> <outDir>');
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

const VIEWPORTS = {
  desktop: { viewport: { width: 1280, height: 800 } },
  // 1x density: Chrome repeats the page in full-page captures taller than 16384 device pixels, which a long
  // page at the iPhone's 3x reaches (~5500 CSS px). The CSS layout is the same at any density.
  mobile: { ...devices['iPhone 13'], deviceScaleFactor: 1 },
};

const browser = await chromium.launch({ channel: 'chrome' });
let overflow = false;
for (const [name, options] of Object.entries(VIEWPORTS)) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  // Scroll through the page so lazy-loaded images load before the full-page capture.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight / 2) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 100));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState('networkidle');
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  if (scrollWidth > innerWidth) {
    overflow = true;
    console.error(`${name}: horizontal overflow (${scrollWidth}px content in ${innerWidth}px viewport)`);
  }
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`${name}: ${file}`);
  await context.close();
}
await browser.close();
process.exit(overflow ? 1 : 0);
