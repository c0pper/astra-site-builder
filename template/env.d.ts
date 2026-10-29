declare module 'virtual:site-images' {
  import type { PackImage } from './lib/images.ts';
  export const hero: PackImage | undefined;
  export const about: PackImage | undefined;
  export const gallery: PackImage[];
}
