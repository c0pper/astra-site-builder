// The business's pages on other platforms (socials, review, booking and quote sites), as icon links.
// Brand glyphs come from simple-icons; platforms it lacks get a plain generic glyph instead of a copied logo.
import {
  siDeliveroo,
  siFacebook,
  siGlovo,
  siHouzz,
  siInstagram,
  siJusteat,
  siTiktok,
  siTripadvisor,
  siUbereats,
  siYoutube,
} from 'simple-icons';
import { SOCIAL_HOSTS, onHost, type Site, type SocialPlatform } from '../schema/site.ts';

type Business = Site['business'];

const FORK = 'M8.25 2h1.5v6h1.5V2h1.5v6h1.5V2h1.5v7a3.75 3.75 0 0 1-3 3.67V22h-1.5V12.67a3.75 3.75 0 0 1-3-3.67z';
const CROSS = 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z';
const BRIEFCASE =
  'M9 3h6a2 2 0 0 1 2 2v2h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3V5a2 2 0 0 1 2-2zm0 4h6V5H9z';
const HAMMER = 'M3 3h12l4 3v2h-4v13h-4V8H3z';
const LINK =
  'M14 3h7v7h-2V6.41l-8.29 8.3-1.42-1.42L17.59 5H14zM5 5h6v2H5v12h12v-6h2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z';

/** Footer label and icon per platform; footer order follows `SOCIAL_HOSTS`. */
const PLATFORMS: Record<SocialPlatform, { label: string; icon: string }> = {
  facebook: { label: 'Facebook', icon: siFacebook.path },
  instagram: { label: 'Instagram', icon: siInstagram.path },
  tiktok: { label: 'TikTok', icon: siTiktok.path },
  youtube: { label: 'YouTube', icon: siYoutube.path },
  linkedin: { label: 'LinkedIn', icon: BRIEFCASE },
  tripadvisor: { label: 'Tripadvisor', icon: siTripadvisor.path },
  thefork: { label: 'TheFork', icon: FORK },
  deliveroo: { label: 'Deliveroo', icon: siDeliveroo.path },
  glovo: { label: 'Glovo', icon: siGlovo.path },
  justeat: { label: 'Just Eat', icon: siJusteat.path },
  ubereats: { label: 'Uber Eats', icon: siUbereats.path },
  prontopro: { label: 'ProntoPro', icon: HAMMER },
  instapro: { label: 'Instapro', icon: HAMMER },
  houzz: { label: 'Houzz', icon: siHouzz.path },
  miodottore: { label: 'MioDottore', icon: CROSS },
  idoctors: { label: 'iDoctors', icon: CROSS },
  doctolib: { label: 'Doctolib', icon: CROSS },
};

export interface ProfileLink {
  label: string;
  url: string;
  /** SVG path data on a 24×24 viewBox. */
  icon: string;
}

/** Every profile in `business.socials`, plus the directory profile unless it repeats one of them. */
export function profileLinks(b: Business): ProfileLink[] {
  const links = (Object.keys(SOCIAL_HOSTS) as SocialPlatform[]).flatMap((key) => {
    const url = b.socials?.[key];
    return url ? [{ ...PLATFORMS[key], url }] : [];
  });
  const dir = b.directory;
  if (dir && !links.some((l) => l.url === dir.url)) {
    const key = (Object.keys(SOCIAL_HOSTS) as SocialPlatform[]).find((k) => onHost(dir.url, SOCIAL_HOSTS[k]));
    links.push({ label: dir.name, url: dir.url, icon: key ? PLATFORMS[key].icon : LINK });
  }
  return links;
}
