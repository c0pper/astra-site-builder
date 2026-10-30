---
name: new-site
description: Research one local business and build its spec preview site, deploy it, and write REVIEW.md.
argument-hint: '"<business name>" <comune> [maps link | website | phone]'
disable-model-invocation: true
---

# /new-site

Turns a business name and comune into a deployed spec preview at `<PREVIEWS_ORIGIN>/<slug>/` plus `sites/<slug>/REVIEW.md` for a human to check. The content rules in the root `CLAUDE.md` bind every step: a fact goes into `site.json` only with its source, and copy states only those facts.

Input: business name and comune (required); an **anchor** (Google Maps link, website, phone, or a lead row from `leads/*.csv` with address, phone, rating) when available. A lead row's `Sector` maps to the sub-type (`Tyre shop` → `tyre-shop`, `Auto repair` → `auto-repair`, or `auto-electrician` when its Google category is about car electrics, `Body shop` → `body-shop`). Its `Town` may read "Caserta (search area)": that is the search area, not necessarily the comune.

Write `site.json` and `notes.md` with the Write tool; long shell heredocs break on Windows.

## 1. Identify the business

Search, in this order: the phone number; `paginegialle.it` for name + comune; the name + comune; the name alone and a guessed own domain (`<name>.it`, `<name>.com`). A lead row's "No website" only means the Maps listing has no website button: own sites and dead old domains still turn up.

Match every candidate against the anchor. Phone and street are the strongest signals; name alone is weak, since one family often runs two shops in a town. A house-number difference (153 vs 155) or a second listed address with the same phone is still the same business: note it.

**Done when** exactly one candidate matches the anchor, or, with no anchor, exactly one candidate exists. Several plausible candidates, or one that contradicts the anchor (different phone *and* address): **stop**, list the candidates with address and phone, and ask which one. Never pick.

**Sub-type:** one that `pnpm check:registry` marks ready (✓); only ready sub-types build. The page shows the sub-type's label ("Officina meccanica") in the header and hero, so the sub-type is a claim: a source must back it (a Google category counts). A trade outside the registry (towing, roadside assistance) takes a ready sub-type that a source backs and appears as a sourced service; when none is backed, stop and report. Add a secondary sub-type when a source shows several services of it (a gommista listing brakes, diagnostics and suspension: `tyre-shop` + `auto-repair`).

## 2. Scaffold

`pnpm scaffold <slug> <subtype> [secondary…]`. The slug is the name customers see (sign, Maps listing) + comune, ASCII, legal suffixes dropped: "Salemme Pneumatici di Salemme Vincenzo", Caserta → `salemme-pneumatici-caserta`. `business.name` uses the same name in normal capitalisation ("BOSCIA" → "Boscia").

## 3. Research into `site.json`

Fill `business.*` and the category extension (`automotive.*`), each fact with its entry in `sources` (`urls`, `retrieved` = today, `confidence`, optional `note`). `urls` lists every page that states the value, and only those. Field rules are in `template/schema/site.ts`; the build rejects anything malformed.

**Where to look:**
- The business's own website and social pages; for a dead domain, the Wayback Machine (`web.archive.org/web/2024*/<domain>`).
- The lead row.
- Directories: paginegialle.it (its pages also carry the P.IVA), altraopinione.org, Google snippets in search results.
- `legalName` and `vatNumber`: once a P.IVA turns up anywhere, confirm it with VIES (`https://ec.europa.eu/taxation_customs/vies/rest-api/ms/IT/vat/<piva>`, JSON with the registered name and address). VIES lists only businesses registered for intra-EU trade, so `isValid: false` is no evidence either way: keep the P.IVA at the confidence its other sources give. atoka.io and reportaziende.it company pages also work; ufficiocamerale.it and kompass block fetches.
- `automotive.brands` and services: tyre and parts brand dealer locators (Pirelli, Metzeler, Michelin, …).
- Food & Beverage (`foodBeverage.*`): the own menu page and social pages; food press (Gambero Rosso, Scatti di Gusto, local papers) for cuisine and named dishes. `specialities` are dishes a source names (a dish praised only in reviews is `low`, said so in the note). `menu.url` is a menu the business publishes itself, never a third-party copy. F&B has no generic services: with none sourced, `services` stays out.

