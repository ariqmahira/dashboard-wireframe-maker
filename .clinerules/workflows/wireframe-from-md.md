# Workflow: Markdown requirements → Wireframe JSON

Convert a Markdown requirements document into a JSON project file that imports into the
**Dashboard Wireframe Maker** (Toolbar → Import). Interpret the prose and map it onto the
app's data model, invent realistic sample data, then validate that the file imports.

This workflow shares its schema and validator with the Claude skill:
- Full schema reference: `.claude/skills/wireframe-from-md/reference.md`
- Known-good template: `.claude/skills/wireframe-from-md/example.json`
- Validator: `.claude/skills/wireframe-from-md/validate.mjs`

Read those for full detail. The output is byte-compatible with the Claude skill's output.

## Steps

1. **Get the requirements file.** Ask the user for the path to the markdown spec if they did
   not provide one. Read it fully — capture the dashboard name, section groupings, every
   metric/chart/table, and any filtering described.

2. **Read the schema.** Open `.claude/skills/wireframe-from-md/reference.md` for exact field
   names, the `ChartType` enum, and per-type `config` requirements. Skim `example.json` as a
   structural template.

3. **Map requirements → model** using the heuristics below.

4. **Generate realistic sample data** for every card so charts render meaningfully (not
   empty), tuned to the domain in the requirements. See "Sample-data conventions" in
   `reference.md`.

5. **Write** `<dashboard-slug>.wireframe.json` (alongside the requirements file unless the
   user says otherwise), following `example.json`'s exact structure: `meta.version` = `1`,
   `meta.updatedAt` = current ISO timestamp, all three `placeholders`, a
   `cardContainerTemplate` containing `{{content}}`, `filters.common`/`filters.advanced`
   arrays, and `sections`. Every section/card/filter needs a **unique** readable `id`.

6. **Validate and report.** Run:

   ```bash
   node .claude/skills/wireframe-from-md/validate.mjs <output>.wireframe.json
   ```

   Fix every reported problem and re-run until it prints `OK — imports cleanly`. Then tell the
   user: open the app (`npm run dev`) → Toolbar → **Import** → select the file.

## Compact schema

`Project`:
- `meta`: `{ name, version: 1, updatedAt: ISO string }` — **version must be 1**.
- `placeholders`: `header` / `sidemenu` / `footer`, each `{ enabled, html, size }`
  (header/footer = height px, sidemenu = width px).
- `cardContainerTemplate`: HTML string that **must contain `{{content}}`**.
- `filters`: `{ common: Filter[], advanced: Filter[] }`; `Filter = { id, type, label, options? }`
  with `type` ∈ `single-select | multi-select | single-date | multi-date` (`options` required
  for the select types).
- `sections`: `Section[]`; `Section = { id, title, subtitle?, cards: Card[] }`.

`Card = { id, type, span (1..24 int), title, subtitle?, config?, notes?, tooltip?, containerHtml?,
filter?, cardFilter? }`.
`type` ∈ `line | bar | hbar | area | pie | scatter | gauge | radar | funnel | heatmap | stat |
table | image | customHtml | customEcharts | filter`.

`config` per type:
- line/area/bar/hbar → `categories: string[]`, `series: {name, data: number[]}[]`, `showLegend?`
- pie/funnel → `names: string[]`, `values: number[]`; radar also `max`
- gauge → `gaugeValue`, `max` · scatter → `points: [number,number][]`
- heatmap → `categories` (x), `names` (y)
- stat → `value: string`, `delta?`, `trend?: 'up'|'down'`, `compareLabel?`, `valueColor?`
- table → `columns: string[]`, `rows: string[][]`
- image → `src`, `imageFit?` · customHtml → `customHtml` · customEcharts → `echartsJson` (stringified ECharts option)

Numeric fields are numbers, not strings. `table.rows` are arrays of strings.

**Filters attached to cards** (`Filter = { id, type, label, options? }`, ids globally unique):
- `type: "filter"` → a **standalone filter card**, rendered without a card container. No
  `config`; carries a single `filter` object instead. Use a small `span` (~6).
- `cardFilter: { enabled: boolean, filters: Filter[] }` → optional **inline filter bar on top
  of a chart**, within its card. Add to any chart card that needs its own filter; omit otherwise.

## Markdown → model mapping

- Doc title (`#`) → `meta.name`. `##`/`###` headings or grouped bullets → a `Section` each.
- Per visual pick a `type`: single number/KPI → `stat`; over-time → `line`/`area`;
  share/breakdown → `pie`; comparison/ranking → `bar`/`hbar`; conversion sequence → `funnel`;
  x-vs-y → `scatter`; progress-to-target → `gauge`; multi-dimension profile → `radar`;
  density grid → `heatmap`; record list → `table`; image → `image`; raw markup → `customHtml`;
  supplied ECharts option → `customEcharts`.
- "Filter by X" → a `Filter` (enum dimension → select with `options`; date/period → date
  types). Choose where it lives: dashboard-wide → right panel (`filters.common` primary,
  `filters.advanced` secondary); inline in a section → a standalone `type: "filter"` card
  (span ~6, no `config`); applies to one chart → that card's `cardFilter.filters`.
- Header/sidebar/footer/branding notes → the matching `placeholders`; keep `example.json`'s
  skeleton HTML if unspecified.

## Layout

24-col grid. Default spans: `stat` = 6, most charts = 8, primary charts = 12, a single
dominant chart = 24. Prefer section spans that sum to multiples of 24.

## Guardrails

- `meta.version` is always `1`. Use only fields listed above. Every `id` unique.
- Never finish on an unvalidated file — step 6 is mandatory.
