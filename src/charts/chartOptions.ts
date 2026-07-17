import type { EChartsOption } from 'echarts';
import type { CardConfig, ChartType } from '../store/types';

export const PALETTE = ['#1677ff', '#13c2c2', '#52c41a', '#faad14', '#f5222d', '#722ed1'];
export const DEFAULT_CATS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

const gridSmall = { left: 40, right: 16, top: 24, bottom: 28 };
const gridLegend = { left: 40, right: 16, top: 46, bottom: 28 };

/** Default categorical name/value pairs per type (pie/funnel/radar). */
export const DEFAULT_NAMED: Record<string, { names: string[]; values: number[]; max?: number }> = {
  pie: { names: ['Electronics', 'Apparel', 'Home', 'Toys'], values: [1048, 735, 580, 484] },
  funnel: { names: ['Visits', 'Signups', 'Trials', 'Paid', 'Renewed'], values: [100, 80, 60, 40, 20] },
  radar: { names: ['Sales', 'Marketing', 'Dev', 'CS', 'Admin'], values: [80, 70, 90, 60, 75], max: 100 },
};

/** Default cartesian series per type (line/area/bar). */
export function defaultSeries(type: ChartType): { name: string; data: number[] }[] {
  if (type === 'area') return [{ name: 'Volume', data: [220, 280, 250, 360, 300, 420] }];
  return [
    { name: 'Series A', data: [120, 200, 150, 260, 180, 300] },
    { name: 'Series B', data: [80, 120, 110, 160, 140, 210] },
  ];
}

export const SAMPLE_TABLE = {
  columns: ['Date', 'Customer', 'Amount', 'Status'],
  rows: [
    ['2026-07-01', 'Acme Corp', '$1,200', 'Paid'],
    ['2026-07-02', 'Globex', '$850', 'Pending'],
    ['2026-07-03', 'Initech', '$2,100', 'Paid'],
    ['2026-07-04', 'Umbrella', '$430', 'Overdue'],
  ],
};

export const DEFAULT_ECHARTS_JSON = JSON.stringify(
  {
    tooltip: {},
    xAxis: { type: 'category', data: ['A', 'B', 'C', 'D'] },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: [23, 45, 12, 60] }],
  },
  null,
  2
);

/**
 * Resolve the ECharts option for a card: parses raw JSON for `customEcharts`,
 * otherwise builds a data-driven option from config.
 */
export function resolveEchartsOption(type: ChartType, cfg: CardConfig = {}): EChartsOption {
  if (type === 'customEcharts') {
    try {
      const parsed = JSON.parse(cfg.echartsJson || DEFAULT_ECHARTS_JSON);
      return parsed && typeof parsed === 'object' ? (parsed as EChartsOption) : {};
    } catch {
      return {
        title: { text: 'Invalid ECharts JSON', left: 'center', top: 'center', textStyle: { color: '#f5222d', fontSize: 13 } },
      };
    }
  }
  return getChartOption(type, cfg);
}

/** Returns an ECharts option built from the card config (with defaults as fallback). */
export function getChartOption(type: ChartType, cfg: CardConfig = {}): EChartsOption {
  const legend = !!cfg.showLegend;

  switch (type) {
    case 'line':
    case 'area':
    case 'bar':
    case 'hbar': {
      const horizontal = type === 'hbar';
      const isBar = type === 'bar' || type === 'hbar';
      const categories = cfg.categories?.length ? cfg.categories : DEFAULT_CATS;
      const series = cfg.series?.length ? cfg.series : defaultSeries(type);
      const catAxis = { type: 'category' as const, boundaryGap: type !== 'area', data: categories };
      const valAxis = { type: 'value' as const };
      const grid = { ...(legend ? gridLegend : gridSmall), left: horizontal ? 64 : 40 };
      return {
        color: PALETTE,
        grid,
        tooltip: { trigger: 'axis' },
        legend: legend ? { top: 0, type: 'scroll' } : undefined,
        xAxis: horizontal ? valAxis : catAxis,
        yAxis: horizontal ? catAxis : valAxis,
        series: series.map((s) => ({
          name: s.name,
          type: isBar ? 'bar' : 'line',
          smooth: !isBar,
          areaStyle: type === 'area' ? {} : undefined,
          data: s.data,
        })),
      };
    }
    case 'pie': {
      const d = DEFAULT_NAMED.pie;
      const names = cfg.names?.length ? cfg.names : d.names;
      const values = cfg.values?.length ? cfg.values : d.values;
      return {
        color: PALETTE,
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, type: 'scroll' },
        series: [
          {
            type: 'pie',
            radius: '68%',
            center: ['50%', '46%'],
            label: { show: false },
            data: names.map((name, i) => ({ name, value: values[i] ?? 0 })),
          },
        ],
      };
    }
    case 'funnel': {
      const d = DEFAULT_NAMED.funnel;
      const names = cfg.names?.length ? cfg.names : d.names;
      const values = cfg.values?.length ? cfg.values : d.values;
      return {
        color: PALETTE,
        tooltip: { trigger: 'item' },
        series: [
          {
            type: 'funnel',
            left: '10%',
            width: '80%',
            label: { position: 'inside' },
            data: names.map((name, i) => ({ name, value: values[i] ?? 0 })),
          },
        ],
      };
    }
    case 'radar': {
      const d = DEFAULT_NAMED.radar;
      const names = cfg.names?.length ? cfg.names : d.names;
      const values = cfg.values?.length ? cfg.values : d.values;
      const max = cfg.max ?? d.max ?? 100;
      return {
        color: PALETTE,
        radar: { indicator: names.map((name) => ({ name, max })), radius: '62%' },
        series: [{ type: 'radar', areaStyle: { opacity: 0.2 }, data: [{ value: values }] }],
      };
    }
    case 'gauge': {
      const value = cfg.gaugeValue ?? 72;
      const max = cfg.max ?? 100;
      return {
        series: [
          {
            type: 'gauge',
            max,
            progress: { show: true },
            axisLine: { lineStyle: { width: 12 } },
            detail: { valueAnimation: true, fontSize: 22, offsetCenter: [0, '70%'] },
            data: [{ value, name: 'Usage' }],
          },
        ],
      };
    }
    case 'scatter': {
      const points =
        cfg.points?.length
          ? cfg.points
          : ([[10, 8.04], [8, 6.95], [13, 7.58], [9, 8.81], [11, 8.33], [14, 9.96], [6, 7.24], [4, 4.26], [12, 10.84], [7, 4.82]] as [number, number][]);
      return {
        color: PALETTE,
        grid: gridSmall,
        tooltip: {},
        xAxis: {},
        yAxis: {},
        series: [{ type: 'scatter', symbolSize: 12, data: points }],
      };
    }
    case 'heatmap': {
      const hours = cfg.categories?.length ? cfg.categories : ['12a', '4a', '8a', '12p', '4p', '8p'];
      const days = cfg.names?.length ? cfg.names : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const data: [number, number, number][] = [];
      for (let i = 0; i < hours.length; i++) {
        for (let j = 0; j < days.length; j++) data.push([i, j, Math.round(Math.random() * 10)]);
      }
      return {
        tooltip: {},
        grid: { left: 44, right: 16, top: 16, bottom: 40 },
        xAxis: { type: 'category', data: hours, splitArea: { show: true } },
        yAxis: { type: 'category', data: days, splitArea: { show: true } },
        visualMap: { min: 0, max: 10, calculable: true, orient: 'horizontal', left: 'center', bottom: 0 },
        series: [{ type: 'heatmap', data, label: { show: false } }],
      };
    }
    default:
      return {};
  }
}