**Confidence:**
- `high`: the business states it itself (own site, own social page), or two independent sources agree.
- `medium`: one third-party source: a directory, a registry, a brand's dealer locator, the lead row, a geocoder. Portals fed by one database (Pirelli + Metzeler locators) count as one source.
- `low`: inferred (photo, review, page older than two years) or read only from a search-result summary because the page blocks fetches. Such a page still goes in `urls`, but never counts toward `high`.

**Lead-row facts** (address, phone, rating, review count, Maps link) come from Google Maps: source URL is the row's `Google Maps` link with the junk glyph `%EE%A4%B4` removed, confidence `medium` until a second source agrees. Use that link for `business.googleMapsUrl` and `business.rating.url`.

**Weakest part:** a fact assembled from several sources takes the confidence of its least-supported part (Mon–Sat on the own site but Sunday "closed" only on a directory → `medium`), and that part goes in the `note`.

**Conflicts:** when sources disagree on part of a fact, keep the value most independent sources state (pages from one database count once) (for registered data such as the address, the registry counts double); with no majority, the more conservative one (the earlier closing time). Cap confidence at `medium` and put every value with its sources in the `note`. For the comune and CAP, the own site and OpenStreetMap beat directories.

**Hours:** include a day only when a source states it, including `[]` for closed. A day no source mentions stays out (shown as unknown).

**Geo:** once the address is final, run `pnpm geocode <slug>`. It pins the house number when OpenStreetMap knows it, otherwise the street (`approximate`, low confidence; the map says "Posizione indicativa"), otherwise nothing. An OSM place named for the business beats both: set it by hand at `medium`.

**Services:** a sourced service needs a source that names it. The trade's own name ("Elettrauto", "Gommista") is the sub-type, not a service. Directory keyword lists (the long "marchi trattati / servizi" blocks on paginegialle and virgilio) are SEO filler: not a source for services or brands. Use at most 8 services, dropping the vaguest ("Meccanico") and merging close ones ("Freni e ammortizzatori") with the original names in the source note. When research finds no service at all, use the registry's `genericServices` for the sub-types instead, marked `"generic": true` (the page labels them as typical of the trade, to be confirmed); with even one sourced service, list sourced services only.

**Leave out** what no source states: an empty field hides its section, which is the intended result. Facts that have no field (dealer networks, founding year from a registry) go in notes.md only. Never copy review text, never download images or logos. Set `theme.brandColors` only from the business's logo or signage, never from a directory-made template site's accent colour.

Record in `sites/<slug>/notes.md`:
- How the identity was confirmed (step 1).
- Each field searched for and not found, with where you looked.
- The existing web presence, with links: `none` (no own site, or only a dead domain), `social-only`, `outdated` (a working but old or directory-template site), or `decent`.

**Done when** every field of `business` and the extension is either filled and sourced, or listed under "Searched, not found" in notes.md.

## 4. Copy

Read `template/presets/<category>/tone.md` and write `copy.headline`, `copy.tagline`, `copy.about`, and service descriptions only where a source describes the service. Each sentence must trace to a fact in `site.json`; a short about beats a padded one. Keep each source's qualifiers ("soccorso 24 ore su 24 *per l'auto*") and never widen a fact ("pastiglie freni" is not "freni") or join two facts into a new claim: a 24h service plus the shop's phone is not "chiamaci a qualsiasi ora". Copy names only sourced services: generic ones appear in the services list alone, never in the headline, tagline or about.

## 5. Build until green

`pnpm gate <slug>` builds the site and runs Lighthouse. A build failure prints the invalid `site.json` path: fix the content, never the template. Repeat until it prints `1/1 passed`. SEO scores around 50–65 on spec sites are expected: previews are noindex on purpose, and SEO isn't gated.

## 6. Deploy and look

`pnpm deploy:preview <slug>`; it republishes every current preview with yours, which is expected. Then `pnpm screenshot <preview-url> dist/_shots/<slug>` and look at `mobile.png` and `desktop.png`. Fix what reads wrong (a headline that wraps badly, an empty-looking section) in `site.json`, then redeploy.

## 7. Review

`pnpm review <slug>` writes `sites/<slug>/REVIEW.md`. Rerun it after any later `site.json` change.

Report to the user: the preview URL, the review command's output line, the existing web presence rating, and anything in notes.md the reviewer should know before sending the link.
