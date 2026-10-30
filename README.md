# Astro Site Builder

Builds Italian websites for local businesses (tyre shops, garages, and later bakeries, gyms, trades) from one shared Astro template.

The main use is **spec sites**: a preview built from public data and sent to a business before it has agreed to buy. The same pipeline also handles **live sites** for paying clients.

[docs/DESIGN.md](docs/DESIGN.md) is the source of truth for every decision, and [docs/PLAN.md](docs/PLAN.md) is the MVP build order. [CLAUDE.md](CLAUDE.md) holds the rules the agent follows.

## How it works

```
sites/<slug>/site.json  ──►  template/ (Astro)  ──►  dist/<slug>/  ──►  gate  ──►  Cloudflare Pages
   facts + sources            one template,          static site       Lighthouse     <project>.pages.dev/<slug>/
   (the only per-site input)  every site                               + visual diff
```

- **One template, many sites.** Every site is the same template rendered with a different `site.json`. A template fix reaches every site on its next build.
- **`site.json` is the contract.** A Zod schema ([template/schema/site.ts](template/schema/site.ts)) validates it. An invalid file fails the build, so a failed build means the content needs fixing, not the template.
- **Sourced facts only.** Every fact in `site.json` (phone, hours, brands, P.IVA…) needs an entry in `sources` with URLs, a retrieval date and a confidence level. Copy may only state sourced facts. Anything unsourced, such as prices, years, certifications or awards, stays off the site.
- **The look is picked from the slug.** Palette, font pairing and section layouts are picked deterministically from the slug, so each site looks different but stays stable from build to build. `site.json` can pin any of them.
- **Images come from curated packs** in `template/assets/packs/<subtype>/` (open-licence photos with `credits.json`). Spec sites never use the business's own photos. A stock gallery is always labelled "Immagini illustrative".
- **Spec and live.** Spec sites are served under `/<slug>/` of a shared previews project. They carry a "Anteprima" banner, use `noindex`, and expire after 90 days. Live sites get their own project and domain, and must pass a stricter validation: legal name, P.IVA and email present, every source `verified`, and no generic services.

### Who does what

| Task | Done by |
|---|---|
| Research a business and create its site | Agent: `/new-site "<name>" <comune> [link]` |
| Build many sites from a lead list | Agent: `/batch-sites <csv>` |
| Review the result before sending the link | You, using `sites/<slug>/REVIEW.md` |
| Edit content, preview, build, deploy, change the template | You or the agent, using the commands below |

## Repository layout

```
template/                  the Astro site (srcDir)
  components/              Header, Footer, MobileBar, OpenStatus, sections/*.astro
  layouts/Base.astro       page shell
  pages/                   index, crediti, privacy, robots.txt
  lib/                     theme picker, images, hours, JSON-LD, site loader
  schema/site.ts           the site.json contract (Zod)
  registry.ts              categories, sub-types, default sections
  presets/<category>/      palettes + fonts (theme.ts), copy tone (tone.md)
  assets/packs/<subtype>/  curated photos + credits.json
  config.ts                agency name, previews project
sites/<slug>/              one folder per real site
  site.json                content + sources
  notes.md                 agent's research notes
  REVIEW.md                generated checklist for a human (don't edit)
  assets/gallery/          client photos (live sites)
sites/_fixtures/           test sites: empty, live, retail, tyre-shop
tests/visual/<slug>/       screenshot baselines for live sites
scripts/                   every command below (site.mjs wraps Astro)
leads/                     prospect lists and batch outputs (gitignored)
dist/                      build output (gitignored)
```

## Setup

- **Node 23.6 or later** (tested on 26), which runs the `.ts` tests directly.
- **pnpm**.
- **Google Chrome**, installed normally. Playwright drives it, so there's no browser download.

Then:

```sh
pnpm install
pnpm exec wrangler login   # once per machine, only needed to deploy
```

## Running things manually

Every command takes a **slug**, the folder name under `sites/`. It resolves to `sites/<slug>/` first, then `sites/_fixtures/<slug>/`. Use `empty` as the quick smoke-test fixture.

Always go through the `pnpm` scripts. Plain `astro build` fails on purpose, because it doesn't know which site to build.

### Edit a site's content

Edit `sites/<slug>/site.json`, then check it:

```sh
pnpm validate <slug>       # schema + sources check, no build
pnpm review <slug>         # regenerate REVIEW.md (do this after every site.json change)
```

Common edits:

