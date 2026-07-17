import { Table } from 'antd';
import { SAMPLE_TABLE } from './chartOptions';
import type { Card } from '../store/types';

export default function TableCard({ card }: { card: Card }) {
  const cols = card.config?.columns?.length ? card.config.columns : SAMPLE_TABLE.columns;
  const rows = card.config?.rows?.length ? card.config.rows : SAMPLE_TABLE.rows;

  const columns = cols.map((c, i) => ({ title: c, dataIndex: `c${i}`, key: `c${i}` }));
  const dataSource = rows.map((row, r) => {
    const obj: Record<string, string> = { key: String(r) };
    cols.forEach((_, i) => (obj[`c${i}`] = row[i] ?? ''));
    return obj;
  });

  return (
    <div style={{ padding: 8, height: '100%', overflow: 'auto' }}>
      <Table size="small" columns={columns} dataSource={dataSource} pagination={false} />
    </div>
  );
}
