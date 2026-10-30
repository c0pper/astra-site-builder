import { readFileSync } from 'node:fs';
import path from 'node:path';
import { defaultSections, SUBTYPES, type SectionId } from '../registry.ts';
import { parseSite, siteBooking, siteServices, type Site } from '../schema/site.ts';
import { siteImages, type SiteImages } from './images.ts';
import { resolveTheme, type Theme, type Variants } from './theme.ts';

export interface SiteContext {
  slug: string;
  site: Site;
  theme: Theme;
  /** Sections to render, in order, already filtered to those with data. */
  sections: SectionId[];
  images: SiteImages;
  /** Hero layout actually rendered: photo layouts fall back to `centered` when the pack has no hero photo. */
  heroLayout: Variants['hero'];
  /** The home page opens on a full-bleed hero (photo or primary colour) that the transparent header sits on. */
  heroUnderHeader: boolean;
  /** Visitor-facing sub-type label, e.g. "Gommista". */
  label: string;
  /** The service list of the site's category extension, if any. */
  services: { name: string; description?: string; generic?: boolean }[];
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
  const services = siteServices(site);
  const requested = site.sections ?? defaultSections(site.subtype);
  const theme = resolveTheme(slug, site);
  const sections = requested.filter((id) => hasContent(id, site, { gallery: images.gallery.length, services: services.length }));
  const heroLayout = images.hero ? theme.variants.hero : 'centered';

  cached = {
    slug,
    site,
    theme,
    sections,
    images,
    heroLayout,
    heroUnderHeader: sections[0] === 'hero' && heroLayout !== 'split',
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
      return Boolean(siteBooking(site));
    case 'products':
      return Boolean(site.foodBeverage?.specialities?.length || site.foodBeverage?.cuisine?.length);
    case 'menu':
      return Boolean(site.foodBeverage?.menu);
    case 'seasonal-banner':
      return Boolean(site.business.phone || site.business.whatsapp);
    case 'retail-categories':
      return Boolean(site.retail?.categories?.length);
    case 'retail-brands':
      return Boolean(site.retail?.brands?.length);
    default:
      // Category sections whose components are not built yet (fitness, trades).
      return false;
  }
}