| To change | Edit in `site.json` |
|---|---|
| Phone, address, hours, closures | `business.*`, plus its entry in `sources` (`"business.phone"` …) |
| Headline, tagline, about text | `copy.headline`, `copy.tagline`, `copy.about` (state only sourced facts) |
| Page title / meta description | `seo.title`, `seo.description` |
| Which sections show, and their order | `sections`, e.g. `["hero", "services", "gallery", "hours", "contact", "map"]` (omit to use the registry defaults) |
| Colours | `theme.brandColors: { "primary": "#0b5394", "accent": "#f59e0b" }`, or pick a preset palette with `theme.palette` (ids in `template/presets/<category>/theme.ts`) |
| Fonts | `theme.fonts` (ids in the same file) |
| Section layout | `theme.variants`, e.g. `{ "hero": "overlay", "services": "list" }`. Hero options are `split`, `overlay`, `centered`; services options are `grid`, `list` |
| Preview expiry | `previewExpires` (`YYYY-MM-DD`) |
| Map pin | `pnpm geocode <slug>` fills `business.geo` from the address (`--force` to replace it) |

Sections without data are hidden automatically. For example, the gallery needs at least 3 photos, and reviews need a rating.

**Client photos** go in `sites/<slug>/assets/gallery/` (jpg, png, webp, avif). When present, they replace the stock gallery and its "illustrative" label. Per DESIGN.md, this happens only at promotion to a live site.

### Preview locally

Choose one of these:

```sh
pnpm dev <slug>            # dev server with hot reload for template edits
```

```sh
pnpm build:site <slug>     # production build into dist/<slug>/
pnpm preview:site <slug>   # serve that build
```

Spec sites are served under their slug, at `http://localhost:4321/<slug>/`. Live sites are served at `http://localhost:4321/`.

The dev server reads `site.json` once at startup, so restart it after editing that file. Template edits reload by themselves.

To take screenshots of a running site, run `pnpm screenshot <url> <outDir>`. It captures desktop and mobile full-page shots and fails if the page scrolls horizontally.

### Check

```sh
pnpm check <slug>          # TypeScript + Astro diagnostics
pnpm test                  # unit tests (theme contrast, image picking, hours, leads)
pnpm check:registry        # which sub-types are ready (image pack + tone + theme)
pnpm gate <slug...>        # build + Lighthouse mobile (Performance and Accessibility ≥ 95)
pnpm gate --live           # the same for every live site, plus a screenshot diff against tests/visual/
```

`pnpm lighthouse <slug>` and `pnpm visual <slug>` run the two halves of the gate separately, on an existing build.

### Deploy spec previews

```sh
pnpm deploy:preview <slug>       # rebuild this site, deploy it with all other current previews
pnpm deploy:preview --all        # rebuild and deploy every spec site (use after a template change)
```

Previews are served at `https://simone-martin-web-developer.pages.dev/<slug>/` (configured in [template/config.ts](template/config.ts)).

A Pages deploy replaces the whole site, so every deploy uploads all current previews:
- Without `--all`, sites you didn't name reuse their existing `dist/` build.
- Previews whose `previewExpires` date has passed are left out.
- Fixtures are included only when you name them, and they drop out at the next deploy that doesn't name them.
- Live sites can't be deployed this way.

### Change the template

1. Edit files under `template/`, then try the change with `pnpm dev <slug>` on a few sites. Choose sites with different hero layouts and with or without hours.
2. Run `pnpm check <slug>`, `pnpm test`, `pnpm gate --live`, and `pnpm gate <slug>` for one or two spec sites.
3. If `gate --live` reports a visual diff, open `dist/_visual/<slug>/*-diff.png`. Only if the change was intended, re-baseline with `pnpm visual <slug> --update`.
4. Run `pnpm deploy:preview --all` so every preview picks up the change.

### Image packs

```sh
pnpm optimize:pack <subtype>   # resize to ≤1600px, recompress, strip metadata (incl. GPS), in place
```

To add a photo, put it in `template/assets/packs/<subtype>/`. Then add its entry to that folder's `credits.json` (file, Italian alt text, author, source, licence), and run `optimize:pack`.

### Batch mode by hand

The `/batch-sites` agent normally runs these steps. The scripts also work on their own:

```sh
pnpm batch plan leads/<list>.csv [--sector "Tyre shop,Auto repair"] [--limit N]   # queue rows, print the batch folder
pnpm batch report leads/batches/<batch>                                          # write batch-report.csv
```

`pnpm scaffold <slug> <subtype> [secondary...]` creates an empty `sites/<slug>/` skeleton. Normally only the agent uses it.

## Not built yet

DESIGN.md describes these, but they don't exist yet:
- **`/promote-site`:** to promote a site to live, follow the four steps in [DESIGN.md › Promotion](docs/DESIGN.md#promotion-promote-site) by hand.
- **`/renew-preview`:** to renew a preview, edit `previewExpires` and redeploy.
- **`/add-subtype`:** add the registry entry, image pack and tone notes by hand.
- **Expired-preview archiving job:** expired previews are simply left out of the next deploy.
