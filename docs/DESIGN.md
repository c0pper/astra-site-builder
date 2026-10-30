# Astro Site Builder — Design

Status: agreed 2026-10-29. Change this document before changing any decision below.

## Purpose

Quickly build Italian-first websites for local businesses. Primary use: **spec/outreach sites** built from public data before the business has agreed to buy. Secondary use: commissioned builds through the same pipeline, with client-supplied content.

After launch the client edits nothing; all content changes are made by us.

## Stack

- Astro (current stable), TypeScript, Tailwind v4, pnpm
- Zod schema shared by the build and the agent
- Fonts self-hosted via Fontsource; images through `astro:assets` (AVIF/WebP, responsive)
- Playwright for screenshots
- Quality gate (`pnpm gate <slug…> | --live`): build, then Lighthouse mobile with Performance and Accessibility ≥ 95 **and** no failing critical accessibility audit (contrast, alt text, labels, link/button names, title, lang, viewport, heading order). Live sites also need a screenshot match against `tests/visual/<slug>/` (desktop + mobile, clock frozen, at most 50 changed pixels)

## Repo layout (monorepo)

```
CLAUDE.md                     global agent rules
.claude/skills/
  new-site/                   research + build one site
  batch-sites/                CSV in, report out
  promote-site/               spec → live
  renew-preview/              extend preview expiry
  add-subtype/                scaffold sub-type / category
template/
  registry.ts                 categories + sub-types (single source of truth)
  schema/                     Zod: core + category extensions
  components/                 shared sections and variants
  presets/<category>/         tone.md, sections.ts, service defaults, Zod extension
  sections/retail/            cross-category retail section set
  assets/packs/<subtype>/     curated images + credits.json
sites/<slug>/                 site.json, notes.md, REVIEW.md, assets/
sites/_archive/               expired previews
```

A template fix propagates to every site. Per-site repos are extracted only if a client ever requires one.

## Taxonomy

Registry-driven. Code identifiers are English; every visitor-facing label is Italian (English labels may be added later). A business has one **primary** sub-type and optional **secondary** sub-types (e.g. tyre-shop + auto-repair).

| Category | Sub-type ID | schema.org | Label (it) |
|---|---|---|---|
| automotive | `tyre-shop` | TireShop | Gommista |
| automotive | `auto-repair` | AutoRepair | Officina meccanica |
| automotive | `body-shop` | AutoBodyShop | Carrozzeria |
| automotive | `auto-electrician` | AutoRepair | Elettrauto |
| food-beverage | `bakery` | Bakery | Panificio |
| food-beverage | `pastry-shop` | Bakery | Pasticceria |
| food-beverage | `restaurant` | Restaurant | Ristorante |
| fitness | `gym` | ExerciseGym | Palestra |
| trades | `plumber` | Plumber | Idraulico |
| trades | `electrician` | Electrician | Elettricista |
| trades | `painter` | HousePainter | Imbianchino |
| trades | `locksmith-metalwork` | Locksmith | Fabbro |
| trades | `upholsterer` | HomeAndConstructionBusiness | Tappezziere |
| trades | `builder` | GeneralContractor | Impresa edile |
| health | `psychologist` | MedicalBusiness | Psicologo |

### Extending

- **New sub-type:** registry entry + image pack + optional tone notes. No component code.
- **New category:** `template/presets/<category>/` (tone.md, sections.ts, optional Zod extension) + registry entries.
- `/add-subtype` scaffolds both.
- A sub-type is **ready** when its pack has a non-empty `credits.json` and its category has a `tone.md`. A real site whose primary or secondary sub-types are not ready fails validation and the build (fixtures are exempt). `pnpm check:registry` lists readiness for every entry, so sub-types can be registered before their assets exist.

## Template

One base template with five category presets. Shared sections cover most of each site: hero, services, hours, map, reviews summary, contact, gallery, footer.

