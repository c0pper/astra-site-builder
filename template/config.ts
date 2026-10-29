// Agency-wide settings. Open item in docs/PLAN.md: final agency name.
export const AGENCY = {
  /** Shown in the spec-site demo banner ("demo realizzata da …"). Empty = omitted. */
  name: '',
};

/**
 * Cloudflare Pages project that serves every spec preview at <subdomain>.pages.dev/<slug>/.
 * Renaming it means a new project and new links: settle it before preview links go to businesses.
 */
export const PREVIEWS_PROJECT = 'simone-martin-web-developer';
/** Where Cloudflare serves PREVIEWS_PROJECT (it adds a suffix when the plain name is taken). Used in REVIEW.md links. */
export const PREVIEWS_ORIGIN = 'https://simone-martin-web-developer.pages.dev';
