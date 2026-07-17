import { Button, Divider, Empty, Form, Input, InputNumber, Select, Slider, Switch, Typography } from 'antd';
import { Html5Outlined } from '@ant-design/icons';
import { CHART_LABELS, CHART_TYPES, type Card, type ChartType, type TooltipMock } from '../../store/types';
import { useBuilderStore } from '../../store/useBuilderStore';
import { defaultTooltip } from '../../charts/annotations';
import ChartDataEditor from './ChartDataEditor';

export default function PropertiesPanel({ onEditCardHtml }: { onEditCardHtml: (card: Card) => void }) {
  const selection = useBuilderStore((s) => s.selection);
  const sections = useBuilderStore((s) => s.project.sections);
  const { updateCard, setSpan, updateSection } = useBuilderStore.getState();

  if (!selection) {
    return (
      <div style={{ padding: 24 }}>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Select a card or section to edit its properties" />
      </div>
    );
  }

  const section = sections.find((s) => s.id === selection.sectionId);
  if (!section) return null;

  if (selection.kind === 'section') {
    return (
      <div style={{ padding: 16 }}>
        <Typography.Text type="secondary">Section</Typography.Text>
        <Form layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item label="Title">
            <Input value={section.title} onChange={(e) => updateSection(section.id, { title: e.target.value })} />
          </Form.Item>
          <Form.Item label="Subtitle">
            <Input value={section.subtitle} onChange={(e) => updateSection(section.id, { subtitle: e.target.value })} />
          </Form.Item>
          <Typography.Paragraph type="secondary" style={{ fontSize: 12 }}>
            Sections always span the full width (24 columns).
          </Typography.Paragraph>
        </Form>
      </div>
    );
  }

  const card = section.cards.find((c) => c.id === selection.cardId);
  if (!card) return null;

  return (
    <div style={{ padding: 16 }}>
      <Typography.Text type="secondary">Chart Card</Typography.Text>
      <Form layout="vertical" style={{ marginTop: 8 }}>
        <Form.Item label="Chart type">
          <Select
            value={card.type}
            style={{ width: '100%' }}
            onChange={(type: ChartType) => updateCard(section.id, card.id, { type })}
            options={CHART_TYPES.map((t) => ({ value: t, label: CHART_LABELS[t] }))}
          />
        </Form.Item>
        <Form.Item label="Title">
          <Input value={card.title} onChange={(e) => updateCard(section.id, card.id, { title: e.target.value })} />
        </Form.Item>
        <Form.Item label="Subtitle">
          <Input value={card.subtitle} onChange={(e) => updateCard(section.id, card.id, { subtitle: e.target.value })} />
        </Form.Item>
        <Form.Item label={`Column span (${card.span}/24)`}>
          <Slider min={1} max={24} value={card.span} onChange={(v) => setSpan(section.id, card.id, v)} />
          <InputNumber min={1} max={24} value={card.span} onChange={(v) => v && setSpan(section.id, card.id, v)} style={{ width: '100%' }} />
        </Form.Item>

        <Divider style={{ margin: '4px 0 12px' }}>Data</Divider>
        <ChartDataEditor card={card} sectionId={section.id} />

        <Divider style={{ margin: '4px 0 12px' }}>Notes</Divider>
        <Form.Item>
          <Input.TextArea
            rows={2}
            value={card.notes ?? ''}
            placeholder="Add an annotation shown as a footnote on the card"
            onChange={(e) => updateCard(section.id, card.id, { notes: e.target.value })}
          />
        </Form.Item>

        <Divider style={{ margin: '4px 0 12px' }}>Mockup tooltip</Divider>
        {(() => {
          const tip: TooltipMock = card.tooltip ?? { enabled: false, title: '', body: '' };
          const setTip = (patch: Partial<TooltipMock>) =>
            updateCard(section.id, card.id, { tooltip: { ...tip, ...patch } });
          return (
            <>
              <Form.Item label="Show tooltip mockup">
                <Switch
                  checked={tip.enabled}
                  onChange={(v) =>
                    updateCard(section.id, card.id, {
                      tooltip: v
                        ? card.tooltip
                          ? { ...card.tooltip, enabled: true }
                          : defaultTooltip()
                        : { ...tip, enabled: false },
                    })
                  }
                />
              </Form.Item>
              <Form.Item label="Tooltip title">
                <Input
                  value={tip.title}
                  disabled={!tip.enabled}
                  placeholder="e.g. Jun"
                  onChange={(e) => setTip({ title: e.target.value })}
                />
              </Form.Item>
              <Form.Item label="Rows (one “Label: Value” per line)">
                <Input.TextArea
                  rows={3}
                  value={tip.body}
                  disabled={!tip.enabled}
                  placeholder={'Revenue: $128,430\nOrders: 1,204'}
                  onChange={(e) => setTip({ body: e.target.value })}
                />
              </Form.Item>
            </>
          );
        })()}

        <Button block icon={<Html5Outlined />} onClick={() => onEditCardHtml(card)}>
          Custom container HTML
        </Button>
      </Form>
    </div>
  );
}
