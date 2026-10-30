import type { Preset } from '../../lib/theme.ts';

// Warm, food-friendly palettes. Every primary has ≥ 4.5:1 contrast on white so it can double as link/heading colour.
export const foodBeverage: Preset = {
  palettes: [
    { id: 'terracotta', primary: '#9a3412', accent: '#d97706', surface: '#ffffff', surfaceAlt: '#fdf6ec', text: '#1c1917', muted: '#57534e' },
    { id: 'bordeaux', primary: '#881337', accent: '#d4a373', surface: '#ffffff', surfaceAlt: '#fbf5f0', text: '#1c1917', muted: '#57534e' },
    { id: 'verde-oliva', primary: '#3f6212', accent: '#b45309', surface: '#ffffff', surfaceAlt: '#f7f7ee', text: '#1a1c16', muted: '#525a47' },
    { id: 'blu-golfo', primary: '#1e3a8a', accent: '#e9b949', surface: '#ffffff', surfaceAlt: '#f5f3ee', text: '#0f172a', muted: '#4b5563' },
    { id: 'nero-oro', primary: '#1c1917', accent: '#c9a227', surface: '#ffffff', surfaceAlt: '#f6f4ef', text: '#1c1917', muted: '#57534e' },
  ],
  fonts: [
    { id: 'playfair-inter', heading: "'Playfair Display Variable', serif", body: "'Inter Variable', system-ui, sans-serif" },
    { id: 'lora', heading: "'Lora Variable', serif", body: "'Lora Variable', Georgia, serif" },
    { id: 'playfair-montserrat', heading: "'Playfair Display Variable', serif", body: "'Montserrat Variable', system-ui, sans-serif" },
  ],
};
