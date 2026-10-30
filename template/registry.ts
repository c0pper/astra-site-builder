// Single source of truth for categories and sub-types. See docs/DESIGN.md › Taxonomy.
// Adding a sub-type: add an entry here, a pack in template/assets/packs/<id>/, and (for a new
// category) a preset in template/presets/<category>/. `pnpm check:registry` reports what is missing.

export const SECTION_IDS = [
  // shared
  'hero',
  'about',
  'services',
  'hours',
  'reviews',
  'gallery',
  'contact',
  'map',
  // automotive
  'brands',
  'seasonal-banner',
  'booking',
  // food & beverage
  'products',
  'menu',
  // fitness
  'schedule',
  'plans',
  // trades
  'service-area',
  'emergency',
  'quote',
  // health
  'areas',
  'credentials',
  // retail (any category)
  'retail-categories',
  'retail-brands',
] as const;
export type SectionId = (typeof SECTION_IDS)[number];

export const CATEGORY_IDS = ['automotive', 'food-beverage', 'fitness', 'trades', 'health'] as const;
export type CategoryId = (typeof CATEGORY_IDS)[number];

export interface Category {
  label: string;
  /** Default section order for sites in this category. Sections with no data are hidden. */
  defaultSections: SectionId[];
  /** Whether sub-types may show generic, unsourced service lists (flagged in REVIEW.md). */
  allowsGenericServices: boolean;
  /**
   * Whether the site may show a rating. Health professions may advertise only informative content, with nothing
   * promotional or suggestive (L. 145/2018, art. 1 c. 525), so their sites show no ratings or reviews.
   */
  allowsRatings: boolean;
}

export const CATEGORIES: Record<CategoryId, Category> = {
  automotive: {
    label: 'Automotive',
    defaultSections: ['hero', 'services', 'brands', 'booking', 'about', 'reviews', 'gallery', 'hours', 'contact', 'map'],
    allowsGenericServices: true,
    allowsRatings: true,
  },
  'food-beverage': {
    label: 'Food & Beverage',
    defaultSections: ['hero', 'products', 'menu', 'services', 'booking', 'about', 'reviews', 'gallery', 'hours', 'contact', 'map'],
    allowsGenericServices: false,
    allowsRatings: true,
  },
  fitness: {
    label: 'Fitness & Sports',
    defaultSections: ['hero', 'about', 'schedule', 'plans', 'reviews', 'gallery', 'hours', 'contact', 'map'],
    allowsGenericServices: false,
    allowsRatings: true,
  },
  trades: {
    label: 'Trades & Construction',
    defaultSections: ['hero', 'services', 'emergency', 'service-area', 'quote', 'about', 'reviews', 'gallery', 'hours', 'contact', 'map'],
    allowsGenericServices: true,
    allowsRatings: true,
  },
  health: {
    label: 'Salute',
    defaultSections: ['hero', 'about', 'services', 'areas', 'credentials', 'booking', 'contact', 'hours', 'map'],
    allowsGenericServices: false,
    allowsRatings: false,
  },
};

export const SUBTYPE_IDS = [
  'tyre-shop',
  'auto-repair',
  'body-shop',
  'auto-electrician',
  'bakery',
  'pastry-shop',
  'restaurant',
  'gym',
  'plumber',
  'electrician',
  'painter',
  'locksmith-metalwork',
  'upholsterer',
  'builder',
  'psychologist',
] as const;
export type SubtypeId = (typeof SUBTYPE_IDS)[number];

export interface Subtype {
  category: CategoryId;
  /** schema.org LocalBusiness subtype used in JSON-LD. */
  schemaType: string;
  /** Visitor-facing label (Italian). */
  label: string;
  /** Extra sections inserted after `hero` on top of the category defaults. */
  extraSections?: SectionId[];
  /** Services the sub-type certainly implies; usable unsourced as `generic: true`. Italian. */
  genericServices?: string[];
}

export const SUBTYPES: Record<SubtypeId, Subtype> = {
  'tyre-shop': {
    category: 'automotive',
    schemaType: 'TireShop',
    label: 'Gommista',
    extraSections: ['seasonal-banner'],
    genericServices: ['Vendita pneumatici', 'Cambio gomme stagionale', 'Equilibratura', 'Riparazione forature', 'Convergenza', 'Controllo pressione e usura'],
  },
  'auto-repair': {
    category: 'automotive',
    schemaType: 'AutoRepair',
    label: 'Officina meccanica',
    genericServices: ['Tagliando', 'Diagnosi elettronica', 'Freni', 'Manutenzione ordinaria', 'Cambio olio e filtri', 'Ricarica climatizzatore'],
  },
  'auto-electrician': {
    category: 'automotive',
    schemaType: 'AutoRepair',
    label: 'Elettrauto',
    genericServices: ['Diagnosi elettronica', 'Batterie', 'Impianto elettrico', 'Alternatori e motorini di avviamento', 'Luci e fari', 'Ricarica climatizzatore'],
  },
  'body-shop': {
    category: 'automotive',
    schemaType: 'AutoBodyShop',
    label: 'Carrozzeria',
    genericServices: ['Riparazione carrozzeria', 'Verniciatura', 'Riparazione ammaccature'],
  },
  bakery: { category: 'food-beverage', schemaType: 'Bakery', label: 'Panificio' },
  'pastry-shop': { category: 'food-beverage', schemaType: 'Bakery', label: 'Pasticceria' },
  restaurant: { category: 'food-beverage', schemaType: 'Restaurant', label: 'Ristorante' },
  gym: { category: 'fitness', schemaType: 'ExerciseGym', label: 'Palestra' },
  plumber: {
    category: 'trades',
    schemaType: 'Plumber',
    label: 'Idraulico',
    genericServices: ['Riparazione perdite', 'Installazione sanitari', 'Impianti idraulici', 'Disostruzione scarichi'],
  },
  electrician: {
    category: 'trades',
    schemaType: 'Electrician',
    label: 'Elettricista',
    genericServices: ['Impianti elettrici', 'Riparazione guasti', 'Quadri elettrici', 'Illuminazione'],
  },
  painter: {
    category: 'trades',
    schemaType: 'HousePainter',
    label: 'Imbianchino',
    genericServices: ['Tinteggiatura interni', 'Tinteggiatura esterni', 'Stuccatura'],
  },
  'locksmith-metalwork': {
    category: 'trades',
    schemaType: 'Locksmith',
    label: 'Fabbro',
    genericServices: ['Sostituzione serrature', 'Apertura porte', 'Lavori in ferro su misura'],
  },
  upholsterer: {
    category: 'trades',
    schemaType: 'HomeAndConstructionBusiness',
    label: 'Tappezziere',
    genericServices: ['Rifacimento divani e poltrone', 'Rivestimento sedie'],
  },
  builder: {
    category: 'trades',
    schemaType: 'GeneralContractor',
    label: 'Impresa edile',
    genericServices: ['Ristrutturazioni', 'Opere murarie', 'Nuove costruzioni'],
  },
  // schema.org has no psychologist type; MedicalBusiness is the closest that isn't a physician.
  psychologist: { category: 'health', schemaType: 'MedicalBusiness', label: 'Psicologo' },
};

/** Section order for a site: category defaults, with the primary sub-type's extras after the hero. */
export function defaultSections(subtype: SubtypeId): SectionId[] {
  const { category, extraSections = [] } = SUBTYPES[subtype];
  const [hero, ...rest] = CATEGORIES[category].defaultSections;
  return [hero, ...extraSections, ...rest];
}
