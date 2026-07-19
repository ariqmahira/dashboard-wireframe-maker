---
name: wireframe-from-md
description: Convert a Markdown requirements document into a JSON project file that imports into the Dashboard Wireframe Maker app (Toolbar → Import). Use when the user has a markdown spec of a dashboard (KPIs, charts, sections, filters) and wants it turned into an importable wireframe .json. Also triggers on "generate wireframe json", "requirements to dashboard", "import json for the wireframe maker".
---

# Markdown requirements → Wireframe JSON

Turn a freeform Markdown requirements doc into a single `Project` JSON that the Dashboard
Wireframe Maker imports verbatim. You interpret the prose and map it onto the app's data
model — you are not running a strict parser. Then a validator guarantees the file imports.

Full field-by-field schema is in **`reference.md`** (read it before generating). A complete,
known-good file to use as a template is **`example.json`**. The validator is **`validate.mjs`**.

## Procedure

1. **Read the requirements.** Take the markdown file path from the user (ask if not given).
   Read it fully. Note the dashboard name, its groupings, every metric/chart/table mentioned,
   and any filtering the user describes.

2. **Read `reference.md`** (in this skill folder) for exact field names, the `ChartType`
   enum, and the per-type `config` requirements.

3. **Map requirements → model** using the heuristics below.

4. **Generate realistic sample data** for every card (see `reference.md` "Sample-data
   conventions"), tuned to the domain in the requirements (patients, orders, revenue, etc.),
   not literal placeholders. Charts must render meaningfully, not empty.

5. **Write the JSON** to `<dashboard-slug>.wireframe.json` (default alongside the
   requirements file, or where the user asks). Follow `example.json`'s structure exactly:
   `meta.version` = `1`, `meta.updatedAt` = current ISO timestamp, all three placeholders,
   a `cardContainerTemplate` containing `{{content}}`, `filters.common`/`filters.advanced`
   arrays, and `sections`. Give every section/card/filter a unique readable `id`.

6. **Validate, then report.** Run:

   ```bash
   node .claude/skills/wireframe-from-md/validate.mjs <output>.wireframe.json
   ```

   Fix any reported problem and re-run until it prints `OK — imports cleanly`. Then tell the
   user the file is ready and how to load it: **open the app (`npm run dev`) → Toolbar →
   Import → select the file.**

## Markdown → model mapping

- **Top `#` heading / doc title** → `meta.name`.
- **`##` / `###` headings, or bulleted groupings** ("Overview", "Sales", "Traffic") →
  one `Section` each (`title` + optional `subtitle`).
- **Per metric/visual, pick a `type`:**
  - "KPI", "metric", "total", "count", "rate as a single number" → `stat` (span 6).
  - "trend", "over time", "growth", "time series", "monthly/daily" → `line` (or `area` for
    volume/cumulative).
  - "breakdown", "composition", "share", "distribution", "% of", "by category" → `pie`
    (or `funnel` when it's a conversion sequence).
  - "comparison", "ranking", "top N", "by <dimension>" → `bar` (vertical) or `hbar`
    (horizontal / long labels).
  - "conversion funnel", "pipeline stages" → `funnel`.
  - "correlation", "x vs y", "scatter" → `scatter`.
  - "gauge", "utilization", "progress to target", "% of goal" → `gauge`.
  - "multi-metric score", "profile across dimensions" → `radar`.
  - "activity by hour/day", "density grid" → `heatmap`.
  - "table", "list of records", "recent <things>" → `table`.
  - explicit image/logo/mockup → `image`; embedded markup → `customHtml`; a supplied raw
    ECharts option → `customEcharts`.
- **"Filter by X", "filterable by", "slice by"** → a `Filter`. Text/enum dimension →
  `single-select` or `multi-select` (fill `options` from any values listed); date/period →
  `single-date` or `multi-date` (range). Choose **where** the filter lives:
  - Dashboard-wide filters (page controls, "global filters") → the right-side panel:
    primary in `filters.common`, secondary in `filters.advanced`.
  - A filter the spec places **inline in a section / next to charts** ("a Region dropdown at
    the top of the Sales section") → a **standalone filter card** (`type: "filter"`, span ~6,
    with a `filter` object; no `config`). It renders without a card container.
  - A filter that applies to **one specific chart** ("this chart can be filtered by segment",
    "per-widget filter") → add `cardFilter: { enabled: true, filters: [...] }` to that card.
  See `reference.md` → "Filter components" for exact shapes.
- **Header / sidebar / footer / branding notes** → the matching `placeholders` entry; keep
  `example.json`'s skeleton HTML if the requirements don't specify chrome.

## Layout

24-col grid. Default spans: `stat` = 6, most charts = 8, primary charts = 12, a single
dominant chart = 24. Aim for each section's spans to sum to multiples of 24 so rows fill.

## Guardrails

- `meta.version` is **always `1`** — the app rejects anything else.
- Use only fields listed in `reference.md`; numeric fields (`values`, `series[].data`,
  `gaugeValue`, `max`) are numbers, not strings; `table.rows` are string arrays.
- Never finish on an unvalidated file — step 6 is mandatory.
