import type { Filter } from '../../store/types';
import { FilterControl } from './FilterItem';

/**
 * Horizontal filter row rendered on top of a chart, within its card, when the
 * card has individual chart filtering enabled.
 */
export default function CardFilterBar({ filters }: { filters: Filter[] }) {
  if (!filters.length) return null;
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        padding: '0 12px 8px',
        borderBottom: '1px solid #f5f5f5',
        marginBottom: 8,
      }}
    >
      {filters.map((f) => (
        <div key={f.id} style={{ flex: '1 1 140px', minWidth: 120 }}>
          <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 2 }}>{f.label}</div>
          <FilterControl filter={f} />
        </div>
      ))}
    </div>
  );
}
