// Live sites only: spec previews share one domain, so their crawler block is the preview project's root
// robots.txt plus the per-page noindex meta (and X-Robots-Tag header, PLAN step 6).
import type { APIRoute } from 'astro';
import { loadSite } from '../lib/site';

export const GET: APIRoute = () => {
  const { site } = loadSite();
  const body = site.status === 'live' ? 'User-agent: *\nAllow: /\n' : 'User-agent: *\nDisallow: /\n';
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
