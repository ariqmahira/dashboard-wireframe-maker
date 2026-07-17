import { useRef } from 'react';
import { Button, ColorPicker, Form, Input, InputNumber, Select, Space, Switch, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import type { Card, CardConfig, ChartSeries } from '../../store/types';
import { useBuilderStore } from '../../store/useBuilderStore';
import { DEFAULT_CATS, DEFAULT_ECHARTS_JSON, DEFAULT_NAMED, SAMPLE_TABLE, defaultSeries } from '../../charts/chartOptions';

// ---- (de)serialization helpers ----
const csv = (arr?: Array<string | number>) => (arr ?? []).join(', ');
const parseCsv = (t: string) => t.split(',').map((s) => s.trim()).filter(Boolean);
const parseNums = (t: string) =>
  t.split(/[,\s]+/).map((s) => parseFloat(s)).filter((n) => !Number.isNaN(n));

const pairsToText = (names?: string[], values?: number[]) =>
  (names ?? []).map((n, i) => `${n} = ${values?.[i] ?? ''}`).join('\n');
const parsePairs = (t: string) => {
  const names: string[] = [];
  const values: number[] = [];
  t.split('\n').map((l) => l.trim()).filter(Boolean).forEach((line) => {
    const idx = line.lastIndexOf('=');
    if (idx === -1) {
      names.push(line);
      values.push(0);
    } else {
      names.push(line.slice(0, idx).trim());
      values.push(parseFloat(line.slice(idx + 1)) || 0);
    }
  });
  return { names, values };
};

const pointsToText = (pts?: [number, number][]) => (pts ?? []).map((p) => `${p[0]}, ${p[1]}`).join('\n');
const parsePoints = (t: string): [number, number][] =>
  t.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
    const [a, b] = l.split(',').map((s) => parseFloat(s));
    return [a || 0, b || 0];
  });

const rowsToText = (rows?: string[][]) => (rows ?? []).map((r) => r.join(', ')).join('\n');
const parseRows = (t: string) =>
  t.split('\n').filter((l) => l.trim()).map((l) => l.split(',').map((c) => c.trim()));

