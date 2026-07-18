# Wireframe JSON — schema reference

The importable file is a single JSON object matching the `Project` type in
`src/store/types.ts`. On import the app only hard-requires `meta.version === 1` and
`sections` being an array (`src/export/projectIo.ts`), but a well-formed file needs the
full shape below to render correctly. Then it is loaded verbatim via `loadProject`.

## Top-level `Project`

```jsonc
{
  "meta":        { "name": string, "version": 1, "updatedAt": string /* ISO */ },
  "placeholders": {
    "header":   { "enabled": boolean, "html": string, "size": number /* height px */ },
    "sidemenu": { "enabled": boolean, "html": string, "size": number /* width px  */ },
    "footer":   { "enabled": boolean, "html": string, "size": number /* height px */ }
  },
  "cardContainerTemplate": string /* HTML, MUST contain the {{content}} token */,
  "filters": {
    "common":   Filter[],
    "advanced": Filter[]
  },
  "sections":   Section[]
}
```

- **`meta.version` must be exactly `1`.** Any other value (or a missing `sections` array)
  makes the app reject the file with "Not a valid wireframe file".
- `meta.updatedAt`: an ISO 8601 timestamp string, e.g. `2026-07-18T00:00:00.000Z`.

## `Section`

```jsonc
{ "id": string, "title": string, "subtitle"?: string, "cards": Card[] }
```

Sections are always full width. Cards inside flow left→right on a 24-column grid and wrap.

## `Card`

```jsonc
{
  "id": string,              // unique across the whole document
  "type": ChartType,         // see enum below
  "span": number,            // integer 1..24 (Antd Col span)
  "title": string,
  "subtitle"?: string,
  "config"?: CardConfig,     // type-specific data — see per-type table
  "notes"?: string,          // footnote annotation on the card
  "tooltip"?: { "enabled": boolean, "title": string, "body": string },
  "containerHtml"?: string   // optional per-card override of cardContainerTemplate
}
```

`tooltip.body` is one `Label: Value` per line (use `\n`).

### `ChartType` enum
`line`, `bar`, `hbar`, `area`, `pie`, `scatter`, `gauge`, `radar`, `funnel`, `heatmap`,
`stat`, `table`, `image`, `customHtml`, `customEcharts`.

### `CardConfig` — use only the fields for the card's type

| type            | required config fields                                  | optional                                   |
| --------------- | ------------------------------------------------------- | ------------------------------------------ |
| `line` `area` `bar` `hbar` | `categories: string[]`, `series: {name,data:number[]}[]` | `showLegend: boolean`             |
| `pie` `funnel`  | `names: string[]`, `values: number[]`                   | —                                          |
| `radar`         | `names: string[]`, `values: number[]`, `max: number`    | —                                          |
| `gauge`         | `gaugeValue: number`, `max: number`                     | —                                          |
| `scatter`       | `points: [number,number][]`                             | —                                          |
| `heatmap`       | `categories: string[]` (x), `names: string[]` (y)       | —                                          |
| `stat`          | `value: string` (e.g. `"$128,430"`)                     | `delta`, `trend:'up'\|'down'`, `compareLabel`, `valueColor` |
| `table`         | `columns: string[]`, `rows: string[][]`                 | —                                          |
| `image`         | `src: string` (URL or data URL)                         | `imageFit:'contain'\|'cover'`              |
| `customHtml`    | `customHtml: string` (raw HTML)                         | —                                          |
| `customEcharts` | `echartsJson: string` (a raw ECharts option, JSON-stringified) | —                                   |

`series[].data` and `values` are numbers, not strings. `table.rows` are arrays of strings
(each inner array is one row, aligned to `columns`).

## `Filter`

```jsonc
{ "id": string, "type": FilterType, "label": string, "options"?: string[] }
```

`FilterType`: `single-select`, `multi-select`, `single-date`, `multi-date` (date range).
`options` is required (non-empty) for the two select types and omitted for the date types.

## Layout / span conventions

- 24-column grid. Suggested spans: `stat` → **6** (4 per row); most charts → **8** (3 per
  row); large/primary charts → **12** (2 per row); a single dominant chart → **24**.
- Keep each section's cards summing to multiples of 24 where practical so rows fill cleanly.

## Sample-data conventions (mirror the app defaults)

- Cartesian: `categories: ["Jan","Feb","Mar","Apr","May","Jun"]`,
  `series: [{name:"Series A",data:[120,200,150,260,180,300]}]`.
- Pie: `names:["Electronics","Apparel","Home","Toys"]`, `values:[1048,735,580,484]`.
- Funnel: `names:["Visits","Signups","Trials","Paid","Renewed"]`, `values:[100,80,60,40,20]`.
- Radar: `names:["Sales","Marketing","Dev","CS","Admin"]`, `values:[80,70,90,60,75]`, `max:100`.
- Table: `columns:["Date","Customer","Amount","Status"]`, rows of matching-length strings.
- Stat: `value:"$128,430"`, `delta:"+12.4%"`, `trend:"up"`.

Prefer values that reflect the domain in the requirements (e.g. patients, orders, revenue)
rather than these literal placeholders — they are only shape examples.

## IDs

Every `id` (sections, cards, filters) must be a **unique** short string. Any scheme works
(the app uses 8-char nanoids); readable slugs like `sec-overview`, `card-revenue-kpi`,
`flt-region` are fine as long as no two ids collide.

## Validation

Run the validator before handing the file to the user:

```bash
node <skill-dir>/validate.mjs path/to/output.json
```

It checks version, placeholders, the `{{content}}` token, filters, unique ids, chart types,
span range, and per-type config completeness, and prints `OK — imports cleanly` on success.
