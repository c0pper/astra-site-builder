// schema.org LocalBusiness JSON-LD, generated from site.json.
// Ratings are left out on purpose: Google treats LocalBusiness ratings shown on the business's own site as self-serving.
import { SUBTYPES } from '../registry.ts';
import type { Site } from '../schema/site.ts';

const DAY_NAMES = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
} as const;

export function localBusinessJsonLd(site: Site, url?: string): Record<string, unknown> {
  const { business: b } = site;
  const sameAs = [b.socials?.facebook, b.socials?.instagram, b.googleMapsUrl].filter(Boolean);

  const openingHoursSpecification = b.hours
    ? Object.entries(b.hours).flatMap(([day, intervals]) =>
        (intervals ?? []).map((i) => ({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: DAY_NAMES[day as keyof typeof DAY_NAMES],
          opens: i.open,
          closes: i.close,
        })),
      )
    : undefined;

  return prune({
    '@context': 'https://schema.org',
    '@type': SUBTYPES[site.subtype].schemaType,
    name: b.name,
    legalName: b.legalName,
    vatID: b.vatNumber ? `IT${b.vatNumber}` : undefined,
    url,
    telephone: b.phone,
    email: b.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: b.address.street,
      postalCode: b.address.postalCode,
      addressLocality: b.address.city,
      addressRegion: b.address.province,
      addressCountry: 'IT',
    },
    geo: b.geo && !b.geo.approximate ? { '@type': 'GeoCoordinates', latitude: b.geo.lat, longitude: b.geo.lng } : undefined,
    openingHoursSpecification: openingHoursSpecification?.length ? openingHoursSpecification : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
  });
}

function prune(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}
