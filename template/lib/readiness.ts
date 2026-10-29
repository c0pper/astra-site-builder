// Registry completeness: a sub-type is ready when its image pack has credits and its category has a tone guide and theme preset.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SUBTYPES, type SubtypeId } from '../registry.ts';
import { PRESETS } from '../presets/index.ts';

const TEMPLATE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function missingAssets(id: SubtypeId): string[] {
  const missing: string[] = [];
  const credits = path.join(TEMPLATE_DIR, 'assets', 'packs', id, 'credits.json');
  if (!existsSync(credits)) {
    missing.push(`image pack (${path.relative(TEMPLATE_DIR, credits)})`);
  } else {
    const entries: unknown = JSON.parse(readFileSync(credits, 'utf8'));
    if (!Array.isArray(entries) || entries.length === 0) missing.push(`images in ${path.relative(TEMPLATE_DIR, credits)}`);
  }
  const { category } = SUBTYPES[id];
  const tone = path.join(TEMPLATE_DIR, 'presets', category, 'tone.md');
  if (!existsSync(tone)) missing.push(`tone guide (${path.relative(TEMPLATE_DIR, tone)})`);
  if (!PRESETS[category]) missing.push(`theme preset (presets/${category}/theme.ts)`);
  return missing;
}
