import type { Card, Filter, Project, Section } from '../store/types';
import { SAMPLE_TABLE } from '../charts/chartOptions';
import { notesHtml, tooltipMockHtml } from '../charts/annotations';
import { chartToSvg } from './chartToSvg';

function esc(s = ''): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function cardBodyHtml(card: Card): string {
  if (card.type === 'stat') {
    const value = esc(card.config?.value ?? '$0');
    const delta = esc(card.config?.delta ?? '');
    const up = (card.config?.trend ?? 'up') === 'up';
    const compareLabel = esc(card.config?.compareLabel ?? 'vs last period');
    const valueColor = card.config?.valueColor ? `color:${esc(card.config.valueColor)};` : '';
    return `<div style="padding:4px 12px;display:flex;flex-direction:column;justify-content:center;height:100%;">
      <div style="font-size:30px;font-weight:600;line-height:1.2;${valueColor}">${value}</div>
      ${delta ? `<div style="margin-top:6px;font-size:13px;font-weight:500;color:${up ? '#52c41a' : '#f5222d'};">${up ? '▲' : '▼'} ${delta}${compareLabel ? ` <span style="color:#999;">${compareLabel}</span>` : ''}</div>` : ''}
    </div>`;
  }
  if (card.type === 'table') {
    const cols = card.config?.columns?.length ? card.config.columns : SAMPLE_TABLE.columns;
    const rows = card.config?.rows?.length ? card.config.rows : SAMPLE_TABLE.rows;
    const head = cols.map((c) => `<th style="text-align:left;padding:6px 10px;border-bottom:1px solid #f0f0f0;font-weight:600;">${esc(c)}</th>`).join('');
    const body = rows
      .map((r) => `<tr>${cols.map((_, i) => `<td style="padding:6px 10px;border-bottom:1px solid #fafafa;">${esc(r[i] ?? '')}</td>`).join('')}</tr>`)
      .join('');
    return `<div style="padding:8px;overflow:auto;height:100%;"><table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
  }
  if (card.type === 'image') {
    const src = card.config?.src;
    if (!src) return `<div style="height:180px;display:flex;align-items:center;justify-content:center;color:#bbb;font-size:13px;">No image</div>`;
    return `<div style="height:200px;display:flex;align-items:center;justify-content:center;padding:8px;"><img src="${esc(src)}" alt="${esc(card.title)}" style="max-width:100%;max-height:100%;object-fit:${card.config?.imageFit ?? 'contain'};" /></div>`;
  }
  if (card.type === 'customHtml') {
    return `<div style="min-height:120px;padding:8px;">${card.config?.customHtml ?? ''}</div>`;
  }
  return `<div style="height:180px;padding:0 8px 8px;">${chartToSvg(card.type, card.config)}</div>`;
}

function cardHtml(card: Card, template: string): string {
  const inner = `<div style="display:flex;flex-direction:column;height:100%;position:relative;">
    ${card.tooltip?.enabled ? `<div style="position:absolute;top:46px;right:12px;z-index:3;">${tooltipMockHtml(card.tooltip)}</div>` : ''}
    <div style="padding:10px 12px 4px;">
      <div style="font-size:14px;font-weight:600;">${esc(card.title)}</div>
      ${card.subtitle ? `<div style="font-size:12px;color:#8c8c8c;">${esc(card.subtitle)}</div>` : ''}
    </div>
    <div style="flex:1;min-height:0;">${cardBodyHtml(card)}</div>
    ${card.notes ? notesHtml(card.notes) : ''}
  </div>`;
  const tpl = card.containerHtml || template;
  const chrome = tpl.includes('{{content}}') ? tpl.replace('{{content}}', inner) : tpl + inner;
  return `<div style="grid-column:span ${card.span};min-height:120px;">${chrome}</div>`;
}

function sectionHtml(section: Section, template: string): string {
  const cards = section.cards.map((c) => cardHtml(c, template)).join('\n');
  return `<section style="margin-bottom:20px;">
    ${section.title || section.subtitle ? `<div style="margin-bottom:10px;">
      ${section.title ? `<h3 style="margin:0;font-size:16px;">${esc(section.title)}</h3>` : ''}
      ${section.subtitle ? `<div style="font-size:12px;color:#8c8c8c;">${esc(section.subtitle)}</div>` : ''}
    </div>` : ''}
    <div style="display:grid;grid-template-columns:repeat(24,minmax(0,1fr));gap:12px;">
      ${cards}
    </div>
  </section>`;
}

function filterControl(f: Filter): string {
  const box = 'display:block;width:100%;box-sizing:border-box;padding:5px 10px;border:1px solid #d9d9d9;border-radius:6px;background:#fff;color:#666;font-size:13px;';
  switch (f.type) {
    case 'single-select':
      return `<div style="${box}display:flex;justify-content:space-between;">${esc(f.options?.[0] ?? 'Select')} <span style="color:#bbb;">▾</span></div>`;
    case 'multi-select':
      return `<div style="${box}">${(f.options ?? []).slice(0, 2).map((o) => `<span style="display:inline-block;background:#f0f0f0;border-radius:4px;padding:1px 6px;margin:1px 3px 1px 0;font-size:12px;">${esc(o)}</span>`).join('')}</div>`;
    case 'single-date':
      return `<div style="${box}display:flex;justify-content:space-between;">YYYY-MM-DD <span>📅</span></div>`;
    case 'multi-date':
      return `<div style="${box}display:flex;justify-content:space-between;">Start ~ End <span>📅</span></div>`;
    default:
      return '';
  }
}

function filterGroup(title: string, filters: Filter[]): string {
  if (!filters.length) return '';
  const items = filters
    .map((f) => `<div style="margin-bottom:12px;"><div style="font-size:12px;color:#555;margin-bottom:4px;">${esc(f.label)}</div>${filterControl(f)}</div>`)
    .join('');
  return `<div style="margin-bottom:18px;">
    <div style="font-size:13px;font-weight:600;margin-bottom:10px;border-bottom:1px solid #f0f0f0;padding-bottom:6px;">${esc(title)}</div>
    ${items}
  </div>`;
}

/** Build a standalone static HTML document (inline CSS, no runtime JS) for the wireframe. */
export function buildHtml(project: Project): string {
  const { placeholders: ph, filters, sections, cardContainerTemplate, meta } = project;

  const sectionsHtml = sections.map((s) => sectionHtml(s, cardContainerTemplate)).join('\n');

  const hasAdvanced = filters.advanced.length > 0;

  const filtersHtml =
    filters.common.length || hasAdvanced
      ? `<aside style="width:260px;flex:0 0 auto;background:#fff;border-left:1px solid #eee;padding:16px;overflow:auto;">
          <div style="font-weight:600;margin-bottom:14px;">Filters</div>
          ${filterGroup('Common Filter', filters.common)}
          ${hasAdvanced ? `<label for="cwb-adv" class="cwb-adv-btn">&#9881; Advanced Filter</label>` : ''}
        </aside>`
      : '';

  // CSS-only modal (no runtime JS): a hidden checkbox toggled by <label> triggers.
  const advancedModal = hasAdvanced
    ? `<input type="checkbox" id="cwb-adv" class="cwb-modal-toggle" />
  <div class="cwb-modal">
    <label for="cwb-adv" class="cwb-modal-backdrop"></label>
    <div class="cwb-modal-box">
      <div class="cwb-modal-head"><span>Advanced Filter</span><label for="cwb-adv" class="cwb-modal-x">&times;</label></div>
      ${filters.advanced
        .map((f) => `<div style="margin-bottom:12px;"><div style="font-size:12px;color:#555;margin-bottom:4px;">${esc(f.label)}</div>${filterControl(f)}</div>`)
        .join('')}
    </div>
  </div>`
    : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(meta.name)}</title>
<style>
  * { box-sizing: border-box; }
  body { margin:0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color:#141414; background:#f3f4f7; }
  .cwb-frame { display:flex; min-height:100vh; }
  .cwb-col { display:flex; flex-direction:column; flex:1; min-width:0; }
  .cwb-body { display:flex; flex:1; min-height:0; }
  .cwb-main { flex:1; min-width:0; padding:20px; }
  .cwb-adv-btn { display:flex; align-items:center; justify-content:center; gap:6px; width:100%; padding:6px 12px; border:1px solid #d9d9d9; border-radius:6px; background:#fff; cursor:pointer; font-size:13px; color:#333; }
  .cwb-adv-btn:hover { color:#1677ff; border-color:#1677ff; }
  .cwb-modal-toggle { position:absolute; width:0; height:0; opacity:0; pointer-events:none; }
  .cwb-modal { display:none; position:fixed; inset:0; z-index:1000; align-items:center; justify-content:center; }
  .cwb-modal-toggle:checked ~ .cwb-modal { display:flex; }
  .cwb-modal-backdrop { position:absolute; inset:0; background:rgba(0,0,0,.45); }
  .cwb-modal-box { position:relative; background:#fff; border-radius:8px; padding:20px; width:380px; max-width:92vw; max-height:80vh; overflow:auto; box-shadow:0 6px 24px rgba(0,0,0,.2); }
  .cwb-modal-head { display:flex; justify-content:space-between; align-items:center; font-weight:600; font-size:16px; margin-bottom:16px; }
  .cwb-modal-x { cursor:pointer; font-size:20px; line-height:1; color:#999; }
</style>
</head>
<body>
  <div class="cwb-frame">
    ${ph.sidemenu.enabled ? `<nav style="width:${ph.sidemenu.size}px;flex:0 0 auto;">${ph.sidemenu.html}</nav>` : ''}
    <div class="cwb-col">
      ${ph.header.enabled ? `<header style="height:${ph.header.size}px;flex:0 0 auto;">${ph.header.html}</header>` : ''}
      <div class="cwb-body">
        <main class="cwb-main">
          ${sectionsHtml}
        </main>
        ${filtersHtml}
      </div>
      ${ph.footer.enabled ? `<footer style="height:${ph.footer.size}px;flex:0 0 auto;">${ph.footer.html}</footer>` : ''}
    </div>
  </div>
  ${advancedModal}
</body>
</html>`;
}
