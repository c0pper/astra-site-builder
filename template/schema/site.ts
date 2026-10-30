// The site.json contract. See docs/DESIGN.md › Content contract.
// Runs both in the Astro build and in plain Node (scripts), so keep imports to `zod` and the registry.
import { z } from 'zod';
import {
  CATEGORIES,
  CATEGORY_IDS,
  SECTION_IDS,
  SUBTYPES,
  SUBTYPE_IDS,
  type CategoryId,
} from '../registry.ts';

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:MM');
const phone = z.string().regex(/^\+?[0-9 ]{6,}$/, 'Expected digits, optionally with + and spaces');
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Expected #RRGGBB');

const interval = z.strictObject({ open: time, close: time });
/** Per weekday: list of opening intervals. Empty list = closed; missing day = unknown. */
const hours = z.strictObject({
  mon: z.array(interval).optional(),
  tue: z.array(interval).optional(),
  wed: z.array(interval).optional(),
  thu: z.array(interval).optional(),
  fri: z.array(interval).optional(),
  sat: z.array(interval).optional(),
  sun: z.array(interval).optional(),
});

const business = z.strictObject({
  name: z.string().min(1),
  legalName: z.string().optional(),
  vatNumber: z.string().regex(/^\d{11}$/, 'P.IVA: 11 digits').optional(),
  address: z.strictObject({
    street: z.string().min(1),
    postalCode: z.string().regex(/^\d{5}$/, 'CAP: 5 digits'),
    city: z.string().min(1),
    province: z.string().regex(/^[A-Z]{2}$/, 'Province: 2 uppercase letters, e.g. NA'),
  }),
  geo: z
    .strictObject({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      /** Street-level match only (the geocoder did not know the house number): the map says so. */
      approximate: z.boolean().default(false),
    })
    .optional(),
  phone: phone.optional(),
  whatsapp: phone.optional(),
  email: z.email().optional(),
  hours: hours.optional(),
  seasonalClosures: z
    .array(z.strictObject({ from: z.iso.date(), to: z.iso.date(), note: z.string().optional() }))
    .optional(),
  socials: z.strictObject({ facebook: z.url().optional(), instagram: z.url().optional() }).optional(),
  googleMapsUrl: z.url().optional(),
  /** A directory profile people contact the business through (MioDottore, TheFork): shown as a contact action. */
  directory: z.strictObject({ name: z.string().min(1), url: z.url() }).optional(),
  rating: z.strictObject({ value: z.number().min(0).max(5), count: z.int().min(0), url: z.url() }).optional(),
});

const service = z.strictObject({
  name: z.string().min(1),
  description: z.string().optional(),
  /** Implied by the sub-type rather than found in research. Must come from the registry's list. */
  generic: z.boolean().default(false),
});

const extensions = {
  automotive: z.strictObject({
    services: z.array(service).optional(),
    brands: z.array(z.string().min(1)).optional(),
    booking: z.strictObject({ url: z.url().optional(), phone: phone.optional() }).optional(),
  }),
  foodBeverage: z.strictObject({
    /** Cuisine styles as a source names them, e.g. "Napoletana". */
    cuisine: z.array(z.string().min(1)).optional(),
    /** Dishes or products a source names. */
    specialities: z.array(z.strictObject({ name: z.string().min(1), description: z.string().optional() })).optional(),
    services: z.array(service).optional(),
    /** The business's own published menu: linked, never copied, so prices stay current. */
    menu: z.strictObject({ url: z.url() }).optional(),
    booking: z.strictObject({ url: z.url().optional(), phone: phone.optional() }).optional(),
  }),
  health: z.strictObject({
    /** The professional title as a source states it, e.g. "Psicologa psicoterapeuta". Replaces the sub-type label. */
    title: z.string().min(1).optional(),
    /** Registration with the professional order (Albo). The number only if a source shows it. */
    registration: z.strictObject({ board: z.string().min(1), number: z.string().min(1).optional() }).optional(),
    /** Specialisations and therapeutic approaches, as a source names them. */
    specializations: z.array(z.string().min(1)).optional(),
    /** Issues a source says the practitioner works with, e.g. "Ansia". */
    areas: z.array(z.string().min(1)).optional(),
    services: z.array(service).optional(),
    /** Languages other than Italian that sessions can be held in. */
    languages: z.array(z.string().min(1)).optional(),
    booking: z.strictObject({ url: z.url().optional(), phone: phone.optional() }).optional(),
  }),
  // Filled in when each category is built (PLAN "After MVP").
  fitness: z.strictObject({}),
  trades: z.strictObject({}),
  retail: z.strictObject({
    categories: z.array(z.string().min(1)).optional(),
    brands: z.array(z.string().min(1)).optional(),
  }),
};
type ExtensionKey = keyof typeof extensions;

