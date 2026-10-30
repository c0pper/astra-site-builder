import type { Site } from '../schema/site.ts';

type Business = Site['business'];

/** Italian numbers without a country code get +39. */
function international(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  return digits.startsWith('+') ? digits : `+39${digits}`;
}

export const telHref = (phone: string) => `tel:${international(phone)}`;

export const whatsappHref = (phone: string, text?: string) =>
  `https://wa.me/${international(phone).slice(1)}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

export const formatAddress = (a: Business['address']) => `${a.street}, ${a.postalCode} ${a.city} (${a.province})`;

export function directionsHref(b: Business): string {
  return (
    b.googleMapsUrl ??
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(formatAddress(b.address))}`
  );
}

export const DAYS = [
  ['mon', 'Lunedì'],
  ['tue', 'Martedì'],
  ['wed', 'Mercoledì'],
  ['thu', 'Giovedì'],
  ['fri', 'Venerdì'],
  ['sat', 'Sabato'],
  ['sun', 'Domenica'],
] as const;

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));

/** "inglese, francese e spagnolo" */
export const formatList = (items: string[]) => new Intl.ListFormat('it', { type: 'conjunction' }).format(items);

export const formatRating = (value: number) => value.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Internal link that respects Astro's `base` (spec previews live under /<slug>/). */
export function href(path = ''): string {
  return `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}${path.replace(/^\//, '')}`;
}
