import type { Preset } from '../../lib/theme.ts';

// Every primary has ≥ 4.5:1 contrast on white so it can double as link/heading colour.
export const automotive: Preset = {
  palettes: [
    { id: 'blu-officina', primary: '#1d4ed8', accent: '#f59e0b', surface: '#ffffff', surfaceAlt: '#f1f5f9', text: '#0f172a', muted: '#475569' },
    { id: 'rosso-corsa', primary: '#b91c1c', accent: '#1f2937', surface: '#ffffff', surfaceAlt: '#f5f5f4', text: '#1c1917', muted: '#57534e' },
    { id: 'antracite-giallo', primary: '#18181b', accent: '#facc15', surface: '#ffffff', surfaceAlt: '#f4f4f5', text: '#18181b', muted: '#52525b' },
    { id: 'verde-box', primary: '#15803d', accent: '#0f172a', surface: '#ffffff', surfaceAlt: '#f0fdf4', text: '#0f172a', muted: '#475569' },
    { id: 'arancio-pista', primary: '#c2410c', accent: '#1e293b', surface: '#ffffff', surfaceAlt: '#fff7ed', text: '#1c1917', muted: '#57534e' },
  ],
  fonts: [
    { id: 'oswald-inter', heading: "'Oswald Variable', sans-serif", body: "'Inter Variable', system-ui, sans-serif" },
    { id: 'archivo', heading: "'Archivo Variable', sans-serif", body: "'Archivo Variable', system-ui, sans-serif" },
    { id: 'montserrat-inter', heading: "'Montserrat Variable', sans-serif", body: "'Inter Variable', system-ui, sans-serif" },
  ],
};
