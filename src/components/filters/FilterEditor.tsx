import { Button, Input, Select, Space } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { FILTER_LABELS, type Filter, type FilterType } from '../../store/types';
import { FilterControl } from './FilterItem';

/**
 * Reusable editor for a single filter definition (label, type, options + a live
 * preview control). Used by the right-panel filter groups, standalone filter
 * cards, and per-card inline filter bars.
 */
export default function FilterEditor({
  filter,
  onChange,
  onRemove,
}: {
  filter: Filter;
  onChange: (patch: Partial<Omit<Filter, 'id'>>) => void;
  onRemove?: () => void;
}) {
  const isSelect = filter.type.includes('select');

  return (
    <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 10, marginBottom: 8, background: '#fff' }}>
      <Space.Compact style={{ width: '100%', marginBottom: 8 }}>
        <Input
          value={filter.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Label"
        />
        {onRemove && <Button danger icon={<DeleteOutlined />} onClick={onRemove} />}
      </Space.Compact>

      <Select
        size="small"
        value={filter.type}
        style={{ width: '100%', marginBottom: 8 }}
        onChange={(type: FilterType) =>
          onChange({
            type,
            options: type.includes('select') ? filter.options ?? ['Option A', 'Option B'] : undefined,
          })
        }
        options={(Object.keys(FILTER_LABELS) as FilterType[]).map((t) => ({ value: t, label: FILTER_LABELS[t] }))}
      />

      {isSelect && (
        <Select
          mode="tags"
          size="small"
          value={filter.options ?? []}
          placeholder="Type options + Enter"
          style={{ width: '100%', marginBottom: 8 }}
          onChange={(options: string[]) => onChange({ options })}
        />
      )}

      <FilterControl filter={filter} />
    </div>
  );
}
