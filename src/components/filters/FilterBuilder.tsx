import { Button, Collapse, Dropdown, Empty } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import FilterItem from './FilterItem';
import { FILTER_LABELS, type FilterGroup, type FilterType } from '../../store/types';
import { useBuilderStore } from '../../store/useBuilderStore';

const typeMenu = (Object.keys(FILTER_LABELS) as FilterType[]).map((t) => ({ key: t, label: FILTER_LABELS[t] }));

function Group({ group, title }: { group: FilterGroup; title: string }) {
  const filters = useBuilderStore((s) => s.project.filters[group]);
  const { addFilter } = useBuilderStore.getState();
  return (
    <div>
      <Dropdown
        menu={{ items: typeMenu, onClick: ({ key }) => addFilter(group, key as FilterType) }}
        trigger={['click']}
      >
        <Button size="small" type="dashed" block icon={<PlusOutlined />} style={{ marginBottom: 10 }}>
          Add {title} filter
        </Button>
      </Dropdown>
      {filters.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No filters" />
      ) : (
        filters.map((f) => <FilterItem key={f.id} group={group} filter={f} />)
      )}
    </div>
  );
}

export default function FilterBuilder() {
  return (
    <div style={{ padding: 12 }}>
      <Collapse
        defaultActiveKey={['common', 'advanced']}
        items={[
          { key: 'common', label: 'Common Filter', children: <Group group="common" title="common" /> },
          { key: 'advanced', label: 'Advanced Filter', children: <Group group="advanced" title="advanced" /> },
        ]}
      />
    </div>
  );
}