export const EXTENSION_FOR_CATEGORY: Record<CategoryId, ExtensionKey> = {
  automotive: 'automotive',
  'food-beverage': 'foodBeverage',
  fitness: 'fitness',
  trades: 'trades',
  health: 'health',
};

const CONFIDENCE = ['low', 'medium', 'high', 'verified'] as const;

const source = z
  .strictObject({
    urls: z.array(z.url()).default([]),
    retrieved: z.iso.date(),
    /** `verified` = confirmed by the client; required for every source on a live site. */
    confidence: z.enum(CONFIDENCE),
    note: z.string().optional(),
  })
  .refine((s) => s.urls.length > 0 || s.confidence === 'verified', {
    message: 'A source needs at least one URL unless confidence is "verified"',
  });

export const siteSchema = z
  .strictObject({
    status: z.enum(['spec', 'live']),
    previewExpires: z.iso.date().optional(),
    category: z.enum(CATEGORY_IDS),
    subtype: z.enum(SUBTYPE_IDS),
    secondarySubtypes: z.array(z.enum(SUBTYPE_IDS)).default([]),
    business,
    theme: z
      .strictObject({
        palette: z.string().optional(),
        fonts: z.string().optional(),
        variants: z.partialRecord(z.enum(SECTION_IDS), z.string()).optional(),
        brandColors: z.strictObject({ primary: hexColor, accent: hexColor.optional() }).optional(),
      })
      .default({}),
    /** Ordered section list. Omit to use the registry defaults for the sub-type. */
    sections: z.array(z.enum(SECTION_IDS)).optional(),
    /** Free-form marketing copy. States only facts that are sourced elsewhere in this file. */
    copy: z
      .strictObject({
        headline: z.string().optional(),
        tagline: z.string().optional(),
        about: z.string().optional(),
        /** Who speaks in the page's own words: "we" for a business, "i" for an individual practitioner. */
        voice: z.enum(['we', 'i']).default('we'),
      })
      .default({ voice: 'we' }),
    seo: z.strictObject({ title: z.string().optional(), description: z.string().optional() }).default({}),
    ...Object.fromEntries(Object.entries(extensions).map(([k, s]) => [k, s.optional()])) as {
      [K in ExtensionKey]: z.ZodOptional<(typeof extensions)[K]>;
    },
    /** Keyed by fact path, e.g. "business.phone" or "automotive.brands". */
    sources: z.record(z.string(), source).default({}),
  })
  .superRefine((site, ctx) => {
    const issue = (path: (string | number)[], message: string) => ctx.addIssue({ code: 'custom', path, message });

    // Taxonomy
    if (SUBTYPES[site.subtype].category !== site.category) {
      issue(['subtype'], `"${site.subtype}" belongs to category "${SUBTYPES[site.subtype].category}", not "${site.category}"`);
    }
    if (site.secondarySubtypes.includes(site.subtype)) {
      issue(['secondarySubtypes'], 'Must not repeat the primary subtype');
    }
    if (site.sections && new Set(site.sections).size !== site.sections.length) {
      issue(['sections'], 'Sections must be unique');
    }

    // Only the site's own category extension (plus retail) may be present.
    const ownExtension = EXTENSION_FOR_CATEGORY[site.category];
    for (const key of Object.keys(extensions) as ExtensionKey[]) {
      if (site[key] && key !== ownExtension && key !== 'retail') {
        issue([key], `Extension "${key}" does not belong to category "${site.category}" (use "${ownExtension}")`);
      }
    }

    if (site.business.rating && !CATEGORIES[site.category].allowsRatings) {
      issue(['business', 'rating'], `Category "${site.category}" shows no ratings (health advertising must be informative only)`);
    }

    // Generic services: allowed only where the category permits, and only from the registry list.
    const services = siteServices(site);
    const allowedGeneric = new Set(
      [site.subtype, ...site.secondarySubtypes].flatMap((id) => SUBTYPES[id].genericServices ?? []),
    );
    services.forEach((s, i) => {
      if (!s.generic) return;
      if (!CATEGORIES[site.category].allowsGenericServices) {
        issue([ownExtension, 'services', i], `Category "${site.category}" does not allow generic services`);
      } else if (!allowedGeneric.has(s.name)) {
        issue([ownExtension, 'services', i, 'name'], `"${s.name}" is not a registry generic service for this site's subtypes`);
      }
    });

    // Every fact needs a source; every source must point at a fact.
    const factPaths = new Set<string>();
    for (const key of Object.keys(site.business)) factPaths.add(`business.${key}`);
    for (const ext of [ownExtension, 'retail'] as const) {
      const block = site[ext] as Record<string, unknown> | undefined;
      if (!block) continue;
      for (const [key, value] of Object.entries(block)) {
        const allGeneric = key === 'services' && Array.isArray(value) && value.every((s) => s.generic);
        if (!allGeneric) factPaths.add(`${ext}.${key}`);
      }
    }
    for (const path of factPaths) {
      if (!site.sources[path]) issue(['sources'], `Missing source for "${path}"`);
    }
    for (const path of Object.keys(site.sources)) {
      if (!factPaths.has(path)) issue(['sources', path], `Source "${path}" does not match any fact in this file`);
    }

    // Lifecycle gates
    if (site.status === 'spec' && !site.previewExpires) {
      issue(['previewExpires'], 'Spec sites need previewExpires (90 days from creation)');
    }
    if (site.status === 'live') {
      for (const field of ['legalName', 'vatNumber', 'email'] as const) {
        if (!site.business[field]) issue(['business', field], `Live sites require business.${field}`);
      }
      for (const [path, s] of Object.entries(site.sources)) {
        if (s.confidence !== 'verified') issue(['sources', path], 'Live sites require every source to be "verified" by the client');
      }
      if (services.some((s) => s.generic)) {
        issue([ownExtension, 'services'], 'Live sites cannot show generic services; confirm them with the client');
      }
    }
  });

export type Site = z.output<typeof siteSchema>;

type WithServices = Pick<Site, 'category' | 'automotive' | 'foodBeverage' | 'health'>;
const hasServices = (ext: ExtensionKey): ext is 'automotive' | 'foodBeverage' | 'health' =>
  ext === 'automotive' || ext === 'foodBeverage' || ext === 'health';

/** The service list of the site's own category extension. */
export function siteServices(site: WithServices) {
  const ext = EXTENSION_FOR_CATEGORY[site.category];
  return (hasServices(ext) ? site[ext]?.services : undefined) ?? [];
}

/** The booking CTA of the site's own category extension. */
export function siteBooking(site: WithServices) {
  const ext = EXTENSION_FOR_CATEGORY[site.category];
  return hasServices(ext) ? site[ext]?.booking : undefined;
}

export type ParseResult = { ok: true; site: Site } | { ok: false; error: string };

export function parseSite(input: unknown): ParseResult {
  const result = siteSchema.safeParse(input);
  return result.success ? { ok: true, site: result.data } : { ok: false, error: z.prettifyError(result.error) };
}
