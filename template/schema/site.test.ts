import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseSite } from './site.ts';

const fixture = (name: string) =>
  JSON.parse(readFileSync(new URL(`../../sites/_fixtures/${name}/site.json`, import.meta.url), 'utf8'));

function expectError(input: unknown, fragment: string) {
  const result = parseSite(input);
  assert.equal(result.ok, false, 'expected validation to fail');
  if (!result.ok) assert.match(result.error, new RegExp(fragment));
}

describe('site.json schema', () => {
  it('accepts the fixtures', () => {
    for (const name of ['empty', 'tyre-shop', 'restaurant']) {
      const result = parseSite(fixture(name));
      assert.ok(result.ok, result.ok ? '' : result.error);
    }
  });

  it('requires a source for every fact', () => {
    const site = fixture('tyre-shop');
    delete site.sources['business.phone'];
    expectError(site, 'Missing source for "business.phone"');
  });

  it('rejects sources that point at no fact', () => {
    const site = fixture('tyre-shop');
    delete site.business.phone;
    expectError(site, 'Source "business.phone" does not match any fact');
  });

  it('requires a URL unless the client verified the fact', () => {
    const site = fixture('tyre-shop');
    site.sources['business.phone'].urls = [];
    expectError(site, 'at least one URL');
    site.sources['business.phone'].confidence = 'verified';
    assert.ok(parseSite(site).ok);
  });

  it('rejects a subtype from another category', () => {
    expectError({ ...fixture('empty'), subtype: 'bakery' }, 'belongs to category "food-beverage"');
  });

  it('rejects an extension from another category', () => {
    expectError({ ...fixture('empty'), trades: {} }, 'Extension "trades" does not belong');
  });

  it('accepts only registry generic services for the site subtypes', () => {
    const site = fixture('tyre-shop');
    site.automotive.services.push({ name: 'Centro autorizzato Michelin', generic: true });
    expectError(site, 'not a registry generic service');
  });

  it('requires a source for non-generic services', () => {
    const site = fixture('tyre-shop');
    site.automotive.services.push({ name: 'Assetto sportivo' });
    expectError(site, 'Missing source for "automotive.services"');
  });

  it('rejects generic services where the category has none', () => {
    const site = fixture('restaurant');
    site.foodBeverage.services.push({ name: 'Asporto', generic: true });
    expectError(site, 'Category "food-beverage" does not allow generic services');
  });

  it('requires a source for specialities', () => {
    const site = fixture('restaurant');
    delete site.sources['foodBeverage.specialities'];
    expectError(site, 'Missing source for "foodBeverage.specialities"');
  });

  it('requires previewExpires on spec sites', () => {
    const site = fixture('empty');
    delete site.previewExpires;
    expectError(site, 'previewExpires');
  });

  describe('live gate', () => {
    const live = () => {
      const site = fixture('empty');
      site.status = 'live';
      site.business.legalName = 'Sito di prova S.r.l.';
      site.business.vatNumber = '01234567890';
      site.business.email = 'info@example.com';
      for (const key of ['legalName', 'vatNumber', 'email']) {
        site.sources[`business.${key}`] = { retrieved: '2026-10-29', confidence: 'verified' };
      }
      for (const s of Object.values(site.sources) as { confidence: string }[]) s.confidence = 'verified';
      return site;
    };

    it('accepts a complete live site', () => {
      const result = parseSite(live());
      assert.ok(result.ok, result.ok ? '' : result.error);
    });

    it('requires P.IVA', () => {
      const site = live();
      delete site.business.vatNumber;
      delete site.sources['business.vatNumber'];
      expectError(site, 'Live sites require business.vatNumber');
    });

    it('requires every source to be verified', () => {
      const site = live();
      site.sources['business.name'].confidence = 'high';
      expectError(site, 'verified');
    });

    it('rejects generic services', () => {
      const site = live();
      site.automotive = { services: [{ name: 'Tagliando', generic: true }] };
      expectError(site, 'cannot show generic services');
    });
  });
});
