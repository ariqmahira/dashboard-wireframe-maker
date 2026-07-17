import type { ReactNode } from 'react';
import { Button } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { RawHtml } from '../common/Html';
import { useBuilderStore } from '../../store/useBuilderStore';

type PlaceholderKey = 'header' | 'sidemenu' | 'footer';

function EditBadge({ onEdit, label }: { onEdit: () => void; label: string }) {
  return (
    <Button
      size="small"
      icon={<EditOutlined />}
      onClick={(e) => {
        e.stopPropagation();
        onEdit();
      }}
      style={{ position: 'absolute', top: 4, right: 4, zIndex: 10, opacity: 0.9 }}
    >
      {label}
    </Button>
  );
}

export default function PlaceholderFrame({
  children,
  onEdit,
}: {
  children: ReactNode;
  onEdit: (key: PlaceholderKey) => void;
}) {
  const { placeholders } = useBuilderStore((s) => s.project);
  const preview = useBuilderStore((s) => s.previewMode);
  const { header, sidemenu, footer } = placeholders;

  return (
    <div style={{ display: 'flex', minHeight: '100%', border: '1px solid #e8e8e8', background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
      {sidemenu.enabled && (
        <div style={{ position: 'relative', width: sidemenu.size, flex: '0 0 auto' }}>
          {!preview && <EditBadge onEdit={() => onEdit('sidemenu')} label="Menu" />}
          <RawHtml html={sidemenu.html} style={{ height: '100%' }} />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        {header.enabled && (
          <div style={{ position: 'relative', height: header.size, flex: '0 0 auto' }}>
            {!preview && <EditBadge onEdit={() => onEdit('header')} label="Header" />}
            <RawHtml html={header.html} style={{ height: '100%' }} />
          </div>
        )}

        <div style={{ flex: 1, minHeight: 0, padding: 16, background: preview ? '#f3f4f7' : '#fff' }}>
          {children}
        </div>

        {footer.enabled && (
          <div style={{ position: 'relative', height: footer.size, flex: '0 0 auto' }}>
            {!preview && <EditBadge onEdit={() => onEdit('footer')} label="Footer" />}
            <RawHtml html={footer.html} style={{ height: '100%' }} />
          </div>
        )}
      </div>
    </div>
  );
}
