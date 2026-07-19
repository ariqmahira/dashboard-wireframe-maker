import { useEffect, useState } from 'react';
import { Tabs } from 'antd';
import { ControlOutlined, FilterOutlined } from '@ant-design/icons';
import FilterBuilder from '../filters/FilterBuilder';
import PropertiesPanel from './PropertiesPanel';
import { useBuilderStore } from '../../store/useBuilderStore';
import type { Card } from '../../store/types';

export default function RightPanel({
  onEditCardHtml,
  onEditCustomHtml,
}: {
  onEditCardHtml: (card: Card) => void;
  onEditCustomHtml: (card: Card, sectionId: string) => void;
}) {
  const selection = useBuilderStore((s) => s.selection);
  const [activeKey, setActiveKey] = useState('filters');

  // Surface the Properties tab whenever a card or section is selected on the canvas.
  useEffect(() => {
    if (selection) setActiveKey('properties');
  }, [selection]);

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <Tabs
        activeKey={activeKey}
        onChange={setActiveKey}
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
            children: <PropertiesPanel onEditCardHtml={onEditCardHtml} onEditCustomHtml={onEditCustomHtml} />,
          },
        ]}
      />
    </div>
  );
}
