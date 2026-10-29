// Image sources for the page. Astro/Vite only.
// - Pack photos come from `virtual:site-images` (lib/site-images-plugin.ts): only the ones this site uses.
// - Client photos (sites/<slug>/assets/gallery/): the only gallery source on live sites.
import type { ImageMetadata } from 'astro';
import { about, gallery as stockGallery, hero } from 'virtual:site-images';
import type { Site } from '../schema/site.ts';
import type { PackPick } from './pack-select.ts';

export interface PackImage extends PackPick {
  src: ImageMetadata;
}

export interface GalleryImage {
  src: ImageMetadata;
  alt: string;
}

export interface SiteImages {
  hero?: PackImage;
  about?: PackImage;
  gallery: GalleryImage[];
  /** True when the gallery is stock, which the page must label as illustrative. */
  galleryIllustrative: boolean;
  /** Every pack image on the site, for the Crediti page. */
  credits: PackImage[];
}

// `@site` is aliased to the current site's folder in astro.config.mjs.
const clientFiles = import.meta.glob<ImageMetadata>('@site/assets/gallery/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  import: 'default',
});

export function siteImages(site: Site): SiteImages {
  const client = Object.keys(clientFiles)
    .sort()
    .map((file, i) => ({ src: clientFiles[file], alt: `Foto ${i + 1} di ${site.business.name}` }));

  return {
    hero,
    about,
    gallery: client.length ? client : stockGallery.map(({ src, alt }) => ({ src, alt })),
    galleryIllustrative: !client.length && stockGallery.length > 0,
    credits: [hero, about, ...stockGallery].filter((img): img is PackImage => Boolean(img)),
  };
}
