# Astro Site Builder

Monorepo that builds Italian websites for local businesses from one template. Read [docs/DESIGN.md](docs/DESIGN.md) before changing architecture, schema, or agent behaviour: it is the source of truth for every decision. [docs/PLAN.md](docs/PLAN.md) is the MVP build order.

## Content rules (every site)

- **Sourced facts only.** Copy states only facts present in `site.json` with a source entry. Anything unsourced (prices, years, certifications, brand partnerships, awards) stays out of the copy.
- **Italian first.** Every visitor-facing string is Italian; code identifiers are English.
- **The schema is the contract.** Site content lives in `sites/<slug>/site.json`. A failed build means the content is invalid: fix `site.json`, not the template.
- **Images come from the curated packs** in `template/assets/packs/<subtype>/`, or from client assets after promotion. Spec sites use the packs only.

## Working in the repo

- Every Astro command goes through `scripts/site.mjs`, which resolves the site folder: `pnpm build:site <slug>`, `pnpm dev <slug>`, `pnpm check <slug>`. Plain `astro build` fails on purpose (no `SITE_SLUG`).
- Slugs resolve to `sites/<slug>/`, then `sites/_fixtures/<slug>/`. Use `empty` as the smoke-test fixture.
- TypeScript is pinned to 6.x because `@astrojs/check` does not yet accept 7.
- Spec sites build with `base: /<slug>/`. Write internal links with `href()` from `template/lib/format.ts`, never as bare `/paths`.
- Before calling template work done, run `pnpm gate --live` plus `pnpm gate <slug>` for any spec site you touched. When a visual diff is intended, look at `dist/_visual/<slug>/*-diff.png` first and re-baseline with `pnpm visual <slug> --update` only for the changes you meant.
- Deploy spec previews with `pnpm deploy:preview <slug>` (needs a one-time `pnpm exec wrangler login`). Every deploy republishes all current previews, and a fixture stays up only until the next deploy that doesn't name it.
- Playwright drives the locally installed Chrome (`channel: 'chrome'`); no browser download is needed. Check a layout with `pnpm screenshot <url> <outDir>`, which also fails on horizontal overflow.
- `leads/` holds the user's prospect lists, which are inputs for batch mode.
