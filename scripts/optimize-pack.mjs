// Normalises a pack's photos in place: max 1600px wide, mozjpeg q78, metadata stripped (incl. GPS EXIF).
// Astro copies each used original into the site output, so pack sources should already be web-sized.
// Usage: node scripts/optimize-pack.mjs <subtype>
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const MAX_WIDTH = 1600;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [subtype] = process.argv.slice(2);
if (!subtype) {
  console.error('Usage: node scripts/optimize-pack.mjs <subtype>');
  process.exit(1);
}

const dir = path.join(ROOT, 'template', 'assets', 'packs', subtype);
let before = 0;
let after = 0;
for (const file of readdirSync(dir).filter((f) => /\.jpe?g$/i.test(f))) {
  const full = path.join(dir, file);
  const input = readFileSync(full);
  before += input.length;
  // rotate() applies EXIF orientation before the metadata is dropped.
  const output = await sharp(input)
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: 78, mozjpeg: true })
    .toBuffer();
  writeFileSync(full, output);
  after += statSync(full).size;
}
console.log(`${subtype}: ${(before / 1e6).toFixed(1)} MB → ${(after / 1e6).toFixed(1)} MB`);
