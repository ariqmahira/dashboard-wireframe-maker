import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, Col, Space, Tooltip, Typography } from 'antd';
import {
  CopyOutlined,
  DeleteOutlined,
  DragOutlined,
  Html5Outlined,
} from '@ant-design/icons';
import ChartRenderer from '../../charts/ChartRenderer';
import { notesHtml, tooltipMockHtml } from '../../charts/annotations';
import { SlottedHtml } from '../common/Html';
import { FilterControl } from '../filters/FilterItem';
import CardFilterBar from '../filters/CardFilterBar';
import { useBuilderStore } from '../../store/useBuilderStore';
import type { Card } from '../../store/types';

export default function ChartCard({
  card,
  sectionId,
  onEditHtml,
}: {
  card: Card;
  sectionId: string;
  onEditHtml: (card: Card) => void;
}) {
  const preview = useBuilderStore((s) => s.previewMode);
  const template = useBuilderStore((s) => s.project.cardContainerTemplate);
  const selection = useBuilderStore((s) => s.selection);
  const { select, updateCard, removeCard, duplicateCard } = useBuilderStore.getState();

  const selected =
    selection?.kind === 'card' && selection.cardId === card.id;

  const isFilter = card.type === 'filter';

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id, data: { sectionId } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const html = card.containerHtml || template;

  // Standalone filter component — rendered without any card container.
  if (isFilter) {
    return (
      <Col span={card.span} offset={card.offset} style={style}>
        <div
          ref={setNodeRef}
          onClick={(e) => {
            e.stopPropagation();
            if (!preview) select({ kind: 'card', sectionId, cardId: card.id });
          }}
          style={{
            position: 'relative',
            outline: selected && !preview ? '2px solid #1677ff' : '2px solid transparent',
            borderRadius: 8,
            transition: 'outline-color .15s',
            padding: 4,
          }}
        >
          {!preview && (
            <div
              className="cwb-card-toolbar"
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                zIndex: 5,
                background: 'rgba(255,255,255,0.92)',
                borderRadius: 6,
                boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Space size={0}>
                <Tooltip title="Drag">
                  <Button type="text" size="small" icon={<DragOutlined />} {...attributes} {...listeners} style={{ cursor: 'grab' }} />
                </Tooltip>
                <Tooltip title="Duplicate">
                  <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => duplicateCard(sectionId, card.id)} />
                </Tooltip>
                <Tooltip title="Delete">
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => removeCard(sectionId, card.id)} />
                </Tooltip>
              </Space>
            </div>
          )}
          {card.filter && (
            <>
              <Typography.Text style={{ fontSize: 12, color: '#555', display: 'block', marginBottom: 4 }}>
                {card.filter.label}
              </Typography.Text>
              <FilterControl filter={card.filter} />
            </>
          )}
        </div>
      </Col>
    );
  }

  return (
    <Col span={card.span} offset={card.offset} style={style}>
      <div
        ref={setNodeRef}
        onClick={(e) => {
          e.stopPropagation();
          if (!preview) select({ kind: 'card', sectionId, cardId: card.id });
        }}
        style={{
          position: 'relative',
          height: '100%',
          outline: selected && !preview ? '2px solid #1677ff' : '2px solid transparent',
          borderRadius: 8,
          transition: 'outline-color .15s',
        }}
      >
        {!preview && (
          <div
            className="cwb-card-toolbar"
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              zIndex: 5,
              background: 'rgba(255,255,255,0.92)',
              borderRadius: 6,
              boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Space size={0}>
              <Tooltip title="Drag">
                <Button type="text" size="small" icon={<DragOutlined />} {...attributes} {...listeners} style={{ cursor: 'grab' }} />
              </Tooltip>
              <Tooltip title="Edit container HTML">
                <Button type="text" size="small" icon={<Html5Outlined />} onClick={() => onEditHtml(card)} />
              </Tooltip>
              <Tooltip title="Duplicate">
                <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => duplicateCard(sectionId, card.id)} />
              </Tooltip>
              <Tooltip title="Delete">
                <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => removeCard(sectionId, card.id)} />
              </Tooltip>
            </Space>
          </div>
        )}

        <SlottedHtml html={html}>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
            {card.tooltip?.enabled && (
              <div
                style={{ position: 'absolute', top: 46, right: 12, zIndex: 3, pointerEvents: 'none' }}
                dangerouslySetInnerHTML={{ __html: tooltipMockHtml(card.tooltip) }}
              />
            )}
            <div style={{ padding: '10px 12px 4px' }}>
              <Typography.Text
                strong
                style={{ fontSize: 14, display: 'block' }}
                editable={
                  preview ? false : { onChange: (v) => updateCard(sectionId, card.id, { title: v }), triggerType: ['text'] }
                }
              >
                {card.title}
              </Typography.Text>
              {(card.subtitle || !preview) && (
                <Typography.Text
                  type="secondary"
                  style={{ fontSize: 12, display: 'block' }}
                  editable={
                    preview ? false : { onChange: (v) => updateCard(sectionId, card.id, { subtitle: v }), triggerType: ['text'] }
                  }
                >
                  {card.subtitle || 'Add subtitle'}
                </Typography.Text>
              )}
            </div>
            {card.cardFilter?.enabled && <CardFilterBar filters={card.cardFilter.filters} />}
            <div style={{ flex: 1, minHeight: 0, padding: '0 8px 8px' }}>
              <ChartRenderer card={card} />
            </div>
            {card.notes && <div dangerouslySetInnerHTML={{ __html: notesHtml(card.notes) }} />}
          </div>
        </SlottedHtml>
      </div>
    </Col>
  );
}
