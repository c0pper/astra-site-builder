// "Aperto ora" status from the weekly hours. Runs in the browser (the page is static), so keep imports client-safe.
import type { Site } from '../schema/site.ts';
import { DAYS, formatDate } from './format.ts';

type Hours = NonNullable<Site['business']['hours']>;
type Closures = NonNullable<Site['business']['seasonalClosures']>;

export interface OpenStatus {
  open: boolean;
  text: string;
}

/** Wall-clock time in Rome: the business's time, whatever the visitor's timezone. */
export interface RomeNow {
  /** YYYY-MM-DD */
  date: string;
  /** 0 = Monday … 6 = Sunday, matching DAYS. */
  weekday: number;
  /** Minutes since midnight. */
  minutes: number;
}

const WEEKDAY_INDEX: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
const DAY = 24 * 60;

export function romeNow(at: Date = new Date()): RomeNow {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Rome',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    weekday: WEEKDAY_INDEX[parts.weekday],
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

/**
 * Open/closed text for the moment `now`, or null when today's hours are unknown (we never guess).
 * Days inside a seasonal closure count as closed. An interval whose close is not after its open runs past midnight.
 */
export function openStatus(hours: Hours, closures: Closures, now: RomeNow): OpenStatus | null {
  const closure = closures.find((c) => c.from <= now.date && now.date <= c.to);
  if (closure) return { open: false, text: `Chiuso fino al ${formatDate(closure.to)}` };

  const dayAt = (offset: number) => {
    const [key, label] = DAYS[(((now.weekday + offset) % 7) + 7) % 7];
    const date = addDays(now.date, offset);
    const closed = closures.some((c) => c.from <= date && date <= c.to);
    return { label, intervals: closed ? [] : hours[key] };
  };
  if (!dayAt(0).intervals) return null;

  // Opening windows in minutes from today's midnight, from yesterday (late-night spill-over) to a week ahead.
  // `unknownFrom` marks the first future day without data: nothing is promised past it.
  const windows: { start: number; end: number }[] = [];
  let unknownFrom = Infinity;
  for (let offset = -1; offset <= 7; offset++) {
    const { intervals } = dayAt(offset);
    if (!intervals) {
      if (offset > 0) {
        unknownFrom = offset * DAY;
        break;
      }
      continue;
    }
    for (const { open, close } of intervals) {
      const start = offset * DAY + toMinutes(open);
      let end = offset * DAY + toMinutes(close);
      if (end <= start) end += DAY;
      windows.push({ start, end });
    }
  }
  windows.sort((a, b) => a.start - b.start);

  const t = now.minutes;
  const current = windows.find((w) => w.start <= t && t < w.end);
  if (current) {
    // Back-to-back windows (e.g. 00:00–23:59 every day) read as one stretch.
    let end = current.end;
    for (const w of windows) if (w.start > current.start && w.start <= end + 1) end = Math.max(end, w.end);
    if (end >= unknownFrom) return { open: true, text: 'Aperto ora' };
    if (end - t >= 6 * DAY) return { open: true, text: 'Aperto ora · 24 ore su 24' };
    return { open: true, text: `Aperto ora · chiude ${when(end, dayAt)}` };
  }

  const next = windows.find((w) => w.start > t);
  if (!next || next.start >= unknownFrom) return { open: false, text: 'Chiuso ora' };
  return { open: false, text: `Chiuso · apre ${when(next.start, dayAt)}` };
}

function when(minutes: number, dayAt: (offset: number) => { label: string }): string {
  const offset = Math.floor(minutes / DAY);
  if (minutes === offset * DAY && offset === 1) return 'a mezzanotte';
  const time = fromMinutes(minutes - offset * DAY);
  if (offset === 0) return `alle ${time}`;
  if (offset === 1) return `domani alle ${time}`;
  return `${dayAt(offset).label.toLowerCase()} alle ${time}`;
}

const toMinutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
const fromMinutes = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
