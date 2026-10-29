// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { siteImagesPlugin } from './template/lib/site-images-plugin.ts';

// Set by scripts/site.mjs. Run through `pnpm build:site <slug>`, not `astro build` directly.
const { SITE_SLUG: slug, SITE_DIR: siteDir, SITE_BASE: base = '/' } = process.env;
if (!slug || !siteDir) {
  throw new Error('SITE_SLUG / SITE_DIR are not set. Use `pnpm build:site <slug>` (or dev/preview/check).');
}

export default defineConfig({
  srcDir: './template',
  publicDir: './template/public',
  outDir: `./dist/${slug}`,
  // Spec previews are served under /<slug>/ of the shared previews project; live sites at the root.
  base,
  vite: {
    plugins: [tailwindcss(), siteImagesPlugin(slug, siteDir)],
    resolve: { alias: { '@site': siteDir } },
  },
});
