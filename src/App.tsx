import { useState } from 'react';
import { DndContext } from '@dnd-kit/core';
import { InputNumber, Layout, Space, Switch } from 'antd';
import Toolbar from './components/layout/Toolbar';
import LeftPalette from './components/layout/LeftPalette';
import RightPanel from './components/layout/RightPanel';
import Canvas from './components/canvas/Canvas';
import HtmlEditorModal from './components/modals/HtmlEditorModal';
import { useCanvasDnd } from './hooks/useCanvasDnd';
import { useBuilderStore } from './store/useBuilderStore';
import type { Card } from './store/types';

const { Header, Sider, Content } = Layout;

type PlaceholderKey = 'header' | 'sidemenu' | 'footer';
type ModalState =
  | { kind: 'placeholder'; key: PlaceholderKey }
  | { kind: 'template' }
  | { kind: 'card'; card: Card }
  | { kind: 'customHtml'; card: Card; sectionId: string }
  | null;

const PLACEHOLDER_TITLES: Record<PlaceholderKey, string> = {
  header: 'Header',
  sidemenu: 'Sidemenu',
  footer: 'Footer',
};

export default function App() {
  const preview = useBuilderStore((s) => s.previewMode);
  const project = useBuilderStore((s) => s.project);
  const { setPlaceholder, setCardTemplate, updateCard } = useBuilderStore.getState();
  const dnd = useCanvasDnd();

  const [modal, setModal] = useState<ModalState>(null);

  function findCardSection(cardId: string): string | null {
    for (const s of project.sections) if (s.cards.some((c) => c.id === cardId)) return s.id;
    return null;
  }

  function renderModal() {
    if (!modal) return null;

    if (modal.kind === 'placeholder') {
      const ph = project.placeholders[modal.key];
      return (
        <HtmlEditorModal
          open
          title={`Edit ${PLACEHOLDER_TITLES[modal.key]} HTML`}
          hint="Paste custom HTML to mimic your real layout. Sizing is in pixels."
          value={ph.html}
          extra={
            <Space style={{ marginBottom: 8 }}>
              <span>Enabled</span>
              <Switch checked={ph.enabled} onChange={(v) => setPlaceholder(modal.key, { enabled: v })} />
              <span style={{ marginLeft: 12 }}>{modal.key === 'sidemenu' ? 'Width' : 'Height'} (px)</span>
              <InputNumber min={0} value={ph.size} onChange={(v) => v != null && setPlaceholder(modal.key, { size: v })} />
            </Space>
          }
          onSave={(html) => setPlaceholder(modal.key, { html })}
          onClose={() => setModal(null)}
        />
      );
    }

    if (modal.kind === 'template') {
      return (
        <HtmlEditorModal
          open
          title="Edit Card Container Template"
          hint="Use {{content}} where the chart/title should render. Applies to all cards without a custom override."
          value={project.cardContainerTemplate}
          slotToken
          onSave={(html) => setCardTemplate(html)}
          onClose={() => setModal(null)}
        />
      );
    }

    if (modal.kind === 'customHtml') {
      return (
        <HtmlEditorModal
          open
          title="Edit Custom HTML"
          hint="Style this card's content visually, or switch to Code for raw HTML."
          value={modal.card.config?.customHtml ?? ''}
          onSave={(html) =>
            updateCard(modal.sectionId, modal.card.id, {
              config: { ...modal.card.config, customHtml: html },
            })
          }
          onClose={() => setModal(null)}
        />
      );
    }

    // per-card container override
    return (
      <HtmlEditorModal
        open
        title="Edit Card Container (this card)"
        hint="Use {{content}} where the chart/title should render. Overrides the global template for this card only."
        value={modal.card.containerHtml || project.cardContainerTemplate}
        slotToken
        onSave={(html) => {
          const sectionId = findCardSection(modal.card.id);
          if (sectionId) updateCard(sectionId, modal.card.id, { containerHtml: html });
        }}
        onClose={() => setModal(null)}
      />
    );
  }

  const openCardHtml = (card: Card) => setModal({ kind: 'card', card });
  const openCustomHtml = (card: Card, sectionId: string) => setModal({ kind: 'customHtml', card, sectionId });
  const openPlaceholder = (key: PlaceholderKey) => setModal({ kind: 'placeholder', key });

  return (
    <Layout style={{ height: '100vh' }}>
      <Header style={{ height: 52, lineHeight: 'normal', padding: 0, background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', zIndex: 10 }}>
        <Toolbar />
      </Header>
      <DndContext
        sensors={dnd.sensors}
        collisionDetection={dnd.collisionDetection}
        onDragStart={dnd.onDragStart}
        onDragEnd={dnd.onDragEnd}
        onDragCancel={dnd.onDragCancel}
      >
        <Layout>
          {!preview && (
            <Sider width={200} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
              <LeftPalette onEditPlaceholder={openPlaceholder} onEditTemplate={() => setModal({ kind: 'template' })} />
            </Sider>
          )}
          <Content style={{ minWidth: 0 }}>
            <Canvas onEditCardHtml={openCardHtml} onEditPlaceholder={openPlaceholder} />
          </Content>
          {!preview && (
            <Sider width={320} theme="light" style={{ borderLeft: '1px solid #f0f0f0' }}>
              <RightPanel onEditCardHtml={openCardHtml} onEditCustomHtml={openCustomHtml} />
            </Sider>
          )}
        </Layout>
        {dnd.overlay}
      </DndContext>
      {renderModal()}
    </Layout>
  );
}