Category presets add:
- **Food & Beverage:** specialities and cuisine (the `products` section), a link out to the business's own published menu (`menu`), services (take-away, delivery, outdoor tables), table booking CTA. Prices are never copied into the site: the menu section links to the source, which stays current.
- **Fitness:** class schedule, plans/prices
- **Trades:** service list, service area (comuni), emergency availability, quote CTA
- **Automotive:** services, brands handled, seasonal tyre-change banner, booking CTA
- **Health** (individual practitioners first): areas of work (`areas`), professional profile (`credentials`: title, specialisations, Albo registration, languages), services, booking CTA. Health professionals may advertise only informative content (L. 145/2018, art. 1 c. 525), so the category shows **no ratings or reviews** (the schema rejects `business.rating`), no prices and no generic services. The practitioner's sourced title ("Psicologa psicoterapeuta") replaces the sub-type label.

**Retail section set** (product categories, brands carried, "chiedi disponibilità" CTA) is built now and available to any preset, enabled by sub-type. No current sub-type uses it; it is validated against a fixture site.

### Visual variation

Each preset offers 4–6 palettes, 2–3 font pairings and 2–3 layout variants per section. The selection is deterministic, seeded by slug. Known brand colours (from signage or social pages) take priority.

## Content contract: `site.json`

Validated with Zod. An invalid file fails the build, which gives the agent its fix loop.

- **Core:** `business` (name, ragione sociale, P.IVA, address, geo, phone, WhatsApp, email, hours incl. seasonal closures, socials), `category`, `subtype` (primary), `secondarySubtypes`, `theme`, `sections[]` (ordered, toggleable), `seo`, `status` (`spec` | `live`), `previewExpires`
- **Core** also has `business.directory` (name + URL of a directory profile people contact the business through, e.g. MioDottore): a contact action everywhere, and the primary one when no phone is public. `copy.voice` (`we` | `i`) sets who speaks in the template's own words: "Chi siamo" vs "Chi sono", "contattaci" vs "contattami".
- **Extension block** per category: `automotive`, `foodBeverage`, `fitness`, `trades`, `health`, plus optional `retail`
  - `foodBeverage`: `cuisine` (e.g. "Napoletana"), `specialities` (dishes a source names, optional description), `services`, `menu.url`, `booking` (url and/or phone). Food & Beverage has no generic services: an unsourced list stays empty.
  - `health`: `title` (as a source states it), `registration` (Albo board, number only if shown), `specializations`, `areas`, `services`, `languages`, `booking`.
- **`sources`:** keyed by fact path (`business.<key>`, `<extension>.<key>`): URLs + retrieval date + `confidence` (`low | medium | high | verified`; `verified` = confirmed by the client and may have no URL). Every present fact needs a source, and every source must match a fact. Service lists made only of generic services are exempt.
- **Generic services** must be names from the registry's `genericServices` for the site's sub-types.
- **JSON-LD** `LocalBusiness` with the correct subtype is generated from it.

### Missing data

Sections with no data are **hidden**. Hero, contacts/hours, map and footer always render. The only exception is generic service lists for trades/automotive sub-types, which are allowed but flagged as generic in REVIEW.md.

## Agent rules

- **Input:** business name + comune (required), Maps link or website (optional anchor). If there are several candidates, the agent stops and asks; it never guesses.
- **No invented facts.** Copy may only state facts present in `site.json` with a source. Prices, years, certifications, brand partnerships and awards appear only if sourced.
- **Tone:** per-category `tone.md` (e.g. trades practical and reassuring; F&B warm and sensory).
- **Images:** picked only from the curated packs. The agent never downloads images.
- **Review:** each run produces `sites/<slug>/REVIEW.md`, listing low-confidence, single-source and generic content. A human reviews it before any link goes to a business. It is generated by `pnpm review <slug>` from `site.json` and the agent's `notes.md` (identity check, fields not found, existing web presence), so it can't drift from the facts.

### Skills

- `/new-site "<name>" <comune> [link]`: research → `site.json` → build until green → deploy preview → REVIEW.md
- `/batch-sites <csv>`: rows `(name, comune, link?)` or the lead-tool export (`Sector` → sub-type, `Google Maps` as anchor). Rows whose phone matches an existing site are skipped. Each row runs `/new-site` in its own subagent; outputs go to `leads/batches/<date>-<list>/`. Outputs `batch-report.csv` (slug, preview URL, existing-site rating `none | social-only | outdated | decent`, confidence score, review flags). Ambiguous rows go to a `needs-disambiguation` list instead of being built. Lead discovery is out of scope.
- `/promote-site <slug>`: spec → live (see below)
- `/renew-preview <slug>`: extend expiry
- `/add-subtype`: scaffold a sub-type or category

