import { useEffect, useRef, useState } from 'react';
import { Button, ColorPicker, Divider, Dropdown, Popover, Select, Space, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  BoldOutlined,
  ClearOutlined,
  DeleteColumnOutlined,
  DeleteOutlined,
  DeleteRowOutlined,
  FontColorsOutlined,
  HighlightOutlined,
  InsertRowAboveOutlined,
  InsertRowBelowOutlined,
  InsertRowLeftOutlined,
  InsertRowRightOutlined,
  ItalicOutlined,
  LinkOutlined,
  MergeCellsOutlined,
  OrderedListOutlined,
  SplitCellsOutlined,
  TableOutlined,
  UnderlineOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { sanitizeHtml } from '../common/sanitize';
import {
  buildGrid,
  cellRect,
  computeSelection,
  createTableHtml,
  deleteColumn,
  deleteRow,
  findPos,
  getCellFromNode,
  insertColumn,
  insertRow,
  mergeRect,
  readTable,
  splitRect,
  writeTable,
  type Rect,
} from './tableTools';

// Non-editable stand-in for the `{{content}}` token used by card-container
// templates, so users can style around the chart slot without deleting it.
const CHIP =
  '<span data-cwb-slot-chip="1" contenteditable="false" style="display:inline-block;padding:6px 12px;margin:2px;border:1px dashed #d9d9d9;border-radius:6px;background:#fafafa;color:#bbb;font-size:12px;user-select:none;">[ chart content ]</span>';

const SEL_CLASS = 'cwb-cell-sel';

function seedWithChip(html: string): string {
  return html.includes('{{content}}') ? html.split('{{content}}').join(CHIP) : html;
}

/** Read the live editor DOM back into a stored HTML string. */
function serialize(root: HTMLElement, slotToken: boolean): string {
  const clone = root.cloneNode(true) as HTMLElement;
  // Strip transient cell-selection highlight so it never persists.
  clone.querySelectorAll(`.${SEL_CLASS}`).forEach((el) => el.classList.remove(SEL_CLASS));
  if (slotToken) {
    clone
      .querySelectorAll('[data-cwb-slot-chip]')
      .forEach((chip) => chip.replaceWith(document.createTextNode('{{content}}')));
  }
  let html = clone.innerHTML;
  // If the chip was deleted, re-append the token (mirrors SlottedHtml's fallback).
  if (slotToken && !html.includes('{{content}}')) html += '{{content}}';
  return sanitizeHtml(html);
}

type TableCtx = { inTable: boolean; canMerge: boolean; canSplit: boolean };

function TableSizePicker({ onPick }: { onPick: (rows: number, cols: number) => void }) {
  const N = 8;
  const [hover, setHover] = useState({ r: 0, c: 0 });
  return (
    <div onMouseDown={(e) => e.preventDefault()}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${N}, 16px)`, gap: 2 }}>
        {Array.from({ length: N * N }).map((_, i) => {
          const r = Math.floor(i / N);
          const c = i % N;
          const on = r <= hover.r && c <= hover.c;
          return (
            <div
              key={i}
              onMouseEnter={() => setHover({ r, c })}
              onClick={() => onPick(r + 1, c + 1)}
              style={{
                width: 16,
                height: 16,
                border: '1px solid #d9d9d9',
                borderRadius: 2,
                background: on ? '#1677ff' : '#fff',
                cursor: 'pointer',
              }}
            />
          );
        })}
      </div>
      <div style={{ textAlign: 'center', marginTop: 6, fontSize: 12, color: '#555' }}>
        {hover.r + 1} × {hover.c + 1}
      </div>
    </div>
  );
}

export default function VisualHtmlEditor({
  value,
  onChange,
  slotToken,
}: {
  value: string;
  onChange: (html: string) => void;
  slotToken?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const lastHtml = useRef<string>('');
  const savedRange = useRef<Range | null>(null);

  // Table cell-selection state (transient, not persisted).
  const selectedCells = useRef<HTMLTableCellElement[]>([]);
  const selRect = useRef<Rect | null>(null);
  const dragAnchor = useRef<HTMLTableCellElement | null>(null);

  const [tblOpen, setTblOpen] = useState(false);
  const [ctx, setCtx] = useState<TableCtx>({ inTable: false, canMerge: false, canSplit: false });

  // Seed innerHTML only when `value` changes externally (open, or Code→Visual
  // toggle) — never on our own emitted edits, which would jump the cursor.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (value === lastHtml.current) return;
    el.innerHTML = slotToken ? seedWithChip(value) : value;
    lastHtml.current = value;
  }, [value, slotToken]);

  const saveSel = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && ref.current?.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  };
  const restoreSel = () => {
    const sel = window.getSelection();
    if (sel && savedRange.current) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  };

  const emit = () => {
    if (!ref.current) return;
    const html = serialize(ref.current, !!slotToken);
    lastHtml.current = html;
    onChange(html);
  };

  const exec = (command: string, val?: string) => {
    ref.current?.focus();
    restoreSel();
    document.execCommand(command, false, val);
    saveSel();
    emit();
  };

  // ---- table cell selection ----
  const clearCellSel = () => {
    ref.current?.querySelectorAll(`.${SEL_CLASS}`).forEach((el) => el.classList.remove(SEL_CLASS));
    selectedCells.current = [];
    selRect.current = null;
  };
  const applyCellSel = (cells: HTMLTableCellElement[]) => {
    ref.current?.querySelectorAll(`.${SEL_CLASS}`).forEach((el) => el.classList.remove(SEL_CLASS));
    cells.forEach((c) => c.classList.add(SEL_CLASS));
    selectedCells.current = cells;
  };

  const onEditorMouseDown = (e: React.MouseEvent) => {
    clearCellSel();
    dragAnchor.current = getCellFromNode(e.target as Node, ref.current);
    saveSel();
  };
  const onEditorMouseMove = (e: React.MouseEvent) => {
    if (e.buttons !== 1 || !dragAnchor.current) return;
    const cell = getCellFromNode(e.target as Node, ref.current);
    if (!cell) return;
    const table = dragAnchor.current.closest('table');
    if (!table || !table.contains(cell)) return;
    if (cell === dragAnchor.current) {
      if (selectedCells.current.length) clearCellSel();
      return;
    }
    e.preventDefault();
    window.getSelection()?.removeAllRanges();
    const res = computeSelection(table as HTMLTableElement, dragAnchor.current, cell);
    if (!res) return;
    selRect.current = res.rect;
    applyCellSel(res.cells);
  };
  const onEditorMouseUp = () => {
    dragAnchor.current = null;
    saveSel();
  };

  const curCell = (): HTMLTableCellElement | null => {
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode || !ref.current?.contains(sel.anchorNode)) return null;
    return getCellFromNode(sel.anchorNode, ref.current);
  };
  const refCell = (): HTMLTableCellElement | null => curCell() || selectedCells.current[0] || null;

  const computeCtx = (): TableCtx => {
    const cc = curCell();
    const cell = refCell();
    const canSplit = !!cell && ((cell.rowSpan || 1) > 1 || (cell.colSpan || 1) > 1);
    return {
      inTable: !!cell || selectedCells.current.length > 0 || !!cc,
      canMerge: selectedCells.current.length >= 2 && !!selRect.current,
      canSplit,
    };
  };

  const insertTable = (rows: number, cols: number) => {
    ref.current?.focus();
    restoreSel();
    document.execCommand('insertHTML', false, createTableHtml(rows, cols));
    emit();
  };

  const tableAction = (kind: string) => {
    const cell = refCell();
    const table = cell?.closest('table') as HTMLTableElement | null;
    if (!table || !ref.current?.contains(table)) return;

    if (kind === 'deleteTable') {
      table.remove();
      clearCellSel();
      emit();
      return;
    }

    if (kind === 'merge') {
      if (!selRect.current) return;
      const state = readTable(table);
      mergeRect(state, selRect.current);
      writeTable(table, state);
      clearCellSel();
      emit();
      return;
    }

    const grid = buildGrid(table);
    if (kind === 'split') {
      if (!cell) return;
      const rect = cellRect(grid, cell);
      if (!rect) return;
      const state = readTable(table);
      splitRect(state, rect);
      writeTable(table, state);
      clearCellSel();
      emit();
      return;
    }

    const pos = cell ? findPos(grid, cell) : null;
    const r = pos ? pos.r : 0;
    const c = pos ? pos.c : 0;
    const rs = cell?.rowSpan || 1;
    const cs = cell?.colSpan || 1;
    const state = readTable(table);
    if (kind === 'rowAbove') insertRow(state, r);
    else if (kind === 'rowBelow') insertRow(state, r + rs);
    else if (kind === 'colLeft') insertColumn(state, c);
    else if (kind === 'colRight') insertColumn(state, c + cs);
    else if (kind === 'delRow') deleteRow(state, r);
    else if (kind === 'delCol') deleteColumn(state, c);
    writeTable(table, state);
    clearCellSel();
    emit();
  };

  const tableMenu: MenuProps['items'] = [
    { key: 'merge', icon: <MergeCellsOutlined />, label: 'Merge cells', disabled: !ctx.canMerge },
    { key: 'split', icon: <SplitCellsOutlined />, label: 'Split cell', disabled: !ctx.canSplit },
    { type: 'divider' },
    { key: 'rowAbove', icon: <InsertRowAboveOutlined />, label: 'Insert row above', disabled: !ctx.inTable },
    { key: 'rowBelow', icon: <InsertRowBelowOutlined />, label: 'Insert row below', disabled: !ctx.inTable },
    { key: 'colLeft', icon: <InsertRowLeftOutlined />, label: 'Insert column left', disabled: !ctx.inTable },
    { key: 'colRight', icon: <InsertRowRightOutlined />, label: 'Insert column right', disabled: !ctx.inTable },
    { type: 'divider' },
    { key: 'delRow', icon: <DeleteRowOutlined />, label: 'Delete row', disabled: !ctx.inTable },
    { key: 'delCol', icon: <DeleteColumnOutlined />, label: 'Delete column', disabled: !ctx.inTable },
    { key: 'deleteTable', icon: <DeleteOutlined />, label: 'Delete table', danger: true, disabled: !ctx.inTable },
  ];

  // Keep toolbar clicks from stealing the selection out of the editor.
  const hold = (e: React.MouseEvent) => e.preventDefault();

  const btn = (title: string, icon: React.ReactNode, command: string, val?: string) => (
    <Tooltip title={title}>
      <Button size="small" type="text" icon={icon} onMouseDown={hold} onClick={() => exec(command, val)} />
    </Tooltip>
  );

  return (
    <div>
      <style>{`.${SEL_CLASS}{outline:2px solid #1677ff;outline-offset:-2px;background:rgba(22,119,255,0.14);}`}</style>
      <div
        onMouseDown={hold}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 2,
          padding: 4,
          border: '1px solid #d9d9d9',
          borderBottom: 'none',
          borderRadius: '6px 6px 0 0',
          background: '#fafafa',
        }}
      >
        <Select
          size="small"
          defaultValue="p"
          style={{ width: 96 }}
          onMouseDown={hold}
          onChange={(v) => exec('formatBlock', v)}
          options={[
            { value: 'p', label: 'Paragraph' },
            { value: 'h1', label: 'Heading 1' },
            { value: 'h2', label: 'Heading 2' },
            { value: 'h3', label: 'Heading 3' },
          ]}
        />
        <Divider type="vertical" style={{ margin: '0 2px' }} />
        {btn('Bold', <BoldOutlined />, 'bold')}
        {btn('Italic', <ItalicOutlined />, 'italic')}
        {btn('Underline', <UnderlineOutlined />, 'underline')}
        <Tooltip title="Text color">
          <ColorPicker
            size="small"
            onOpenChange={(open) => open && saveSel()}
            onChangeComplete={(c) => exec('foreColor', c.toHexString())}
            trigger="click"
          >
            <Button size="small" type="text" icon={<FontColorsOutlined />} onMouseDown={hold} />
          </ColorPicker>
        </Tooltip>
        <Tooltip title="Highlight color">
          <ColorPicker
            size="small"
            onOpenChange={(open) => open && saveSel()}
            onChangeComplete={(c) => exec('hiliteColor', c.toHexString())}
            trigger="click"
          >
            <Button size="small" type="text" icon={<HighlightOutlined />} onMouseDown={hold} />
          </ColorPicker>
        </Tooltip>
        <Divider type="vertical" style={{ margin: '0 2px' }} />
        {btn('Align left', <AlignLeftOutlined />, 'justifyLeft')}
        {btn('Align center', <AlignCenterOutlined />, 'justifyCenter')}
        {btn('Align right', <AlignRightOutlined />, 'justifyRight')}
        {btn('Bulleted list', <UnorderedListOutlined />, 'insertUnorderedList')}
        {btn('Numbered list', <OrderedListOutlined />, 'insertOrderedList')}
        <Divider type="vertical" style={{ margin: '0 2px' }} />
        <Tooltip title="Insert link">
          <Button
            size="small"
            type="text"
            icon={<LinkOutlined />}
            onMouseDown={hold}
            onClick={() => {
              saveSel();
              const url = window.prompt('Link URL');
              if (url) exec('createLink', url);
            }}
          />
        </Tooltip>
        {btn('Clear formatting', <ClearOutlined />, 'removeFormat')}
        <Divider type="vertical" style={{ margin: '0 2px' }} />
        <Popover
          open={tblOpen}
          onOpenChange={(o) => {
            if (o) saveSel();
            setTblOpen(o);
          }}
          trigger="click"
          content={
            <TableSizePicker
              onPick={(r, c) => {
                insertTable(r, c);
                setTblOpen(false);
              }}
            />
          }
        >
          <Tooltip title="Insert table">
            <Button size="small" type="text" icon={<TableOutlined />} onMouseDown={hold} />
          </Tooltip>
        </Popover>
        <Dropdown
          menu={{ items: tableMenu, onClick: ({ key }) => tableAction(key) }}
          trigger={['click']}
          onOpenChange={(o) => o && setCtx(computeCtx())}
        >
          <Tooltip title="Table cell options">
            <Button size="small" type="text" icon={<MergeCellsOutlined />} onMouseDown={hold} />
          </Tooltip>
        </Dropdown>
      </div>
      <Space direction="vertical" style={{ width: '100%' }} size={4}>
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          onInput={emit}
          onKeyUp={saveSel}
          onMouseDown={onEditorMouseDown}
          onMouseMove={onEditorMouseMove}
          onMouseUp={onEditorMouseUp}
          style={{
            minHeight: 320,
            maxHeight: 460,
            overflow: 'auto',
            padding: 12,
            border: '1px solid #d9d9d9',
            borderRadius: '0 0 6px 6px',
            background: '#fff',
            outline: 'none',
          }}
        />
      </Space>
    </div>
  );
}
