// Grid-model helpers for editing HTML tables (with rowspan/colspan) inside the
// WYSIWYG editor. `document.execCommand` can't create tables or merge cells, so
// every table action reads the live DOM into a grid/matrix, mutates it, and
// writes it back.

export type Rect = { r1: number; c1: number; r2: number; c2: number };
type GridSlot = { cell: HTMLTableCellElement; anchorR: number; anchorC: number };
type Grid = (GridSlot | undefined)[][];
export type TableState = { m: number[][]; meta: Map<number, HTMLTableCellElement>; nextId: number };

const BASE_CELL_STYLE = 'border:1px solid #d9d9d9;padding:6px 10px;min-width:40px;vertical-align:top;';
const TH_EXTRA = 'background:#fafafa;font-weight:600;text-align:left;';

export function makeCell(tag: 'td' | 'th'): HTMLTableCellElement {
  const el = document.createElement(tag) as HTMLTableCellElement;
  el.setAttribute('style', BASE_CELL_STYLE + (tag === 'th' ? TH_EXTRA : ''));
  el.innerHTML = '<br>';
  return el;
}

function ensureCellStyle(cell: HTMLTableCellElement) {
  if (!cell.getAttribute('style')) {
    cell.setAttribute('style', BASE_CELL_STYLE + (cell.tagName === 'TH' ? TH_EXTRA : ''));
  }
}

export function createTableHtml(rows: number, cols: number): string {
  let body = '';
  for (let r = 0; r < rows; r++) {
    let cells = '';
    for (let c = 0; c < cols; c++) {
      const tag = r === 0 ? 'th' : 'td';
      const style = BASE_CELL_STYLE + (r === 0 ? TH_EXTRA : '');
      cells += `<${tag} style="${style}"><br></${tag}>`;
    }
    body += `<tr>${cells}</tr>`;
  }
  return `<table style="border-collapse:collapse;width:100%;margin:8px 0;font-size:13px;"><tbody>${body}</tbody></table>`;
}

/** Walk up from a DOM node to the enclosing table cell within `root`. */
export function getCellFromNode(node: Node | null, root: HTMLElement | null): HTMLTableCellElement | null {
  let n: Node | null = node;
  while (n && n !== root) {
    if (n.nodeName === 'TD' || n.nodeName === 'TH') return n as HTMLTableCellElement;
    n = n.parentNode;
  }
  return null;
}

/** Build a row/col matrix of slots, expanding rowspan/colspan. */
export function buildGrid(table: HTMLTableElement): Grid {
  const rows = Array.from(table.rows);
  const grid: Grid = [];
  for (let r = 0; r < rows.length; r++) {
    if (!grid[r]) grid[r] = [];
    let c = 0;
    for (const cell of Array.from(rows[r].cells)) {
      while (grid[r][c]) c++;
      const rowspan = cell.rowSpan || 1;
      const colspan = cell.colSpan || 1;
      for (let dr = 0; dr < rowspan; dr++) {
        for (let dc = 0; dc < colspan; dc++) {
          if (!grid[r + dr]) grid[r + dr] = [];
          grid[r + dr][c + dc] = { cell, anchorR: r, anchorC: c };
        }
      }
      c += colspan;
    }
  }
  return grid;
}

export function findPos(grid: Grid, cell: HTMLTableCellElement): { r: number; c: number } | null {
  for (let r = 0; r < grid.length; r++) {
    const row = grid[r];
    if (!row) continue;
    for (let c = 0; c < row.length; c++) {
      if (row[c]?.cell === cell) return { r: row[c]!.anchorR, c: row[c]!.anchorC };
    }
  }
  return null;
}

export function cellRect(grid: Grid, cell: HTMLTableCellElement): Rect | null {
  const p = findPos(grid, cell);
  if (!p) return null;
  return { r1: p.r, c1: p.c, r2: p.r + (cell.rowSpan || 1) - 1, c2: p.c + (cell.colSpan || 1) - 1 };
}

/**
 * Given two cells, return the rectangle covering both — expanded so no merged
 * cell is only partially included — plus the distinct cells it contains.
 */
export function computeSelection(
  table: HTMLTableElement,
  a: HTMLTableCellElement,
  b: HTMLTableCellElement,
): { cells: HTMLTableCellElement[]; rect: Rect } | null {
  const grid = buildGrid(table);
  const ra = cellRect(grid, a);
  const rb = cellRect(grid, b);
  if (!ra || !rb) return null;
  let r1 = Math.min(ra.r1, rb.r1);
  let c1 = Math.min(ra.c1, rb.c1);
  let r2 = Math.max(ra.r2, rb.r2);
  let c2 = Math.max(ra.c2, rb.c2);
  let changed = true;
  while (changed) {
    changed = false;
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        const g = grid[r]?.[c];
        if (!g) continue;
        const gr2 = g.anchorR + (g.cell.rowSpan || 1) - 1;
        const gc2 = g.anchorC + (g.cell.colSpan || 1) - 1;
        if (g.anchorR < r1) { r1 = g.anchorR; changed = true; }
        if (g.anchorC < c1) { c1 = g.anchorC; changed = true; }
        if (gr2 > r2) { r2 = gr2; changed = true; }
        if (gc2 > c2) { c2 = gc2; changed = true; }
      }
    }
  }
  const seen = new Set<HTMLTableCellElement>();
  const cells: HTMLTableCellElement[] = [];
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      const g = grid[r]?.[c];
      if (g && !seen.has(g.cell)) {
        seen.add(g.cell);
        cells.push(g.cell);
      }
    }
  }
  return { cells, rect: { r1, c1, r2, c2 } };
}

