// Which pack photos a site uses. Plain Node-compatible logic, run by the site-images Vite plugin
// at config time so that only the chosen photos are imported (and emitted) by the build.
import type { SubtypeId } from '../registry.ts';
import type { Site } from '../schema/site.ts';
import { hash } from './theme.ts';

export interface PackEntry {
  file: string;
  /** Italian alt text describing the photo. */
  alt: string;
  author: string;
  authorUrl?: string;
  source: string;
  sourceUrl: string;
  licence: string;
  licenceUrl?: string;
  /** Slots this photo suits; omitted = any. */
  roles?: ImageRole[];
}
export type ImageRole = 'hero' | 'about' | 'gallery';
export interface PackPick extends PackEntry {
  subtype: SubtypeId;
}
export interface PackSelection {
  hero?: PackPick;
  about?: PackPick;
  /** Stock gallery: only on spec sites without client photos, labelled as illustrative. */
  gallery: PackPick[];
}

const GALLERY_SIZE = 6;

const key = (img: PackPick) => `${img.subtype}/${img.file}`;
const suits = (img: PackPick, role: ImageRole) => !img.roles || img.roles.includes(role);

/**
 * Deterministic per slug. Each slot draws from the primary sub-type's pack and falls back to secondary packs only
 * when the primary has no suitable photo left.
 */
export function selectPackImages(
  slug: string,
  site: Site,
  packs: Partial<Record<SubtypeId, PackEntry[]>>,
  options: { heroShowsImage: boolean; hasClientPhotos: boolean },
): PackSelection {
  // One tier per sub-type, primary first.
  const tiers: PackPick[][] = [site.subtype, ...site.secondarySubtypes].map((subtype) =>
    (packs[subtype] ?? []).map((entry) => ({ ...entry, subtype })),
  );
  const used = new Set<string>();
  const available = (role: ImageRole) =>
    tiers.map((tier) =>
      tier
        .filter((img) => !used.has(key(img)) && suits(img, role))
        .sort((a, b) => hash(`${slug}:${role}:${key(a)}`) - hash(`${slug}:${role}:${key(b)}`)),
    );

  const pickOne = (role: 'hero' | 'about') => {
    const img = available(role).find((tier) => tier.length)?.[0];
    if (img) used.add(key(img));
    return img;
  };
  const hero = options.heroShowsImage ? pickOne('hero') : undefined;
  const about = pickOne('about');

  const gallery =
    !options.hasClientPhotos && site.status === 'spec' ? available('gallery').flat().slice(0, GALLERY_SIZE) : [];

  return { hero, about, gallery };
}
