import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseCsv, phoneKey, stripGlyphs, toBatchRow } from './leads.mjs';

test('parseCsv handles quoted commas, doubled quotes and CRLF', () => {
  const rows = parseCsv('﻿Business,Address\r\n"A, B","Via ""X"", 1"\r\nC,D\r\n');
  assert.deepEqual(rows, [
    { Business: 'A, B', Address: 'Via "X", 1' },
    { Business: 'C', Address: 'D' },
  ]);
});

test('stripGlyphs removes Google icon glyphs, raw and percent-encoded', () => {
  assert.equal(
    stripGlyphs('https://www.google.com/maps/search/?api=1&query=Salemme+%EE%A4%B4+Via+Pasolini'),
    'https://www.google.com/maps/search/?api=1&query=Salemme+Via+Pasolini',
  );
  assert.equal(stripGlyphs('Dell\'Aquila Angelo  Via Cesare'), "Dell'Aquila Angelo Via Cesare");
});

test('phoneKey compares landlines and mobiles with or without +39', () => {
  assert.equal(phoneKey('0823 327584'), phoneKey('0823327584'));
  assert.equal(phoneKey('+39 349 765 3449'), '3497653449');
  assert.equal(phoneKey('+39 081 866 2070'), phoneKey('0818662070'));
});

test('toBatchRow maps the lead-tool format', () => {
  const row = toBatchRow(
    {
      Business: 'Salemme Pneumatici',
      Sector: 'Tyre shop',
      Town: 'Caserta (search area)',
      Address: 'Via Pasolini, 17',
      Phone: '0823327584',
      Rating: '4.8',
      Reviews: '279',
      'Google Maps': 'https://maps/?q=Salemme+%EE%A4%B4+Via',
    },
    0,
  );
  assert.equal(row.id, '001');
  assert.equal(row.comune, 'Caserta');
  assert.equal(row.searchArea, true);
  assert.equal(row.subtype, 'tyre-shop');
  assert.equal(row.anchor.googleMapsUrl, 'https://maps/?q=Salemme+Via');
  assert.equal(row.anchor.rating, 4.8);
});

test('toBatchRow maps a plain name,comune,link sheet', () => {
  const row = toBatchRow({ name: 'Gomme Rossi', comune: 'Nola (NA)', link: 'https://x.it' }, 4);
  assert.equal(row.comune, 'Nola');
  assert.equal(row.subtype, null);
  assert.equal(row.anchor.googleMapsUrl, 'https://x.it');
});

test('toBatchRow files car electricians under auto-electrician by their Google category', () => {
  const row = toBatchRow({ Business: 'X', Sector: 'Auto repair', 'Google category': 'Servizio componenti elettrici per auto' }, 0);
  assert.equal(row.subtype, 'auto-electrician');
  assert.equal(toBatchRow({ Business: 'Y', Sector: 'Auto repair', 'Google category': 'Officina autoriparazioni' }, 1).subtype, 'auto-repair');
});
