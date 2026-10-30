import assert from 'node:assert/strict';
import { test } from 'node:test';
import { openStatus, romeNow, type RomeNow } from './hours.ts';

const weekdays = { open: '08:30', close: '12:30' };
const afternoon = { open: '15:00', close: '19:00' };
const HOURS = {
  mon: [weekdays, afternoon],
  tue: [weekdays, afternoon],
  wed: [weekdays, afternoon],
  thu: [weekdays, afternoon],
  fri: [weekdays, afternoon],
  sat: [{ open: '08:30', close: '13:00' }],
  sun: [],
};

// 2026-07-01 is a Wednesday.
const at = (date: string, weekday: number, time: string): RomeNow => ({
  date,
  weekday,
  minutes: Number(time.slice(0, 2)) * 60 + Number(time.slice(3)),
});
const status = (now: RomeNow, hours: object = HOURS, closures: { from: string; to: string }[] = []) =>
  openStatus(hours, closures, now)?.text ?? null;

test('romeNow reads the wall clock in Rome, not UTC', () => {
  assert.deepEqual(romeNow(new Date('2026-07-01T10:00:00Z')), { date: '2026-07-01', weekday: 2, minutes: 12 * 60 });
  // Winter time (UTC+1), and a UTC evening that is already the next day in Rome.
  assert.deepEqual(romeNow(new Date('2026-12-31T23:30:00Z')), { date: '2027-01-01', weekday: 4, minutes: 30 });
});

test('open: says when it closes', () => {
  assert.equal(status(at('2026-07-01', 2, '10:00')), 'Aperto ora · chiude alle 12:30');
});

test('lunch break: opens again later today', () => {
  assert.equal(status(at('2026-07-01', 2, '13:00')), 'Chiuso · apre alle 15:00');
});

test('evening: opens tomorrow', () => {
  assert.equal(status(at('2026-07-01', 2, '20:00')), 'Chiuso · apre domani alle 8:30');
});

test('Saturday afternoon: skips the closed Sunday', () => {
  assert.equal(status(at('2026-07-04', 5, '15:00')), 'Chiuso · apre lunedì alle 8:30');
});

test('unknown today: no status rather than a guess', () => {
  assert.equal(status(at('2026-07-05', 6, '10:00'), { mon: [weekdays] }), null);
});

test('unknown days ahead: promises nothing past them', () => {
  assert.equal(status(at('2026-07-01', 2, '20:00'), { wed: [weekdays] }), 'Chiuso ora');
});

test('seasonal closure today, and closure days skipped when looking ahead', () => {
  const ferie = [{ from: '2026-08-10', to: '2026-08-23' }];
  assert.equal(status(at('2026-08-12', 2, '10:00'), HOURS, ferie), 'Chiuso fino al 23 agosto 2026');
  const mondayOff = [{ from: '2026-07-06', to: '2026-07-06' }];
  assert.equal(status(at('2026-07-04', 5, '15:00'), HOURS, mondayOff), 'Chiuso · apre martedì alle 8:30');
});

test('interval past midnight', () => {
  const late = { fri: [{ open: '18:00', close: '02:00' }], sat: [] };
  assert.equal(status(at('2026-07-03', 4, '23:00'), late), 'Aperto ora · chiude domani alle 2:00');
  assert.equal(status(at('2026-07-04', 5, '01:00'), late), 'Aperto ora · chiude alle 2:00');
});

test('always open', () => {
  const allDay = [{ open: '00:00', close: '23:59' }];
  const h = { mon: allDay, tue: allDay, wed: allDay, thu: allDay, fri: allDay, sat: allDay, sun: allDay };
  assert.equal(status(at('2026-07-01', 2, '03:00'), h), 'Aperto ora · 24 ore su 24');
});
