// Theme resolution: palette + font pairing + section variants for one site.
// Each axis is picked deterministically from the slug unless site.json pins it; brand colours win over the palette.
import type { CategoryId } from '../registry.ts';
import type { Site } from '../schema/site.ts';
import { PRESETS } from '../presets/index.ts';

export interface Palette {
  id: string;
  primary: string;
  accent: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  muted: string;
}

export interface FontPairing {
  id: string;
  /** CSS font-family values; the fonts are self-hosted via Fontsource imports in styles/global.css. */
  heading: string;
  body: string;
}

export const VARIANTS = {
  hero: ['split', 'overlay', 'centered'],
  services: ['grid', 'list'],
  gallery: ['grid', 'strip'],
} as const;
export type VariantSection = keyof typeof VARIANTS;
export type Variants = { [K in VariantSection]: (typeof VARIANTS)[K][number] };

export interface Preset {
  palettes: Palette[];
  fonts: FontPairing[];
}

export interface Theme {
  palette: Palette;
  fonts: FontPairing;
  variants: Variants;
  /** Inline style for <html>: CSS custom properties consumed by the Tailwind tokens. */
  cssVars: string;
}

export function presetFor(category: CategoryId): Preset {
  const preset = PRESETS[category];
  if (!preset) throw new Error(`No theme preset for category "${category}" yet (template/presets/${category}/theme.ts)`);
  return preset;
}

export function resolveTheme(slug: string, site: Site): Theme {
  const preset = presetFor(site.category);
  const t = site.theme;

  const basePalette = pick(preset.palettes, t.palette, slug, 'palette');
  const palette: Palette = t.brandColors
    ? { ...basePalette, id: 'brand', primary: t.brandColors.primary, accent: t.brandColors.accent ?? basePalette.accent }
    : basePalette;
  const fonts = pick(preset.fonts, t.fonts, slug, 'fonts');

  const variants = Object.fromEntries(
    (Object.keys(VARIANTS) as VariantSection[]).map((section) => {
      const options: readonly string[] = VARIANTS[section];
      const pinned = t.variants?.[section];
      if (pinned && !options.includes(pinned)) {
        throw new Error(`Unknown ${section} variant "${pinned}". Options: ${options.join(', ')}`);
      }
      return [section, pinned ?? options[hash(`${slug}:${section}`) % options.length]];
    }),
  ) as Variants;

  return { palette, fonts, variants, cssVars: cssVars(palette, fonts) };
}

function pick<T extends { id: string }>(options: T[], pinned: string | undefined, slug: string, axis: string): T {
  if (pinned) {
    const found = options.find((o) => o.id === pinned);
    if (!found) throw new Error(`Unknown ${axis} "${pinned}". Options: ${options.map((o) => o.id).join(', ')}`);
    return found;
  }
  return options[hash(`${slug}:${axis}`) % options.length];
}

/** FNV-1a: stable across builds and machines. */
export function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function cssVars(p: Palette, f: FontPairing): string {
  const vars: Record<string, string> = {
    '--primary': p.primary,
    '--on-primary': readableOn(p.primary),
    '--accent': p.accent,
    '--on-accent': readableOn(p.accent),
    '--surface': p.surface,
    '--surface-alt': p.surfaceAlt,
    '--text': p.text,
    '--muted': p.muted,
    // Primary as text on the page background, falling back to body text when contrast is too low (e.g. a pale brand colour).
    '--ink': contrast(p.primary, p.surface) >= 4.5 ? p.primary : p.text,
    '--font-heading': f.heading,
    '--font-body': f.body,
  };
  return Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(';');
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Black or white, whichever reads better on the given background. */
export function readableOn(background: string): string {
  return contrast(background, '#ffffff') >= contrast(background, '#111111') ? '#ffffff' : '#111111';
}
