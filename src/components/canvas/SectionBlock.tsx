import { Fragment } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, Col, Dropdown, Empty, Row, Space, Tooltip, Typography } from 'antd';
import { ControlOutlined, DeleteOutlined, HolderOutlined, PlusOutlined } from '@ant-design/icons';
import ChartCard from './ChartCard';
import { useBuilderStore } from '../../store/useBuilderStore';
import { CHART_LABELS, CHART_TYPES, type Card, type ChartType, type Section } from '../../store/types';
import { computeRowGroups, rowUsedSpan } from '../../store/rows';

export default function SectionBlock({
  section,
  onEditCardHtml,
}: {
  section: Section;
  onEditCardHtml: (card: Card) => void;
}) {
  const preview = useBuilderStore((s) => s.previewMode);
  const selection = useBuilderStore((s) => s.selection);
  const { select, updateSection, removeSection, addCard } = useBuilderStore.getState();

  const selected = selection?.kind === 'section' && selection.sectionId === section.id;

  const { setNodeRef, isOver } = useDroppable({
    id: `section:${section.id}`,
    data: { sectionId: section.id, container: true },
  });

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `section-move:${section.id}`, data: { sectionId: section.id }, disabled: preview });

  const menuItems = CHART_TYPES.map((t) => ({ key: t, label: CHART_LABELS[t] }));

  return (
    <div
      ref={setSortableRef}
      id={`cwb-sec-${section.id}`}
      onClick={() => !preview && select({ kind: 'section', sectionId: section.id })}
      style={{
        border: preview ? 'none' : '1px dashed #d9d9d9',
        outline: selected && !preview ? '2px solid #1677ff' : 'none',
        borderRadius: 8,
        padding: preview ? 0 : 12,
        marginBottom: 16,
        scrollMarginTop: 16,
        background: preview ? 'transparent' : '#fafafa',
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      {!preview && (
        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <Typography.Title
              level={5}
              style={{ margin: 0 }}
              editable={{ onChange: (v) => updateSection(section.id, { title: v }), triggerType: ['text'] }}
            >
              {section.title}
            </Typography.Title>
            <Typography.Text
              type="secondary"
              style={{ fontSize: 12 }}
              editable={{ onChange: (v) => updateSection(section.id, { subtitle: v }), triggerType: ['text'] }}
            >
              {section.subtitle || 'Add section subtitle'}
            </Typography.Text>
          </div>
          <Space onClick={(e) => e.stopPropagation()}>
            <Tooltip title="Drag to reorder section">
              <Button
                size="small"
                icon={<HolderOutlined />}
                style={{ cursor: 'grab' }}
                {...attributes}
                {...listeners}
              />
            </Tooltip>
            <Tooltip title="Edit section properties">
              <Button
                size="small"
                type={selected ? 'primary' : 'default'}
                icon={<ControlOutlined />}
                onClick={() => select({ kind: 'section', sectionId: section.id })}
              />
            </Tooltip>
            <Dropdown
              menu={{ items: menuItems, onClick: ({ key }) => addCard(section.id, key as ChartType) }}
              trigger={['click']}
            >
              <Button size="small" icon={<PlusOutlined />}>Add chart</Button>
            </Dropdown>
            <Tooltip title="Delete section">
              <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeSection(section.id)} />
            </Tooltip>
          </Space>
        </div>
      )}

      {preview && (section.title || section.subtitle) && (
        <div style={{ marginBottom: 10 }}>
          <Typography.Title level={5} style={{ margin: 0 }}>{section.title}</Typography.Title>
          {section.subtitle && <Typography.Text type="secondary" style={{ fontSize: 12 }}>{section.subtitle}</Typography.Text>}
        </div>
      )}

      <div
        ref={setNodeRef}
        style={{
          borderRadius: 6,
          minHeight: section.cards.length ? undefined : 96,
          background: isOver && !preview ? 'rgba(22,119,255,0.06)' : 'transparent',
          outline: isOver && !preview ? '2px dashed #1677ff' : 'none',
        }}
      >
        <SortableContext items={section.cards.map((c) => c.id)} strategy={rectSortingStrategy}>
          <Row gutter={[12, 12]} wrap>
            {computeRowGroups(section.cards).map((row, ri, all) => {
              const leftover = 24 - rowUsedSpan(row);
              return (
                <Fragment key={row[0].id}>
                  {row.map((card) => (
                    <ChartCard key={card.id} card={card} sectionId={section.id} onEditHtml={onEditCardHtml} />
                  ))}
                  {ri < all.length - 1 && leftover > 0 && <Col span={leftover} aria-hidden />}
                </Fragment>
              );
            })}
          </Row>
        </SortableContext>

        {section.cards.length === 0 && !preview && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 96 }}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Drop charts here or use “Add chart”" />
          </div>
        )}
      </div>
    </div>
  );
}
