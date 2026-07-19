export type ChartType =
  | 'line'
  | 'bar'
  | 'hbar'
  | 'pie'
  | 'area'
  | 'scatter'
  | 'gauge'
  | 'radar'
  | 'funnel'
  | 'heatmap'
  | 'stat'
  | 'table'
  | 'image'
  | 'customHtml'
  | 'customEcharts'
  | 'filter';

/** Chart types that appear in the chart palette / "Add chart" menus (excludes `filter`). */
export const CHART_TYPES: ChartType[] = [
  'line',
  'bar',
  'hbar',
  'area',
  'pie',
  'scatter',
  'gauge',
  'radar',
  'funnel',
  'heatmap',
  'stat',
  'table',
  'image',
  'customHtml',
  'customEcharts',
];

export const CHART_LABELS: Record<ChartType, string> = {
  line: 'Line',
  bar: 'Bar',
  hbar: 'Bar (Horizontal)',
  area: 'Area',
  pie: 'Pie',
  scatter: 'Scatter',
  gauge: 'Gauge',
  radar: 'Radar',
  funnel: 'Funnel',
  heatmap: 'Heatmap',
  stat: 'KPI / Number',
  table: 'Table',
  image: 'Image',
  customHtml: 'Custom HTML',
  customEcharts: 'Custom ECharts',
  filter: 'Filter',
};

/** A mockup of a chart's hover tooltip (shown pinned in the wireframe). */
export interface TooltipMock {
  enabled: boolean;
  title: string;
  /** One row per line, formatted "Label: Value". */
  body: string;
}

export interface ChartSeries {
  name: string;
  data: number[];
}

/** Per-card, type-specific data used by the renderer and the HTML export. */
export interface CardConfig {
  // Cartesian (line / area / bar)
  categories?: string[];
  series?: ChartSeries[];
  showLegend?: boolean;
  // Categorical single-series (pie / funnel / radar) — names + values
  names?: string[];
  values?: number[];
  max?: number; // radar indicator max / gauge max
  // Gauge
  gaugeValue?: number;
  // Scatter
  points?: [number, number][];
  // KPI / number
  value?: string;
  delta?: string;
  trend?: 'up' | 'down';
  compareLabel?: string;
  valueColor?: string;
  // Table
  columns?: string[];
  rows?: string[][];
  // Image
  src?: string; // URL or data URL
  imageFit?: 'contain' | 'cover';
  // Custom HTML
  customHtml?: string;
  // Custom ECharts (raw option as JSON string)
  echartsJson?: string;
}

export interface Card {
  id: string;
  type: ChartType;
  span: number; // 1..24 Antd Col span
  offset?: number; // 0..23 Antd Col offset (empty columns to the left)
  rowStart?: boolean; // force a line break before this card (begin a new row)
  rowSpan?: number; // 1..24 target total width of the row this card begins (default 24)
  title: string;
  subtitle?: string;
  /** Per-type sample data (see CardConfig). */
  config?: CardConfig;
  /** Optional per-card override of the global card container template. */
  containerHtml?: string;
  /** Freeform annotation shown as a footnote on the card. */
  notes?: string;
  /** Mockup of the chart's hover tooltip. */
  tooltip?: TooltipMock;
  /** For `type === 'filter'`: the standalone filter this card represents (no card container). */
  filter?: Filter;
  /** Optional in-card filter bar rendered on top of the chart, within the card. */
  cardFilter?: CardFilter;
}

/** An in-card filter bar shown above a chart when individual chart filtering is enabled. */
export interface CardFilter {
  enabled: boolean;
  filters: Filter[];
}

export interface Section {
  id: string;
  title: string;
  subtitle?: string;
  cards: Card[]; // always laid out inside a full-width (span 24) section
}

export type FilterType =
  | 'single-select'
  | 'multi-select'
  | 'single-date'
  | 'multi-date';

export const FILTER_LABELS: Record<FilterType, string> = {
  'single-select': 'Single Select',
  'multi-select': 'Multi Select',
  'single-date': 'Single Date',
  'multi-date': 'Date Range',
};

export interface Filter {
  id: string;
  type: FilterType;
  label: string;
  options?: string[]; // for select types
}

export type FilterGroup = 'common' | 'advanced';

export interface Placeholder {
  enabled: boolean;
  html: string;
  size: number; // header/footer height (px) or sidemenu width (px)
}

export interface ProjectMeta {
  name: string;
  version: 1;
  updatedAt: string;
}

export interface Project {
  meta: ProjectMeta;
  placeholders: {
    header: Placeholder;
    sidemenu: Placeholder;
    footer: Placeholder;
  };
  cardContainerTemplate: string; // uses {{content}} token
  filters: {
    common: Filter[];
    advanced: Filter[];
  };
  sections: Section[];
}

/** Currently selected element for the Properties inspector. */
export type Selection =
  | { kind: 'card'; sectionId: string; cardId: string }
  | { kind: 'section'; sectionId: string }
  | null;
