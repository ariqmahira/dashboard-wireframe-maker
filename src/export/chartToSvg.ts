import * as echarts from 'echarts';
import type { CardConfig, ChartType } from '../store/types';
import { resolveEchartsOption } from '../charts/chartOptions';

/**
 * Render a chart to a static SVG string (no runtime JS) for HTML export.
 * Uses an offscreen echarts instance with the SVG renderer.
 */
export function chartToSvg(type: ChartType, cfg: CardConfig = {}, width = 400, height = 240): string {
  const dom = document.createElement('div');
  dom.style.width = `${width}px`;
  dom.style.height = `${height}px`;
  const chart = echarts.init(dom, undefined, { renderer: 'svg', width, height });
  // Disable animation so renderToSVGString captures the final state, not an
  // empty mid-animation frame (otherwise pie/scatter/gauge/radar/funnel come out blank).
  chart.setOption({ ...resolveEchartsOption(type, cfg), animation: false });
  const raw = chart.renderToSVGString();
  chart.dispose();
  // make the SVG scale to its container in the exported layout
  return raw.replace('<svg ', '<svg style="width:100%;height:100%;" preserveAspectRatio="xMidYMid meet" ');
}
