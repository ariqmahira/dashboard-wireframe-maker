import { Tabs } from 'antd';
import { ControlOutlined, FilterOutlined } from '@ant-design/icons';
import FilterBuilder from '../filters/FilterBuilder';
import PropertiesPanel from './PropertiesPanel';
import type { Card } from '../../store/types';

export default function RightPanel({ onEditCardHtml }: { onEditCardHtml: (card: Card) => void }) {
  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <Tabs
        defaultActiveKey="filters"
        centered
        style={{ padding: '0 4px' }}
        items={[
          {
            key: 'filters',
            label: (<span><FilterOutlined /> Filters</span>),
            children: <FilterBuilder />,
          },
          {
            key: 'properties',
            label: (<span><ControlOutlined /> Properties</span>),
            children: <PropertiesPanel onEditCardHtml={onEditCardHtml} />,
          },
        ]}
      />
    </div>
  );
}
