import { DatePicker, Select } from 'antd';
import type { Filter, FilterGroup } from '../../store/types';
import { useBuilderStore } from '../../store/useBuilderStore';
import FilterEditor from './FilterEditor';

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

  return (
    <FilterEditor
      filter={filter}
      onChange={(patch) => updateFilter(group, filter.id, patch)}
      onRemove={() => removeFilter(group, filter.id)}
    />
  );
}
