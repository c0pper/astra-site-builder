// Vite plugin: exposes `virtual:site-images` with only the pack photos this site uses.
// Importing just these (instead of globbing every pack) keeps unused originals out of the build output.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SubtypeId } from '../registry.ts';
import { parseSite } from '../schema/site.ts';
import { selectPackImages, type PackEntry, type PackPick } from './pack-select.ts';
import { resolveTheme } from './theme.ts';

const PACKS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets/packs');
const VIRTUAL_ID = 'virtual:site-images';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;
const IMAGE_EXT = /\.(jpe?g|png|webp|avif)$/i;

export function siteImagesPlugin(slug: string, siteDir: string) {
  return {
    name: 'site-images',
    resolveId(id: string) {
      return id === VIRTUAL_ID ? RESOLVED_ID : undefined;
    },
    load(id: string) {
      if (id !== RESOLVED_ID) return undefined;
      const result = parseSite(JSON.parse(readFileSync(path.join(siteDir, 'site.json'), 'utf8')));
      if (!result.ok) throw new Error(`Invalid site.json for "${slug}":\n${result.error}`);
      const site = result.site;

      const packs: Partial<Record<SubtypeId, PackEntry[]>> = {};
      for (const subtype of [site.subtype, ...site.secondarySubtypes]) {
        const credits = path.join(PACKS_DIR, subtype, 'credits.json');
        if (existsSync(credits)) packs[subtype] = JSON.parse(readFileSync(credits, 'utf8'));
      }
      const galleryDir = path.join(siteDir, 'assets', 'gallery');
      const hasClientPhotos = existsSync(galleryDir) && readdirSync(galleryDir).some((f) => IMAGE_EXT.test(f));

      // The `centered` hero layout shows no photo, so none is picked (or emitted, or credited).
      const heroShowsImage = resolveTheme(slug, site).variants.hero !== 'centered';
      const selection = selectPackImages(slug, site, packs, { heroShowsImage, hasClientPhotos });
      const imports: string[] = [];
      const expr = (img: PackPick | undefined) => {
        if (!img) return 'undefined';
        const file = path.join(PACKS_DIR, img.subtype, img.file);
        if (!existsSync(file)) throw new Error(`Pack "${img.subtype}": credits.json lists "${img.file}" but the file is missing`);
        const name = `img${imports.length}`;
        imports.push(`import ${name} from ${JSON.stringify(file.replaceAll('\\', '/'))};`);
        return `{ ...${JSON.stringify(img)}, src: ${name} }`;
      };
      const hero = expr(selection.hero);
      const about = expr(selection.about);
      const gallery = `[${selection.gallery.map(expr).join(', ')}]`;

      return `${imports.join('\n')}\nexport const hero = ${hero};\nexport const about = ${about};\nexport const gallery = ${gallery};\n`;
    },
  };
}