## Images and third-party content

- Curated packs per sub-type (~15 images: enough for hero, about and a 6-photo gallery with variety between sites). Each pack has a `credits.json` (file, Italian alt text, author, source, licence, optional `roles`) and each site has a Crediti page.
- Pack images fill the **hero and about** slots. The **gallery** shows the client's own photos (`sites/<slug>/assets/gallery/`). On spec sites without client photos, it shows up to 6 pack photos, visibly labelled ("Galleria — Immagini illustrative"), because unlabelled stock would imply "this is our workshop". Live sites never show a stock gallery: it is replaced by client photos at promotion, or hidden.
- Sources: open-licence photos that allow commercial use and modification (CC0, public domain, CC BY, CC BY-SA), excluding photos flagged with personality-rights restrictions. The intended aggregator was [Openverse](https://openverse.org), but its search API timed out from our network, so the first packs come straight from Wikimedia Commons (Openverse's main source for this kind of photo). Attribution goes in `credits.json` and the Crediti page.
- Each slot (hero, about, gallery) draws from the primary sub-type's pack first and falls back to secondary packs. A `centered` hero layout takes no photo. Selection runs at config time (`template/lib/site-images-plugin.ts`), so a build imports and emits only the photos it uses.
- Pack sources are web-sized with `pnpm optimize:pack <subtype>` (max 1600px, mozjpeg q78, metadata including GPS stripped), because Astro copies each used original into the output.
- Spec sites never use the business's own photos or logo. They use a typographic logo built from the business name.
- Reviews are never copied. Show the rating and count with a link out, e.g. "4.7★ su Google, 132 recensioni".
- Real client assets go into `sites/<slug>/assets/` at promotion.

## Hosting and lifecycle

Cloudflare Pages, with prebuilt output deployed via `wrangler pages deploy`.

### Spec sites

- One shared previews project, path-based: `<project>.pages.dev/<slug>/` (project name in `template/config.ts`; a custom preview domain can be attached later without changing paths)
- `pnpm deploy:preview <slug…> | --all` uploads the full tree of current, unexpired previews every time, because a Pages deployment replaces the whole site. The root serves `robots.txt` (Disallow), `_headers` (`X-Robots-Tag: noindex`) and an index page that lists no prospects
- `noindex`, robots disallow, and a banner reading "Anteprima — demo realizzata da …"
- Contact uses `tel:`, `wa.me` and directions links to the business's real public number. The form is visible but disabled ("attivo dopo la pubblicazione").
- Expiry after **90 days**. A scheduled GitHub Actions job archives expired sites to `sites/_archive/` and removes the previews. Renewable.

### Promotion (`/promote-site`)

1. Swap in the client's real logo and photos.
2. Verify all facts with the client and clear REVIEW.md.
3. Set `status: live`. This removes the banner and noindex and enables the form (Pages Function → client email, Turnstile + honeypot).
4. Create the client's own Pages project and attach the domain.

**Hard gate:** a `live` site fails the build unless it has `legalName`, `vatNumber` (P.IVA) and `email` (privacy contact), every source is `verified`, and no service is generic.

**Domains:** the client is the registrant of their `.it`; we manage DNS on Cloudflare.

### Template updates

All sites track HEAD. `pnpm gate --live` renders every live site and fails on any visual diff. An intended change is approved by reviewing `dist/_visual/<slug>/*-diff.png` and re-baselining with `pnpm visual <slug> --update`.

## Compliance (Italy)

Nothing on the sites sets cookies, so there is no cookie banner:
- no Google Fonts CDN, no Google Maps iframe (static map or click-to-load OpenStreetMap + "Indicazioni" link), no social embeds
- Cloudflare Web Analytics (cookieless) on live sites
- Templated privacy policy page
- Footer shows ragione sociale + P.IVA. Mandatory for live sites; shown on spec sites only if found.

## MVP

**Automotive**, sub-types `tyre-shop` and `auto-repair` first.

**Done when** the full chain works for 10 real businesses: skill → `site.json` → build → preview deploy → REVIEW.md → batch run.

**Then:** remaining automotive (`body-shop`), Food & Beverage, Trades, Fitness.
