import { Button, DatePicker, Input, Select, Space } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { FILTER_LABELS, type Filter, type FilterGroup, type FilterType } from '../../store/types';
import { useBuilderStore } from '../../store/useBuilderStore';

const { RangePicker } = DatePicker;

export function FilterControl({ filter }: { filter: Filter }) {
  const opts = (filter.options ?? []).map((o) => ({ label: o, value: o }));
  switch (filter.type) {
    case 'single-select':
      return <Select placeholder={filter.label} options={opts} style={{ width: '100%' }} allowClear />;
    case 'multi-select':
      return <Select mode="multiple" placeholder={filter.label} options={opts} style={{ width: '100%' }} allowClear />;
    case 'single-date':
      return <DatePicker placeholder={filter.label} style={{ width: '100%' }} />;
    case 'multi-date':
      return <RangePicker style={{ width: '100%' }} />;
    default:
      return null;
  }
}

export default function FilterItem({ group, filter }: { group: FilterGroup; filter: Filter }) {
  const { updateFilter, removeFilter } = useBuilderStore.getState();
  const isSelect = filter.type.includes('select');

  return (
    <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 10, marginBottom: 8, background: '#fff' }}>
      <Space.Compact style={{ width: '100%', marginBottom: 8 }}>
        <Input
          value={filter.label}
          onChange={(e) => updateFilter(group, filter.id, { label: e.target.value })}
          placeholder="Label"
        />
        <Button danger icon={<DeleteOutlined />} onClick={() => removeFilter(group, filter.id)} />
      </Space.Compact>

      <Select
        size="small"
        value={filter.type}
        style={{ width: '100%', marginBottom: 8 }}
        onChange={(type: FilterType) =>
          updateFilter(group, filter.id, {
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
          onChange={(options: string[]) => updateFilter(group, filter.id, { options })}
        />
      )}

      <FilterControl filter={filter} />
    </div>
  );
}
