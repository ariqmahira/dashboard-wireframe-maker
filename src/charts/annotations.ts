import type { TooltipMock } from '../store/types';

export const TOOLTIP_PALETTE = ['#1677ff', '#13c2c2', '#52c41a', '#faad14', '#f5222d', '#722ed1'];

function esc(s = ''): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function defaultTooltip(): TooltipMock {
  return { enabled: true, title: 'Jun', body: 'Revenue: $128,430\nOrders: 1,204' };
}

/** Parse the multi-line tooltip body into colored rows. */
export function parseTooltipRows(body: string) {
  return body
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line, i) => {
      const idx = line.indexOf(':');
      const label = idx === -1 ? line : line.slice(0, idx).trim();
      const value = idx === -1 ? '' : line.slice(idx + 1).trim();
      return { label, value, color: TOOLTIP_PALETTE[i % TOOLTIP_PALETTE.length] };
    });
}

/** Markup for the mockup tooltip box (echarts-style dark bubble). Used in builder + export. */
export function tooltipMockHtml(tip: TooltipMock): string {
  const rows = parseTooltipRows(tip.body)
    .map(
      (r) => `<div style="display:flex;align-items:center;gap:8px;margin-top:4px;white-space:nowrap;">
      <span style="width:9px;height:9px;border-radius:50%;background:${r.color};flex:0 0 auto;"></span>
      <span style="flex:1;">${esc(r.label)}</span>
      <span style="font-weight:600;margin-left:14px;">${esc(r.value)}</span>
    </div>`
    )
    .join('');
  return `<div style="background:rgba(50,50,50,.92);color:#fff;border-radius:6px;padding:8px 10px;font-size:12px;line-height:1.5;box-shadow:0 3px 8px rgba(0,0,0,.25);min-width:130px;pointer-events:none;">
    ${tip.title ? `<div style="font-weight:600;margin-bottom:2px;">${esc(tip.title)}</div>` : ''}
    ${rows}
  </div>`;
}

/** Markup for a card's notes footnote. Used in builder + export. */
export function notesHtml(notes: string): string {
  return `<div style="padding:6px 12px;border-top:1px dashed #eee;font-size:11px;color:#8c8c8c;font-style:italic;display:flex;gap:6px;">
    <span style="flex:0 0 auto;">✎</span><span>${esc(notes)}</span>
  </div>`;
}
