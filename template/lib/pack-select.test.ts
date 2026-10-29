import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseSite, type Site } from '../schema/site.ts';
import { selectPackImages, type PackEntry } from './pack-select.ts';

const entry = (file: string, roles?: PackEntry['roles']): PackEntry => ({
  file,
  alt: file,
  author: 'a',
  source: 'Wikimedia Commons',
  sourceUrl: 'https://example.com',
  licence: 'CC0',
  roles,
});

const g = (file: string) => entry(file, ['gallery']);
const packs = {
  'tyre-shop': [entry('t-hero.jpg', ['hero']), entry('t-about.jpg', ['about']), g('t1.jpg'), g('t2.jpg')],
  'auto-repair': [entry('a-hero.jpg', ['hero']), entry('a-about.jpg', ['about']), g('a1.jpg'), g('a2.jpg'), g('a3.jpg')],
};

function site(overrides: Record<string, unknown> = {}): Site {
  const result = parseSite({
    status: 'spec',
    previewExpires: '2027-01-27',
    category: 'automotive',
    subtype: 'tyre-shop',
    secondarySubtypes: ['auto-repair'],
    business: { name: 'X', address: { street: 'Via 1', postalCode: '80100', city: 'Napoli', province: 'NA' } },
    sources: {
      'business.name': { urls: ['https://example.com'], retrieved: '2026-10-29', confidence: 'high' },
      'business.address': { urls: ['https://example.com'], retrieved: '2026-10-29', confidence: 'high' },
    },
    ...overrides,
  });
  if (!result.ok) throw new Error(result.error);
  return result.site;
}

const opts = { heroShowsImage: true, hasClientPhotos: false };

describe('selectPackImages', () => {
  it('fills hero and about from the primary sub-type before secondary packs', () => {
    const s = selectPackImages('slug', site(), packs, opts);
    assert.equal(s.hero?.subtype, 'tyre-shop');
    assert.equal(s.about?.subtype, 'tyre-shop');
  });

  it('falls back to a secondary pack when the primary has no suitable photo', () => {
    const s = selectPackImages('slug', site(), { ...packs, 'tyre-shop': [entry('t1.jpg', ['gallery'])] }, opts);
    assert.equal(s.hero?.subtype, 'auto-repair');
  });

  it('picks no hero photo when the hero layout shows none', () => {
    assert.equal(selectPackImages('slug', site(), packs, { ...opts, heroShowsImage: false }).hero, undefined);
  });

  it('builds a stock gallery of up to 6, primary first, never repeating hero/about', () => {
    const s = selectPackImages('slug', site(), packs, opts);
    // 5 gallery-eligible photos in the fixture: hero-only/about-only entries are excluded by their roles.
    assert.equal(s.gallery.length, 5);
    const big = { ...packs, 'auto-repair': [...packs['auto-repair'], g('a4.jpg'), g('a5.jpg')] };
    assert.equal(selectPackImages('slug', site(), big, opts).gallery.length, 6);
    assert.deepEqual(
      s.gallery.slice(0, 2).map((i) => i.subtype),
      ['tyre-shop', 'tyre-shop'],
    );
    const files = s.gallery.map((i) => `${i.subtype}/${i.file}`);
    assert.ok(!files.includes(`${s.hero!.subtype}/${s.hero!.file}`));
    assert.ok(!files.includes(`${s.about!.subtype}/${s.about!.file}`));
  });

  it('shows no stock gallery on live sites or when the client has photos', () => {
    const live = site({
      status: 'live',
      business: {
        name: 'X',
        legalName: 'X S.r.l.',
        vatNumber: '01234567890',
        email: 'a@example.com',
        address: { street: 'Via 1', postalCode: '80100', city: 'Napoli', province: 'NA' },
      },
      sources: Object.fromEntries(
        ['name', 'legalName', 'vatNumber', 'email', 'address'].map((k) => [
          `business.${k}`,
          { retrieved: '2026-10-29', confidence: 'verified' },
        ]),
      ),
    });
    assert.deepEqual(selectPackImages('slug', live, packs, opts).gallery, []);
    assert.deepEqual(selectPackImages('slug', site(), packs, { ...opts, hasClientPhotos: true }).gallery, []);
  });

  it('is deterministic per slug and varies between slugs', () => {
    const a = selectPackImages('gommista-a', site(), packs, opts);
    assert.deepEqual(selectPackImages('gommista-a', site(), packs, opts), a);
    const galleries = new Set(
      ['b', 'c', 'd', 'e', 'f'].map((s) => selectPackImages(s, site(), packs, opts).gallery.map((i) => i.file).join()),
    );
    assert.ok(galleries.size > 1);
  });
});
