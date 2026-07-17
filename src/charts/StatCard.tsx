import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import type { Card } from '../store/types';

export default function StatCard({ card }: { card: Card }) {
  const value = card.config?.value ?? '$0';
  const delta = card.config?.delta ?? '';
  const up = (card.config?.trend ?? 'up') === 'up';
  const compareLabel = card.config?.compareLabel ?? 'vs last period';
  const valueColor = card.config?.valueColor;
  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 96 }}>
      <div style={{ fontSize: 26, fontWeight: 600, lineHeight: 1.2, color: valueColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
      {delta && (
        <div style={{ marginTop: 6, color: up ? '#52c41a' : '#f5222d', fontSize: 13, fontWeight: 500 }}>
          {up ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {delta}
          {compareLabel && <span style={{ color: '#999', marginLeft: 6 }}>{compareLabel}</span>}
        </div>
      )}
    </div>
  );
}
