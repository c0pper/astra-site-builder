---
name: batch-sites
description: Build spec preview sites for many leads from a CSV, then write batch-report.csv and a needs-disambiguation list.
argument-hint: '<csv> [--sector "Tyre shop,Auto repair"] [--limit N]'
disable-model-invocation: true
---

# /batch-sites

Runs `/new-site` once per lead row, each in its own subagent, and collects the outcomes into `leads/batches/<batch>/batch-report.csv`. You orchestrate; the subagents research and build.

## 1. Plan

`pnpm batch plan <csv> [--sector …] [--limit N]`. It prints the batch folder and the queued rows. Rows whose sector has no ready sub-type, or whose phone matches an existing site, are skipped with a reason; the report lists them.

## 2. Dispatch

For each queued row in `<batch>/rows.json`, start a general-purpose subagent with the brief below, filling in the row's JSON and the paths. Run them in waves of at most 5 in parallel: research runs side by side, while builds and deploys queue on a lock.

> Run the `/new-site` skill on one business: read `CLAUDE.md`, then `.claude/skills/new-site/SKILL.md`, and follow it exactly, in **batch mode**:
> - Input, a lead row (its `anchor` is the step 1 anchor; `subtype` is the starting sub-type): `<row JSON>`
> - Nobody is there to answer questions. Where the skill says stop and ask, write the result file with `"status": "needs-disambiguation"` and the candidates, then end.
> - Result file: `<batch>/results/<id>.json`, written with the Write tool, one of:
>   `{ "status": "built", "slug": "…", "webPresence": "none|social-only|outdated|decent" }`
>   `{ "status": "needs-disambiguation", "candidates": [{ "name": "…", "address": "…", "phone": "…", "url": "…" }] }`
>   `{ "status": "failed", "slug": "… if scaffolded", "reason": "…" }`
> - Touch only `sites/<your slug>/`, `dist/`, and your result file.
> - Reply with one line: the status, the slug, and anything the reviewer must know first.

**Done when** every queued row has a result file, or its agent has ended without one (the report shows it as `pending`; rerun that row alone if worth it).

## 3. Report

`pnpm batch report <batch>` writes `batch-report.csv` (one line per row: status, slug, preview URL, web presence, confidence 0–100, check-first count, flags) and `needs-disambiguation.md`.

Tell the user: the counts per status, the path of both files, the rows needing disambiguation, and the agents' one-line notes worth acting on. Each built site's `sites/<slug>/REVIEW.md` must be checked before its link goes to the business.
