// Quality gate: build, Lighthouse (all sites), screenshot diff (live sites only; spec previews change freely).
// Usage: node scripts/gate.mjs <slug...> | --live
import { spawnSync } from 'node:child_process';
import { formatScores, runLighthouse } from './lighthouse.mjs';
import { fail, liveSlugs, loadSite, ROOT } from './lib/sites.mjs';
import { runVisual } from './visual.mjs';

const args = process.argv.slice(2);
const slugs = args.includes('--live') ? liveSlugs() : args.filter((a) => !a.startsWith('--'));
if (!slugs.length) fail('Usage: node scripts/gate.mjs <slug...> | --live');

let failed = 0;
for (const slug of slugs) {
  const { site } = loadSite(slug);
  const lines = [];
  let ok = true;

  const build = spawnSync('node', ['scripts/site.mjs', 'build', slug], { cwd: ROOT, encoding: 'utf8' });
  if (build.status !== 0) {
    ok = false;
    lines.push(`  build failed:\n${(build.stderr || build.stdout).trim().split('\n').slice(-15).join('\n')}`);
  } else {
    const lh = await runLighthouse(slug);
    const seoNote = site.status === 'spec' ? ' (low SEO is expected: previews are noindex)' : '';
    lines.push(`  lighthouse: ${formatScores(lh.scores)}${seoNote}`, ...lh.reasons.map((r) => `  ${r}`));
    ok &&= lh.ok;

    if (site.status === 'live') {
      const visual = await runVisual(slug);
      lines.push(`  visual: ${visual.ok ? 'matches baseline' : 'diff'}`, ...visual.problems.map((p) => `    ${p}`));
      ok &&= visual.ok;
    }
  }

  if (!ok) failed++;
  console.log(`${ok ? '✓' : '✗'} ${slug}\n${lines.join('\n')}`);
}
console.log(`\n${slugs.length - failed}/${slugs.length} passed.`);
process.exit(failed ? 1 : 0);