/** Read a table into a full matrix of cell ids + a per-id cell node. */
export function readTable(table: HTMLTableElement): TableState {
  const grid = buildGrid(table);
  const H = grid.length;
  let W = 0;
  for (const row of grid) W = Math.max(W, row?.length ?? 0);
  const idOf = new Map<HTMLTableCellElement, number>();
  const meta = new Map<number, HTMLTableCellElement>();
  let nextId = 1;
  const m: number[][] = [];
  for (let r = 0; r < H; r++) {
    m[r] = [];
    for (let c = 0; c < W; c++) {
      const g = grid[r]?.[c];
      if (!g) {
        const id = nextId++;
        meta.set(id, makeCell('td'));
        m[r][c] = id;
        continue;
      }
      let id = idOf.get(g.cell);
      if (id == null) {
        id = nextId++;
        idOf.set(g.cell, id);
        const clone = g.cell.cloneNode(true) as HTMLTableCellElement;
        clone.removeAttribute('rowspan');
        clone.removeAttribute('colspan');
        meta.set(id, clone);
      }
      m[r][c] = id;
    }
  }
  return { m, meta, nextId };
}

/** Rebuild a table's rows from a matrix, coalescing repeated ids into spans. */
export function writeTable(table: HTMLTableElement, state: TableState) {
  const { m, meta } = state;
  const H = m.length;
  const W = H ? m[0].length : 0;
  const rect = new Map<number, Rect>();
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      const id = m[r][c];
      const b = rect.get(id);
      if (!b) rect.set(id, { r1: r, c1: c, r2: r, c2: c });
      else {
        b.r1 = Math.min(b.r1, r);
        b.c1 = Math.min(b.c1, c);
        b.r2 = Math.max(b.r2, r);
        b.c2 = Math.max(b.c2, c);
      }
    }
  }
  const placed = new Set<number>();
  const tbody = document.createElement('tbody');
  for (let r = 0; r < H; r++) {
    const tr = document.createElement('tr');
    for (let c = 0; c < W; c++) {
      const id = m[r][c];
      const b = rect.get(id)!;
      if (b.r1 === r && b.c1 === c && !placed.has(id)) {
        placed.add(id);
        const cell = meta.get(id)!.cloneNode(true) as HTMLTableCellElement;
        cell.removeAttribute('rowspan');
        cell.removeAttribute('colspan');
        const rs = b.r2 - b.r1 + 1;
        const cs = b.c2 - b.c1 + 1;
        if (rs > 1) cell.setAttribute('rowspan', String(rs));
        if (cs > 1) cell.setAttribute('colspan', String(cs));
        ensureCellStyle(cell);
        tr.appendChild(cell);
      }
    }
    tbody.appendChild(tr);
  }
  table.querySelectorAll('thead,tbody,tfoot').forEach((s) => s.remove());
  while (table.rows.length) table.deleteRow(0);
  table.appendChild(tbody);
}

export function mergeRect(state: TableState, rect: Rect) {
  const { m, meta } = state;
  const masterId = m[rect.r1][rect.c1];
  const master = meta.get(masterId)!;
  const seen = new Set<number>([masterId]);
  for (let r = rect.r1; r <= rect.r2; r++) {
    for (let c = rect.c1; c <= rect.c2; c++) {
      const id = m[r][c];
      if (!seen.has(id)) {
        seen.add(id);
        const html = meta.get(id)?.innerHTML.trim() ?? '';
        if (html && html !== '<br>') {
          master.innerHTML = master.innerHTML.trim() === '<br>' ? html : `${master.innerHTML} ${html}`;
        }
      }
      m[r][c] = masterId;
    }
  }
}

export function splitRect(state: TableState, rect: Rect) {
  const { m, meta } = state;
  const masterId = m[rect.r1][rect.c1];
  const tag = meta.get(masterId)!.tagName === 'TH' ? 'th' : 'td';
  for (let r = rect.r1; r <= rect.r2; r++) {
    for (let c = rect.c1; c <= rect.c2; c++) {
      if (r === rect.r1 && c === rect.c1) continue;
      const id = state.nextId++;
      meta.set(id, makeCell(tag));
      m[r][c] = id;
    }
  }
}

export function insertRow(state: TableState, at: number) {
  const { m, meta } = state;
  const W = m[0].length;
  const row: number[] = [];
  for (let c = 0; c < W; c++) {
    const above = at > 0 ? m[at - 1][c] : undefined;
    const below = at < m.length ? m[at][c] : undefined;
    if (above != null && above === below) row[c] = above; // cell spans across → extend it
    else {
      const id = state.nextId++;
      meta.set(id, makeCell('td'));
      row[c] = id;
    }
  }
  m.splice(at, 0, row);
}

export function deleteRow(state: TableState, r: number) {
  if (state.m.length <= 1) return;
  state.m.splice(r, 1);
}

export function insertColumn(state: TableState, at: number) {
  const { m, meta } = state;
  for (let r = 0; r < m.length; r++) {
    const left = at > 0 ? m[r][at - 1] : undefined;
    const right = at < m[r].length ? m[r][at] : undefined;
    let val: number;
    if (left != null && left === right) val = left; // cell spans across → extend it
    else {
      const id = state.nextId++;
      meta.set(id, makeCell(r === 0 ? 'th' : 'td'));
      val = id;
    }
    m[r].splice(at, 0, val);
  }
}

export function deleteColumn(state: TableState, c: number) {
  const { m } = state;
  if (m[0].length <= 1) return;
  for (let r = 0; r < m.length; r++) m[r].splice(c, 1);
}
