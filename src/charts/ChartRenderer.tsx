import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { Card } from '../store/types';
import { resolveEchartsOption } from './chartOptions';
import { RawHtml } from '../components/common/Html';
import StatCard from './StatCard';
import TableCard from './TableCard';

function Placeholder({ text }: { text: string }) {
  return (
    <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: 13, textAlign: 'center', padding: 12 }}>
      {text}
    </div>
  );
}

/** Renders a live preview for a card. Handles stat/table/image/custom cases specially. */
export default function ChartRenderer({ card }: { card: Card }) {
  if (card.type === 'stat') return <StatCard card={card} />;
  if (card.type === 'table') return <TableCard card={card} />;
  if (card.type === 'image') {
    const src = card.config?.src;
    if (!src) return <Placeholder text="Add an image URL or upload one in Properties → Data" />;
    return (
      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
        <img src={src} alt={card.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: card.config?.imageFit ?? 'contain' }} />
      </div>
    );
  }
  if (card.type === 'customHtml') {
    return <div style={{ minHeight: 120, padding: 8 }}><RawHtml html={card.config?.customHtml || '<em style="color:#bbb;">Add custom HTML in Properties → Data</em>'} /></div>;
  }
  return <EChart card={card} />;
}

function EChart({ card }: { card: Card }) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  // Re-run when the config changes so live edits reflect immediately.
  const optionKey = JSON.stringify(card.config ?? {});

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, undefined, { renderer: 'canvas' });
    chartRef.current = chart;
    chart.setOption(resolveEchartsOption(card.type, card.config), true);

    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.type, optionKey]);

  return <div ref={ref} style={{ width: '100%', height: 200 }} />;
}
