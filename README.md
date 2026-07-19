# Dashboard Wireframe Builder

A visual tool to sketch data-analytics dashboard wireframes and export them as
standalone static HTML that mimics a real web dashboard (header, sidemenu, footer,
card chrome). Built with **React + Vite + Ant Design + ECharts**.

## Features

- **Drag & drop charts** from the left palette onto the canvas.
- **Ant Design 24-column layout** — cards have an editable column **span** (1–24);
  **sections** are always full width (span 24). Rows wrap automatically.
- **Reorder** cards within and across sections (dnd-kit).
- **Chart types:** Line, Bar, Horizontal Bar, Area, Pie, Scatter, Gauge, Radar, Funnel,
  Heatmap, KPI/number card, and Table.
- **Custom widgets:** **Image** (URL or uploaded/embedded), **Custom HTML** block, and
  **Custom ECharts** (paste a raw ECharts option as JSON).
- **Fully customizable data** — edit categories, series, values, KPI number/delta/color,
  and table columns/rows in the **Properties → Data** panel.
- **Per-chart notes** (annotation footnote) and a **mockup tooltip** for each chart.
- **Edit card title & subtitle** inline or via the Properties panel.
- **Right-side filter panel** with a **Common Filter** group plus an **Advanced Filter**
  button that opens a modal; 4 filter types: single select, multi select, single date,
  date range.
- **Draggable filter components** — drag a filter from the palette onto a section. Filter
  components render **without a card container** (bare control) and reorder like any card.
- **Per-chart filters** — each card can toggle on an inline filter bar rendered **on top of
  the chart, within the card**, with its own set of filter controls.
- **Custom HTML placeholders** for header, sidemenu, and footer, plus a customizable
  **card container** template (global) or per-card override — mimic your real site.
- **Save / Load** the wireframe as a JSON project file.
- **Export** the wireframe as **static HTML** (inline CSS, charts snapshotted to SVG,
  no runtime JS; advanced-filter modal is CSS-only). Opens in any browser.
- **Undo / Redo** and a full-screen **Preview** mode that hides editing chrome.

## Getting started

**Prerequisites:** [Node.js](https://nodejs.org/) 18+ and npm.

```bash
# 1. Clone
git clone https://github.com/ariqmahira/dashboard-wireframe-maker.git
cd dashboard-wireframe-maker

# 2. Install dependencies
npm install

# 3. Start the dev server → http://localhost:5173
npm run dev
```

Other scripts:

```bash
npm run build     # type-check + production build to dist/
npm run preview   # serve the production build locally
npm run lint      # run oxlint
```

## How it works

- State lives in a **Zustand** store (`src/store/useBuilderStore.ts`) wrapped with
  **zundo** for undo/redo. The document shape is in `src/store/types.ts`.
- The canvas renders sections as Antd `Row wrap` of `Col span={n}` cards
  (`src/components/canvas/`). Custom card HTML is rendered with a live React chart
  portalled into a `{{content}}` slot (`src/components/common/Html.tsx`).
- Export lives in `src/export/`: `projectIo.ts` (JSON save/load), `chartToSvg.ts`
  (offscreen ECharts → static SVG), and `exportHtml.ts` (assembles the standalone doc).

## Project file / template notes

- The **card container template** uses a `{{content}}` token where the chart + title
  render. Any HTML around it (borders, badges, toolbars) is preserved in the export.
- Header/sidemenu/footer accept arbitrary HTML; sizes are in pixels.
- User-supplied HTML is sanitized with DOMPurify on render.
