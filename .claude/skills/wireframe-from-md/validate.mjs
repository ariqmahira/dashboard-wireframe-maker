#!/usr/bin/env node
// Validate a generated Dashboard Wireframe project JSON against the shape the app
// imports (src/store/types.ts + src/export/projectIo.ts). Zero dependencies.
//
//   node validate.mjs path/to/output.json
//
// Exits 0 and prints "OK — imports cleanly" on success.
// Exits 1 and prints a bulleted list of problems on failure.

import { readFileSync } from 'node:fs';

const CHART_TYPES = [
  'line', 'bar', 'hbar', 'area', 'pie', 'scatter', 'gauge', 'radar',
  'funnel', 'heatmap', 'stat', 'table', 'image', 'customHtml', 'customEcharts',
  'filter',
];
const FILTER_TYPES = ['single-select', 'multi-select', 'single-date', 'multi-date'];

const errors = [];
const err = (msg) => errors.push(msg);

const path = process.argv[2];
if (!path) {
  console.error('Usage: node validate.mjs <path-to-wireframe.json>');
  process.exit(2);
}

let raw;
try {
  raw = readFileSync(path, 'utf8');
} catch (e) {
  console.error(`Could not read file: ${e.message}`);
  process.exit(2);
}

let doc;
try {
  doc = JSON.parse(raw);
} catch (e) {
  console.error(`Not valid JSON: ${e.message}`);
  process.exit(1);
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string';
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

// Track ids for global uniqueness (sections + cards + filters).
const seenIds = new Map(); // id -> where

function checkId(id, where) {
  if (!isStr(id) || id.length === 0) {
    err(`${where}: missing or non-string "id".`);
    return;
  }
  if (seenIds.has(id)) {
    err(`Duplicate id "${id}" (used by ${seenIds.get(id)} and ${where}).`);
  } else {
    seenIds.set(id, where);
  }
}

// --- meta ---
if (!isObj(doc)) {
  err('Root must be an object.');
} else {
  const meta = doc.meta;
  if (!isObj(meta)) {
    err('meta: missing object.');
  } else {
    if (meta.version !== 1) err('meta.version: must be exactly 1 (the app rejects anything else on import).');
    if (!isStr(meta.name)) err('meta.name: must be a string.');
    if (!isStr(meta.updatedAt)) err('meta.updatedAt: must be an ISO string, e.g. new Date().toISOString().');
  }

  // --- placeholders ---
  const ph = doc.placeholders;
  if (!isObj(ph)) {
    err('placeholders: missing object with header/sidemenu/footer.');
  } else {
    for (const key of ['header', 'sidemenu', 'footer']) {
      const p = ph[key];
      if (!isObj(p)) {
        err(`placeholders.${key}: missing object.`);
        continue;
      }
      if (typeof p.enabled !== 'boolean') err(`placeholders.${key}.enabled: must be boolean.`);
      if (!isStr(p.html)) err(`placeholders.${key}.html: must be a string.`);
      if (!isNum(p.size)) err(`placeholders.${key}.size: must be a number (px).`);
    }
  }

  // --- cardContainerTemplate ---
  if (!isStr(doc.cardContainerTemplate)) {
    err('cardContainerTemplate: must be a string.');
  } else if (!doc.cardContainerTemplate.includes('{{content}}')) {
    err('cardContainerTemplate: must contain the {{content}} token.');
  }

  // --- filters ---
  const filters = doc.filters;
  if (!isObj(filters)) {
    err('filters: missing object with common[] and advanced[].');
  } else {
    for (const group of ['common', 'advanced']) {
      const list = filters[group];
      if (!Array.isArray(list)) {
        err(`filters.${group}: must be an array.`);
        continue;
      }
      list.forEach((f, i) => validateFilter(f, `filters.${group}[${i}]`));
    }
  }

  // --- sections + cards ---
  if (!Array.isArray(doc.sections)) {
    err('sections: must be an array (the app rejects the file otherwise).');
  } else {
    doc.sections.forEach((s, si) => {
      const sWhere = `sections[${si}]`;
      if (!isObj(s)) { err(`${sWhere}: must be an object.`); return; }
      checkId(s.id, sWhere);
      if (!isStr(s.title)) err(`${sWhere}.title: must be a string.`);
      if (!Array.isArray(s.cards)) { err(`${sWhere}.cards: must be an array.`); return; }
      s.cards.forEach((c, ci) => validateCard(c, `${sWhere}.cards[${ci}]`));
    });
  }
}

// A single Filter definition (used by filters.common/advanced, filter cards, and
// per-card filter bars). Ids are tracked for global uniqueness like everything else.
function validateFilter(f, where) {
  if (!isObj(f)) { err(`${where}: must be an object.`); return; }
  checkId(f.id, where);
  if (!FILTER_TYPES.includes(f.type)) err(`${where}.type: "${f.type}" is not one of ${FILTER_TYPES.join(', ')}.`);
  if (!isStr(f.label)) err(`${where}.label: must be a string.`);
  if (f.type === 'single-select' || f.type === 'multi-select') {
    if (!Array.isArray(f.options) || f.options.length === 0) {
      err(`${where}.options: select filters need a non-empty string array.`);
    }
  }
}

function validateCard(c, where) {
  if (!isObj(c)) { err(`${where}: must be an object.`); return; }
  checkId(c.id, where);
  if (!CHART_TYPES.includes(c.type)) {
    err(`${where}.type: "${c.type}" is not one of ${CHART_TYPES.join(', ')}.`);
  }
  if (!Number.isInteger(c.span) || c.span < 1 || c.span > 24) {
    err(`${where}.span: must be an integer 1..24 (got ${JSON.stringify(c.span)}).`);
  }
  if (!isStr(c.title)) err(`${where}.title: must be a string.`);

  const cfg = c.config;
  const needCfg = (fn) => {
    if (!isObj(cfg)) { err(`${where}.config: ${c.type} needs a config object.`); return; }
    fn(cfg);
  };
  const arr = (v) => Array.isArray(v) && v.length > 0;

  switch (c.type) {
    case 'line': case 'bar': case 'hbar': case 'area':
      needCfg((cf) => {
        if (!arr(cf.categories)) err(`${where}.config.categories: ${c.type} needs a non-empty string array.`);
        if (!arr(cf.series)) err(`${where}.config.series: ${c.type} needs [{name,data:number[]}].`);
        else cf.series.forEach((s, i) => {
          if (!isStr(s?.name)) err(`${where}.config.series[${i}].name: must be a string.`);
          if (!Array.isArray(s?.data) || !s.data.every(isNum)) err(`${where}.config.series[${i}].data: must be number[].`);
        });
      });
      break;
    case 'pie': case 'funnel': case 'radar':
      needCfg((cf) => {
        if (!arr(cf.names)) err(`${where}.config.names: ${c.type} needs a non-empty string array.`);
        if (!Array.isArray(cf.values) || !cf.values.every(isNum)) err(`${where}.config.values: ${c.type} needs number[].`);
        if (c.type === 'radar' && !isNum(cf.max)) err(`${where}.config.max: radar needs a numeric max.`);
      });
      break;
    case 'gauge':
      needCfg((cf) => {
        if (!isNum(cf.gaugeValue)) err(`${where}.config.gaugeValue: gauge needs a number.`);
        if (!isNum(cf.max)) err(`${where}.config.max: gauge needs a numeric max.`);
      });
      break;
    case 'scatter':
      needCfg((cf) => {
        if (!Array.isArray(cf.points) || !cf.points.every((p) => Array.isArray(p) && p.length === 2 && p.every(isNum))) {
          err(`${where}.config.points: scatter needs [[x,y], ...] number pairs.`);
        }
      });
      break;
    case 'heatmap':
      needCfg((cf) => {
        if (!arr(cf.categories)) err(`${where}.config.categories: heatmap needs a non-empty string array (x axis).`);
        if (!arr(cf.names)) err(`${where}.config.names: heatmap needs a non-empty string array (y axis).`);
      });
      break;
    case 'stat':
      needCfg((cf) => {
        if (!isStr(cf.value)) err(`${where}.config.value: stat needs a display string, e.g. "$128,430".`);
        if (cf.trend !== undefined && cf.trend !== 'up' && cf.trend !== 'down') err(`${where}.config.trend: must be "up" or "down".`);
      });
      break;
    case 'table':
      needCfg((cf) => {
        if (!arr(cf.columns)) err(`${where}.config.columns: table needs a non-empty string array.`);
        if (!Array.isArray(cf.rows)) err(`${where}.config.rows: table needs string[][].`);
        else cf.rows.forEach((r, i) => { if (!Array.isArray(r)) err(`${where}.config.rows[${i}]: must be a string array.`); });
      });
      break;
    case 'image':
      needCfg((cf) => {
        if (!isStr(cf.src)) err(`${where}.config.src: image needs a URL or data URL string.`);
        if (cf.imageFit !== undefined && cf.imageFit !== 'contain' && cf.imageFit !== 'cover') err(`${where}.config.imageFit: must be "contain" or "cover".`);
      });
      break;
    case 'customHtml':
      needCfg((cf) => { if (!isStr(cf.customHtml)) err(`${where}.config.customHtml: needs an HTML string.`); });
      break;
    case 'customEcharts':
      needCfg((cf) => {
        if (!isStr(cf.echartsJson)) { err(`${where}.config.echartsJson: needs a raw ECharts option as a JSON string.`); return; }
        try { JSON.parse(cf.echartsJson); } catch { err(`${where}.config.echartsJson: must itself be valid JSON (a stringified ECharts option).`); }
      });
      break;
  }

  // Standalone filter component: needs `filter`, ignores chart `config`.
  if (c.type === 'filter') {
    if (!isObj(c.filter)) err(`${where}.filter: a "filter" card needs a filter object { id, type, label, options? }.`);
    else validateFilter(c.filter, `${where}.filter`);
  }

  // Optional in-card filter bar (any chart card): { enabled, filters: Filter[] }.
  if (c.cardFilter !== undefined) {
    const cf = c.cardFilter;
    if (!isObj(cf)) {
      err(`${where}.cardFilter: must be an object { enabled: boolean, filters: Filter[] }.`);
    } else {
      if (typeof cf.enabled !== 'boolean') err(`${where}.cardFilter.enabled: must be boolean.`);
      if (!Array.isArray(cf.filters)) err(`${where}.cardFilter.filters: must be an array of filters.`);
      else cf.filters.forEach((f, i) => validateFilter(f, `${where}.cardFilter.filters[${i}]`));
    }
  }

  if (c.tooltip !== undefined) {
    const t = c.tooltip;
    if (!isObj(t)) err(`${where}.tooltip: must be an object.`);
    else {
      if (typeof t.enabled !== 'boolean') err(`${where}.tooltip.enabled: must be boolean.`);
      if (!isStr(t.title)) err(`${where}.tooltip.title: must be a string.`);
      if (!isStr(t.body)) err(`${where}.tooltip.body: must be a string ("Label: Value" per line).`);
    }
  }
}

if (errors.length) {
  console.error(`✗ ${path} is NOT importable — ${errors.length} problem(s):`);
  for (const e of errors) console.error(`  • ${e}`);
  process.exit(1);
}

console.log('OK — imports cleanly');
