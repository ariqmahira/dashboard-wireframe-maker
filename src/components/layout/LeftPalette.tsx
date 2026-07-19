import { useDraggable } from '@dnd-kit/core';
import { Button, Divider, Space, Typography } from 'antd';
import {
  AppstoreOutlined,
  BarChartOutlined,
  BarsOutlined,
  BorderOutlined,
  CodeOutlined,
  CalendarOutlined,
  DotChartOutlined,
  ExperimentOutlined,
  FieldNumberOutlined,
  FilterOutlined,
  FundOutlined,
  HeatMapOutlined,
  LineChartOutlined,
  PictureOutlined,
  PieChartOutlined,
  PlusOutlined,
  RadarChartOutlined,
  SelectOutlined,
  TableOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';
import {
  CHART_LABELS,
  CHART_TYPES,
  FILTER_LABELS,
  type ChartType,
  type FilterType,
} from '../../store/types';
import { useBuilderStore } from '../../store/useBuilderStore';

const ICONS: Record<ChartType, ReactNode> = {
  line: <LineChartOutlined />,
  bar: <BarChartOutlined />,
  hbar: <BarsOutlined />,
  area: <AreaIcon />,
  pie: <PieChartOutlined />,
  scatter: <DotChartOutlined />,
  gauge: <FundOutlined />,
  radar: <RadarChartOutlined />,
  funnel: <FilterIcon />,
  heatmap: <HeatMapOutlined />,
  stat: <FieldNumberOutlined />,
  table: <TableOutlined />,
  image: <PictureOutlined />,
  customHtml: <CodeOutlined />,
  customEcharts: <ExperimentOutlined />,
  filter: <FilterOutlined />,
};

const FILTER_ICONS: Record<FilterType, ReactNode> = {
  'single-select': <SelectOutlined />,
  'multi-select': <SelectOutlined />,
  'single-date': <CalendarOutlined />,
  'multi-date': <CalendarOutlined />,
};

function AreaIcon() {
  return <LineChartOutlined />;
}
function FilterIcon() {
  return <BorderOutlined />;
}

function DraggableTile({ id, icon, label }: { id: string; icon: ReactNode; label: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        padding: '10px 4px',
        border: '1px solid #f0f0f0',
        borderRadius: 8,
        cursor: 'grab',
        background: '#fff',
        opacity: isDragging ? 0.4 : 1,
        fontSize: 12,
        color: '#555',
        userSelect: 'none',
        textAlign: 'center',
      }}
    >
      <span style={{ fontSize: 18, color: '#1677ff' }}>{icon}</span>
      {label}
    </div>
  );
}

export default function LeftPalette({
  onEditPlaceholder,
  onEditTemplate,
}: {
  onEditPlaceholder: (key: 'header' | 'sidemenu' | 'footer') => void;
  onEditTemplate: () => void;
}) {
  const { addSection } = useBuilderStore.getState();
  return (
    <div style={{ padding: 12, height: '100%', overflow: 'auto' }}>
      <Typography.Text strong>Components</Typography.Text>
      <Typography.Paragraph type="secondary" style={{ fontSize: 11, marginTop: 2 }}>
        Drag a chart onto a section
      </Typography.Paragraph>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {CHART_TYPES.map((t) => (
          <DraggableTile key={t} id={`palette:${t}`} icon={ICONS[t]} label={CHART_LABELS[t]} />
        ))}
      </div>

      <Divider style={{ margin: '16px 0 12px' }} />
      <Typography.Text strong>Filters</Typography.Text>
      <Typography.Paragraph type="secondary" style={{ fontSize: 11, marginTop: 2 }}>
        Drag a filter onto a section (no card container)
      </Typography.Paragraph>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {(Object.keys(FILTER_LABELS) as FilterType[]).map((t) => (
          <DraggableTile key={t} id={`palette:filter:${t}`} icon={FILTER_ICONS[t]} label={FILTER_LABELS[t]} />
        ))}
      </div>

      <Divider style={{ margin: '16px 0 12px' }} />
      <Button block icon={<PlusOutlined />} onClick={() => addSection()}>
        Add Section
      </Button>

      <Divider style={{ margin: '16px 0 12px' }} />
      <Typography.Text strong>Layout chrome</Typography.Text>
      <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
        <Button block icon={<AppstoreOutlined />} onClick={() => onEditPlaceholder('header')}>
          Edit Header HTML
        </Button>
        <Button block icon={<AppstoreOutlined />} onClick={() => onEditPlaceholder('sidemenu')}>
          Edit Sidemenu HTML
        </Button>
        <Button block icon={<AppstoreOutlined />} onClick={() => onEditPlaceholder('footer')}>
          Edit Footer HTML
        </Button>
        <Button block icon={<AppstoreOutlined />} onClick={onEditTemplate}>
          Edit Card Container
        </Button>
      </Space>
    </div>
  );
}