export default function ChartDataEditor({ card, sectionId }: { card: Card; sectionId: string }) {
  const { updateCard } = useBuilderStore.getState();
  const fileRef = useRef<HTMLInputElement>(null);
  const cfg = card.config ?? {};
  const set = (patch: Partial<CardConfig>) => updateCard(sectionId, card.id, { config: { ...cfg, ...patch } });
  const t = card.type;

  // ---- Cartesian: line / area / bar / horizontal bar ----
  if (t === 'line' || t === 'area' || t === 'bar' || t === 'hbar') {
    const cats = cfg.categories?.length ? cfg.categories : DEFAULT_CATS;
    const series: ChartSeries[] = cfg.series?.length ? cfg.series : defaultSeries(t);
    const setSeries = (next: ChartSeries[]) => set({ series: next });
    return (
      <>
        <Form.Item label="Categories (comma separated)">
          <Input value={csv(cats)} onChange={(e) => set({ categories: parseCsv(e.target.value) })} />
        </Form.Item>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>Series</Typography.Text>
        {series.map((s, i) => (
          <div key={i} style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 8, margin: '6px 0' }}>
            <Space.Compact style={{ width: '100%', marginBottom: 6 }}>
              <Input
                value={s.name}
                placeholder="Series name"
                onChange={(e) => setSeries(series.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))}
              />
              <Button
                danger
                icon={<DeleteOutlined />}
                disabled={series.length <= 1}
                onClick={() => setSeries(series.filter((_, idx) => idx !== i))}
              />
            </Space.Compact>
            <Input
              value={csv(s.data)}
              placeholder="Values, comma separated"
              onChange={(e) => setSeries(series.map((x, idx) => (idx === i ? { ...x, data: parseNums(e.target.value) } : x)))}
            />
          </div>
        ))}
        <Button
          size="small"
          icon={<PlusOutlined />}
          onClick={() => setSeries([...series, { name: `Series ${series.length + 1}`, data: cats.map(() => 0) }])}
          style={{ marginBottom: 12 }}
        >
          Add series
        </Button>
        <Form.Item label="Show legend">
          <Switch checked={!!cfg.showLegend} onChange={(v) => set({ showLegend: v })} />
        </Form.Item>
      </>
    );
  }

  // ---- Categorical single-series: pie / funnel ----
  if (t === 'pie' || t === 'funnel') {
    const d = DEFAULT_NAMED[t];
    const names = cfg.names?.length ? cfg.names : d.names;
    const values = cfg.values?.length ? cfg.values : d.values;
    return (
      <Form.Item label={'Items (one "Label = Value" per line)'}>
        <Input.TextArea
          rows={5}
          value={pairsToText(names, values)}
          onChange={(e) => set(parsePairs(e.target.value))}
        />
      </Form.Item>
    );
  }

  // ---- Radar ----
  if (t === 'radar') {
    const d = DEFAULT_NAMED.radar;
    const names = cfg.names?.length ? cfg.names : d.names;
    const values = cfg.values?.length ? cfg.values : d.values;
    return (
      <>
        <Form.Item label={'Indicators (one "Name = Value" per line)'}>
          <Input.TextArea rows={5} value={pairsToText(names, values)} onChange={(e) => set(parsePairs(e.target.value))} />
        </Form.Item>
        <Form.Item label="Max value">
          <InputNumber min={1} style={{ width: '100%' }} value={cfg.max ?? d.max} onChange={(v) => v != null && set({ max: v })} />
        </Form.Item>
      </>
    );
  }

  // ---- Gauge ----
  if (t === 'gauge') {
    return (
      <Space style={{ width: '100%' }} size="middle">
        <Form.Item label="Value" style={{ flex: 1 }}>
          <InputNumber min={0} style={{ width: '100%' }} value={cfg.gaugeValue ?? 72} onChange={(v) => v != null && set({ gaugeValue: v })} />
        </Form.Item>
        <Form.Item label="Max" style={{ flex: 1 }}>
          <InputNumber min={1} style={{ width: '100%' }} value={cfg.max ?? 100} onChange={(v) => v != null && set({ max: v })} />
        </Form.Item>
      </Space>
    );
  }

  // ---- Scatter ----
  if (t === 'scatter') {
    return (
      <Form.Item label={'Points (one "x, y" per line)'}>
        <Input.TextArea
          rows={5}
          value={pointsToText(cfg.points)}
          placeholder={'10, 8.04\n8, 6.95'}
          onChange={(e) => set({ points: parsePoints(e.target.value) })}
        />
      </Form.Item>
    );
  }

  // ---- Heatmap ----
  if (t === 'heatmap') {
    return (
      <>
        <Form.Item label="Column labels (comma separated)">
          <Input value={csv(cfg.categories)} placeholder="12a, 4a, 8a…" onChange={(e) => set({ categories: parseCsv(e.target.value) })} />
        </Form.Item>
        <Form.Item label="Row labels (comma separated)">
          <Input value={csv(cfg.names)} placeholder="Sun, Mon, Tue…" onChange={(e) => set({ names: parseCsv(e.target.value) })} />
        </Form.Item>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>Cell intensities are randomized sample data.</Typography.Text>
      </>
    );
  }

  // ---- KPI / number ----
  if (t === 'stat') {
    return (
      <>
        <Form.Item label="Value">
          <Input value={cfg.value ?? ''} onChange={(e) => set({ value: e.target.value })} />
        </Form.Item>
        <Form.Item label="Delta">
          <Input value={cfg.delta ?? ''} placeholder="+12.4%" onChange={(e) => set({ delta: e.target.value })} />
        </Form.Item>
        <Space style={{ width: '100%' }} size="middle">
          <Form.Item label="Trend" style={{ flex: 1 }}>
            <Select
              value={cfg.trend ?? 'up'}
              onChange={(trend) => set({ trend })}
              options={[{ value: 'up', label: 'Up' }, { value: 'down', label: 'Down' }]}
            />
          </Form.Item>
          <Form.Item label="Value color">
            <ColorPicker
              value={cfg.valueColor ?? '#141414'}
              onChange={(_, hex) => set({ valueColor: hex })}
              allowClear
              onClear={() => set({ valueColor: undefined })}
            />
          </Form.Item>
        </Space>
        <Form.Item label="Compare label">
          <Input value={cfg.compareLabel ?? ''} placeholder="vs last period" onChange={(e) => set({ compareLabel: e.target.value })} />
        </Form.Item>
      </>
    );
  }

  // ---- Image ----
  if (t === 'image') {
    const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      e.target.value = '';
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => set({ src: String(reader.result) });
      reader.readAsDataURL(f);
    };
    return (
      <>
        <Form.Item label="Image URL">
          <Input value={cfg.src ?? ''} placeholder="https://…  or upload below" onChange={(e) => set({ src: e.target.value })} />
        </Form.Item>
        <Form.Item>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
          <Button icon={<UploadOutlined />} onClick={() => fileRef.current?.click()}>Upload image</Button>
          <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 6 }}>
            Uploads are embedded (data URL) so they travel with the JSON and export.
          </Typography.Text>
        </Form.Item>
        <Form.Item label="Fit">
          <Select
            value={cfg.imageFit ?? 'contain'}
            onChange={(imageFit) => set({ imageFit })}
            options={[{ value: 'contain', label: 'Contain' }, { value: 'cover', label: 'Cover' }]}
          />
        </Form.Item>
      </>
    );
  }

  // ---- Custom HTML ----
  if (t === 'customHtml') {
    return (
      <Form.Item label="Custom HTML">
        <Input.TextArea
          rows={6}
          value={cfg.customHtml ?? ''}
          placeholder="<div>…your markup…</div>"
          style={{ fontFamily: 'monospace', fontSize: 12 }}
          onChange={(e) => set({ customHtml: e.target.value })}
        />
      </Form.Item>
    );
  }

  // ---- Custom ECharts ----
  if (t === 'customEcharts') {
    let err = '';
    try {
      JSON.parse(cfg.echartsJson || DEFAULT_ECHARTS_JSON);
    } catch (e) {
      err = (e as Error).message;
    }
    return (
      <Form.Item
        label="ECharts option (JSON)"
        validateStatus={err ? 'error' : undefined}
        help={err || 'Paste a valid ECharts setOption object as JSON.'}
      >
        <Input.TextArea
          rows={10}
          value={cfg.echartsJson ?? DEFAULT_ECHARTS_JSON}
          style={{ fontFamily: 'monospace', fontSize: 12 }}
          onChange={(e) => set({ echartsJson: e.target.value })}
        />
      </Form.Item>
    );
  }

  // ---- Table ----
  if (t === 'table') {
    const cols = cfg.columns?.length ? cfg.columns : SAMPLE_TABLE.columns;
    const rows = cfg.rows?.length ? cfg.rows : SAMPLE_TABLE.rows;
    return (
      <>
        <Form.Item label="Columns (comma separated)">
          <Input value={csv(cols)} onChange={(e) => set({ columns: parseCsv(e.target.value) })} />
        </Form.Item>
        <Form.Item label="Rows (one row per line, cells comma separated)">
          <Input.TextArea rows={5} value={rowsToText(rows)} onChange={(e) => set({ rows: parseRows(e.target.value) })} />
        </Form.Item>
      </>
    );
  }

  return null;
}
