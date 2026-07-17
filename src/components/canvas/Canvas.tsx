import { Button, Empty } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import SectionBlock from './SectionBlock';
import PlaceholderFrame from './PlaceholderFrame';
import FilterPreview from '../filters/FilterPreview';
import { useBuilderStore } from '../../store/useBuilderStore';
import type { Card } from '../../store/types';

type PlaceholderKey = 'header' | 'sidemenu' | 'footer';

export default function Canvas({
  onEditCardHtml,
  onEditPlaceholder,
}: {
  onEditCardHtml: (card: Card) => void;
  onEditPlaceholder: (key: PlaceholderKey) => void;
}) {
  const sections = useBuilderStore((s) => s.project.sections);
  const preview = useBuilderStore((s) => s.previewMode);
  const { addSection, select } = useBuilderStore.getState();

  return (
    <div
      style={{ height: '100%', overflow: 'auto', padding: preview ? 0 : 16, background: '#f3f4f7' }}
      onClick={() => select(null)}
    >
      <div style={{ maxWidth: preview ? 'none' : 1200, margin: '0 auto', minHeight: preview ? '100%' : undefined }}>
        <PlaceholderFrame onEdit={onEditPlaceholder}>
          <div style={{ display: 'flex' }}>
            <div style={{ flex: 1, minWidth: 0, paddingRight: preview ? 16 : 0 }}>
              {sections.map((section) => (
                <SectionBlock key={section.id} section={section} onEditCardHtml={onEditCardHtml} />
              ))}
              {sections.length === 0 && <Empty description="No sections yet" style={{ padding: 40 }} />}
              {!preview && (
                <Button
                  type="dashed"
                  block
                  icon={<PlusOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    addSection();
                  }}
                  style={{ marginTop: 8 }}
                >
                  Add Section
                </Button>
              )}
            </div>
            {preview && <FilterPreview />}
          </div>
        </PlaceholderFrame>
      </div>
    </div>
  );
}
