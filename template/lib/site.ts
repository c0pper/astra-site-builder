import { readFileSync } from 'node:fs';
import path from 'node:path';
import { defaultSections, SUBTYPES, type SectionId } from '../registry.ts';
import { parseSite, type Site } from '../schema/site.ts';
import { siteImages, type SiteImages } from './images.ts';
import { resolveTheme, type Theme } from './theme.ts';

export interface SiteContext {
  slug: string;
  site: Site;
  theme: Theme;
  /** Sections to render, in order, already filtered to those with data. */
  sections: SectionId[];
  images: SiteImages;
  /** Visitor-facing sub-type label, e.g. "Gommista". */
  label: string;
  /** The service list of the site's category extension, if any. */
  services: { name: string; description?: string }[];
}

let cached: SiteContext | undefined;

export function loadSite(): SiteContext {
  if (cached) return cached;
  const slug = process.env.SITE_SLUG;
  const dir = process.env.SITE_DIR;
  if (!slug || !dir) {
    throw new Error('SITE_SLUG / SITE_DIR not set. Use `pnpm build:site <slug>`.');
  }
  const result = parseSite(JSON.parse(readFileSync(path.join(dir, 'site.json'), 'utf8')));
  if (!result.ok) throw new Error(`Invalid site.json for "${slug}":\n${result.error}`);
  const { site } = result;

  const images = siteImages(site);
  const services = site.automotive?.services ?? [];
  const requested = site.sections ?? defaultSections(site.subtype);

  cached = {
    slug,
    site,
    theme: resolveTheme(slug, site),
    sections: requested.filter((id) => hasContent(id, site, { gallery: images.gallery.length, services: services.length })),
    images,
    label: SUBTYPES[site.subtype].label,
    services,
  };
  return cached;
}

/** Sections with no data are hidden. Hero, hours, contact and map always render. */
function hasContent(id: SectionId, site: Site, counts: { gallery: number; services: number }): boolean {
  switch (id) {
    case 'hero':
    case 'hours':
    case 'contact':
    case 'map':
      return true;
    case 'about':
      return Boolean(site.copy.about);
    case 'services':
      return counts.services > 0;
    case 'reviews':
      return Boolean(site.business.rating);
    case 'gallery':
      return counts.gallery >= 3;
    case 'brands':
      return Boolean(site.automotive?.brands?.length);
    case 'booking':
      return Boolean(site.automotive?.booking);
    case 'seasonal-banner':
      return Boolean(site.business.phone || site.business.whatsapp);
    case 'retail-categories':
      return Boolean(site.retail?.categories?.length);
    case 'retail-brands':
      return Boolean(site.retail?.brands?.length);
    default:
      // Category sections whose components are not built yet (food-beverage, fitness, trades).
      return false;
  }
}
