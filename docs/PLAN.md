# MVP Build Plan

Goal: see "MVP" in [DESIGN.md](DESIGN.md). Each step ends in something runnable. Do the steps in order; a step depends on the ones before it.

## 1. Scaffold the monorepo ✅

- Single pnpm package (sites are data folders, not packages), Astro 7 + TypeScript + Tailwind v4, Fontsource
- Folder skeleton from DESIGN.md › Repo layout
- Root `CLAUDE.md` with the global rules (no invented facts, Italian-first, schema is the contract, never download images)
- A build command that takes a slug: `pnpm build:site <slug>` → `dist/<slug>/`

**Done:** an empty site builds.

## 2. Schema + registry ✅

- `template/registry.ts` covering all 12 sub-types (labels, schema.org type, category, default sections, service defaults, pack path)
- Zod core schema, `sources`/`confidence`, and the `automotive` extension (other extensions as empty stubs)
- `retail` extension schema
- Registry completeness check (pack + tone present), run as part of the build
- JSON-LD generator

**Done:** hand-written fixture `sites/_fixtures/tyre-shop/site.json` validates; a broken fixture fails with a readable error.

## 3. Base template + automotive preset ✅

- Shared sections: hero, services, hours (incl. seasonal closures), static map/OSM click-to-load, reviews summary, contact (tel/wa.me/directions, form disabled/enabled by status), gallery, footer (P.IVA), privacy page, Crediti page
- Automotive sections: brands handled, seasonal tyre banner, booking CTA
- Retail section set + `sites/_fixtures/retail/`
- Theme tokens: palettes, font pairings, 2–3 variants per section, deterministic seed-by-slug picker with brand-colour override
- Spec mode: noindex, robots, demo banner
- Live-mode hard gate

**Done:** both fixtures render in spec and live mode, and the gate fails a live fixture with no P.IVA.

## 4. Image packs + tone ✅

Done with 11 (tyre-shop) and 14 (auto-repair) photos from Wikimedia Commons; top up toward ~15 when better photos turn up.

- Curate `tyre-shop` and `auto-repair` packs (15–30 each) with `credits.json`
- `presets/automotive/tone.md`

**Done:** the completeness check passes for the two MVP sub-types.

## 5. Quality gates ✅

- Lighthouse ≥ 95 (Performance, Accessibility), mobile
- Playwright screenshot baseline + diff for live sites

**Done:** both gates run locally via one command and fail on a deliberate regression.

## 6. Deploy ✅

Live at https://simone-martin-web-developer.pages.dev/empty/. Verified: `X-Robots-Tag: noindex, nofollow` on every response, root `robots.txt` disallows all, unknown paths 404, `/_astro/` assets cached immutable.


- Cloudflare previews project; `pnpm deploy:preview <slug>` → `<project>.pages.dev/<slug>/`
- Verify noindex headers and robots in the deployed output

**Done:** a fixture is live at its preview URL.

## 7. `/new-site` skill ✅

Run on Salemme Pneumatici (Caserta), Gianfico Service (Pozzuoli) and Soccorso stradale Boscia (Benevento). An independent agent audited every fact and copy line against its sources; its findings (merged-fact confidence, generic services in copy, widened claims, lead-row glyphs) were turned into skill rules and fixed on all three sites. Supporting commands: `pnpm scaffold`, `pnpm review`.

- Disambiguation stop when there are several candidates
- Research → `site.json` with sources → pick from pack → copy per tone guide → build until green → deploy → REVIEW.md
- Run on 3 real tyre shops / garages, then tune the skill on what went wrong

**Done:** 3 previews whose REVIEW.md is accurate (spot-check every flagged and unflagged fact).

## 8. `/batch-sites`

- CSV in; `batch-report.csv` + `needs-disambiguation` out; existing-site rating
- Accept the existing lead-list format (`leads/campania_leads.csv`: Business, Sector, Town, Address, Phone, Google Maps, Web presence, …); `Google Maps` is the disambiguation anchor and `Sector` maps to the sub-type

**Done:** MVP criterion — a batch of 10 real businesses runs end to end.

## 9. Lifecycle

- `previewExpires`, `/renew-preview`, GitHub Actions cron archiving to `sites/_archive/`
- `/promote-site` with the hard gate, per-client Pages project, Pages Function form (Turnstile + honeypot)
- `/add-subtype` scaffold

**Done:** a fixture goes spec → live on a test domain; an expired preview is archived.

## After MVP

`body-shop`, then F&B (`bakery`, `pastry-shop`), Trades (6 sub-types), Fitness (`gym`). Each new category means adding its preset, Zod extension, tone guide and packs, and running one real site through `/new-site`.

## Open items (need a decision when reached)

- Agency name for the demo banner and the previews project name (`template/config.ts`); previews use `pages.dev` for now
- Email relay for live forms (Resend vs alternative)
- Which CI runs the screenshot gate (GitHub Actions assumed)
