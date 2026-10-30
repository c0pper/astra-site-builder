// Lead lists (leads/*.csv) → batch rows for /batch-sites. Two formats are accepted:
// the lead-tool export (Business, Sector, Town, Address, Phone, Google Maps, …) and a plain name,comune,link sheet.

/** The lead tool's Sector column → registry sub-type. */
export const SECTOR_TO_SUBTYPE = {
  'Tyre shop': 'tyre-shop',
  'Auto repair': 'auto-repair',
  'Body shop': 'body-shop',
  Bakery: 'bakery',
  'Pastry shop': 'pastry-shop',
  Gym: 'gym',
  Plumber: 'plumber',
  Electrician: 'electrician',
  Painter: 'painter',
  'Locksmith/Metalwork': 'locksmith-metalwork',
  Upholsterer: 'upholsterer',
  Builder: 'builder',
};

/** The lead tool files car electricians under "Auto repair"; their Google category says which they are. */
function subtypeFor(sector, googleCategory) {
  if (sector === 'Auto repair' && /elettric|elettrauto/i.test(googleCategory)) return 'auto-electrician';
  return SECTOR_TO_SUBTYPE[sector];
}

/** RFC 4180 CSV: quoted fields, doubled quotes, CRLF. Returns one object per row, keyed by header. */
export function parseCsv(text) {
  const records = [];
  let record = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') field += text[++i];
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') (record.push(field), (field = ''));
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      record.push(field);
      if (record.some((f) => f !== '')) records.push(record);
      record = [];
      field = '';
    } else field += c;
  }
  record.push(field);
  if (record.some((f) => f !== '')) records.push(record);
  const [header = [], ...rows] = records;
  const keys = header.map((h) => h.replace(/^﻿/, '').trim());
  return rows.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? '').trim()])));
}

/** Digits without the +39 prefix (Italian numbers then start with 0 or 3): the key for "does this business already have a site". */
export function phoneKey(phone) {
  return String(phone ?? '').replace(/\D/g, '').replace(/^(00)?39(?=[03])/, '');
}

/** The lead tool copies Google's private-use icon glyphs (e.g. U+E934, %EE%A4%B4) into names and links. */
export function stripGlyphs(text) {
  return text.replace(/%EE%[89AB][0-9A-F]%[89AB][0-9A-F]\+?/gi, '').replace(/[-]\s*/g, '').trim();
}

/** A lead row in either format → the batch row the agents work from. */
export function toBatchRow(lead, index) {
  const name = stripGlyphs(lead.Business ?? lead.name ?? '');
  const town = lead.Town ?? lead.comune ?? '';
  const comune = town.replace(/\s*\((search area|[A-Z]{2})\)\s*$/i, '').trim();
  const sector = lead.Sector ?? '';
  return {
    id: String(index + 1).padStart(3, '0'),
    name,
    comune,
    searchArea: /\(search area\)/i.test(town),
    sector,
    subtype: subtypeFor(sector, lead['Google category'] ?? '') ?? lead.subtype ?? null,
    anchor: {
      address: lead.Address ?? '',
      phone: lead.Phone ?? '',
      googleMapsUrl: stripGlyphs(lead['Google Maps'] ?? lead.link ?? ''),
      googleCategory: lead['Google category'] ?? '',
      rating: lead.Rating ? Number(lead.Rating) : null,
      reviews: lead.Reviews ? Number(lead.Reviews) : null,
      webPresence: lead['Web presence'] ?? '',
      currentLink: lead['Current link'] ?? '',
    },
  };
}
