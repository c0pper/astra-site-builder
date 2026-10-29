import type { CategoryId } from '../registry.ts';
import type { Preset } from '../lib/theme.ts';
import { automotive } from './automotive/theme.ts';

/** Theme presets per category. A category without one cannot build yet. */
export const PRESETS: Partial<Record<CategoryId, Preset>> = {
  automotive,
};
