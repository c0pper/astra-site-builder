import type { Preset } from '../../lib/theme.ts';

// Calm, quiet palettes for health practices. Every primary has ≥ 4.5:1 contrast on white so it can double as link/heading colour.
export const health: Preset = {
  palettes: [
    { id: 'salvia', primary: '#3f5f4a', accent: '#c8a27a', surface: '#ffffff', surfaceAlt: '#f4f6f2', text: '#1b211d', muted: '#4f5a52' },
    { id: 'petrolio', primary: '#1f5a66', accent: '#e0b872', surface: '#ffffff', surfaceAlt: '#f1f6f7', text: '#132226', muted: '#4a5a5e' },
    { id: 'lavanda', primary: '#4c4a7a', accent: '#d9a5a0', surface: '#ffffff', surfaceAlt: '#f6f5fa', text: '#1c1b2b', muted: '#55546a' },
    { id: 'terra', primary: '#7a4a32', accent: '#a8b89a', surface: '#ffffff', surfaceAlt: '#faf6f1', text: '#221a16', muted: '#5c514a' },
    { id: 'notte', primary: '#2b3a55', accent: '#e6c9a8', surface: '#ffffff', surfaceAlt: '#f4f5f8', text: '#161b26', muted: '#4b5363' },
  ],
  fonts: [
    { id: 'lora-inter', heading: "'Lora Variable', serif", body: "'Inter Variable', system-ui, sans-serif" },
    { id: 'playfair-inter', heading: "'Playfair Display Variable', serif", body: "'Inter Variable', system-ui, sans-serif" },
    { id: 'montserrat', heading: "'Montserrat Variable', system-ui, sans-serif", body: "'Montserrat Variable', system-ui, sans-serif" },
  ],
};
