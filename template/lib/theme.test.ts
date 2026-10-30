import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PRESETS } from '../presets/index.ts';
import { contrast, readableOn } from './theme.ts';

// WCAG AA for body text. Components print text at full strength on these pairs, so each pair must pass on its own.
const MIN = 4.5;

test('every preset palette keeps text readable on each of its backgrounds', () => {
  for (const [category, preset] of Object.entries(PRESETS)) {
    for (const p of preset.palettes) {
      const pairs = {
        'on-primary / primary': [readableOn(p.primary), p.primary],
        'on-accent / accent': [readableOn(p.accent), p.accent],
        'primary / surface': [p.primary, p.surface],
        'text / surface': [p.text, p.surface],
        'text / surface-alt': [p.text, p.surfaceAlt],
        'muted / surface': [p.muted, p.surface],
        'muted / surface-alt': [p.muted, p.surfaceAlt],
      };
      for (const [pair, [fg, bg]] of Object.entries(pairs)) {
        const ratio = contrast(fg, bg);
        assert.ok(ratio >= MIN, `${category}/${p.id} ${pair}: ${ratio.toFixed(2)} < ${MIN}`);
      }
    }
  }
});
