import { nanoid } from 'nanoid';
import { FILTER_LABELS, type Card, type ChartType, type Filter, type FilterType, type Project } from './types';
import { DEFAULT_ECHARTS_JSON } from '../charts/chartOptions';

export const DEFAULT_CARD_TEMPLATE = `<div style="background:#fff;border:1px solid #f0f0f0;border-radius:8px;box-shadow:0 1px 2px rgba(0,0,0,0.04);height:100%;display:flex;flex-direction:column;overflow:hidden;">
  {{content}}
</div>`;

/** Build a filter definition with sensible defaults for its type. */
export function makeFilter(type: FilterType, label = FILTER_LABELS[type]): Filter {
  return {
    id: nanoid(8),
    type,
    label,
    options: type.includes('select') ? ['Option A', 'Option B', 'Option C'] : undefined,
  };
}

export function makeCard(type: ChartType, span = 8): Card {
  const titles: Record<ChartType, string> = {
    line: 'Trend Over Time',
    bar: 'Category Comparison',
    hbar: 'Ranking',
    area: 'Cumulative Volume',
    pie: 'Composition',
    scatter: 'Correlation',
    gauge: 'Utilization',
    radar: 'Multi-Metric Score',
    funnel: 'Conversion Funnel',
    heatmap: 'Activity Heatmap',
    stat: 'Total Revenue',
    table: 'Recent Records',
    image: 'Image',
    customHtml: 'Custom Block',
    customEcharts: 'Custom Chart',
    filter: 'Filter',
  };
  const base: Card = {
    id: nanoid(8),
    type,
    span: type === 'stat' || type === 'filter' ? 6 : span,
    title: titles[type],
    subtitle: 'Sample subtitle',
  };
  if (type === 'filter') {
    base.title = 'Filter';
    base.subtitle = undefined;
    base.filter = makeFilter('single-select');
  } else if (type === 'stat') {
    base.config = { value: '$128,430', delta: '+12.4%', trend: 'up' };
  } else if (type === 'customHtml') {
    base.config = { customHtml: '<div style="padding:24px;text-align:center;color:#888;border:1px dashed #d9d9d9;border-radius:8px;">Custom HTML block</div>' };
  } else if (type === 'customEcharts') {
    base.config = { echartsJson: DEFAULT_ECHARTS_JSON };
  }
  return base;
}

/** Build a standalone filter card (no card container) of the given filter type. */
export function makeFilterCard(type: FilterType): Card {
  const card = makeCard('filter');
  card.filter = makeFilter(type);
  return card;
}

// Skeleton-style header pills (light bars on a white header, right-aligned).
const HEADER_HTML = `<div style="height:100%;background:#fff;box-shadow:0 1px 4px rgba(0,21,41,.08);display:flex;align-items:center;justify-content:flex-end;gap:10px;padding-right:23px;">
  ${[48, 142, 59, 14, 172, 14]
    .map((w) => `<span style="display:block;height:14px;width:${w}px;background:#e3e9f5;border-radius:12px;"></span>`)
    .join('\n  ')}
</div>`;

// Blue gradient sidebar with static skeleton nav bars (no shimmer animation).
const SIDEMENU_HTML = `<div style="height:100%;background:linear-gradient(#5172bb,#3e61a6);box-shadow:2px 0 8px 0 rgba(29,35,41,.05);overflow:hidden;">
  <div style="display:flex;flex-direction:column;gap:8px;padding:34px 0 0 28px;">
    <span style="display:block;height:24px;width:165px;background:#4164a9;border-radius:12px;"></span>
    <span style="display:block;height:24px;width:57px;background:#4164a9;border-radius:12px;"></span>
  </div>
  <div style="display:flex;flex-direction:column;gap:12px;padding-left:28px;margin-top:60px;">
    ${[77, 110, 83, 74, 74, 86, 86, 86, 102, 154]
      .map((w) => `<span style="display:block;height:24px;width:${w}px;background:#5c80c7;border-radius:12px;"></span>`)
      .join('\n    ')}
  </div>
</div>`;

const FOOTER_HTML = `<div style="height:100%;display:flex;align-items:center;justify-content:center;background:#f3f4f7;color:#616161;font-size:14px;line-height:1.5715;">
  Copyright Acme Electronics
</div>`;

export function createDefaultProject(): Project {
  return {
    meta: {
      name: 'Untitled Wireframe',
      version: 1,
      updatedAt: new Date().toISOString(),
    },
    placeholders: {
      header: { enabled: true, size: 48, html: HEADER_HTML },
      sidemenu: { enabled: true, size: 256, html: SIDEMENU_HTML },
      footer: { enabled: true, size: 54, html: FOOTER_HTML },
    },
    cardContainerTemplate: DEFAULT_CARD_TEMPLATE,
    filters: {
      common: [
        { id: nanoid(8), type: 'single-select', label: 'Region', options: ['North', 'South', 'East', 'West'] },
        { id: nanoid(8), type: 'multi-date', label: 'Date Range' },
      ],
      advanced: [
        { id: nanoid(8), type: 'multi-select', label: 'Product Category', options: ['Electronics', 'Apparel', 'Home', 'Toys'] },
      ],
    },
    sections: [
      {
        id: nanoid(8),
        title: 'Overview',
        subtitle: 'Key performance indicators',
        cards: [
          makeCard('stat'),
          makeCard('stat'),
          makeCard('stat'),
          makeCard('stat'),
        ],
      },
      {
        id: nanoid(8),
        title: 'Performance',
        subtitle: 'Trends and breakdowns',
        cards: [makeCard('line', 12), makeCard('pie', 12)],
      },
    ],
  };
}
