import { useEffect, useState, type ReactNode } from 'react';
import { Alert, Modal, Segmented } from 'antd';
import { RawHtml } from '../common/Html';
import VisualHtmlEditor from './VisualHtmlEditor';

export default function HtmlEditorModal({
  open,
  title,
  value,
  hint,
  extra,
  slotToken,
  onSave,
  onClose,
}: {
  open: boolean;
  title: string;
  value: string;
  hint?: string;
  extra?: ReactNode;
  slotToken?: boolean;
  onSave: (html: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(value);
  const [mode, setMode] = useState<'visual' | 'code'>('visual');
  useEffect(() => {
    if (open) {
      setDraft(value);
      setMode('visual');
    }
  }, [open, value]);

  return (
    <Modal
      open={open}
      title={title}
      width={860}
      onCancel={onClose}
      onOk={() => {
        onSave(draft);
        onClose();
      }}
      okText="Apply"
    >
      {hint && <Alert type="info" showIcon message={hint} style={{ marginBottom: 12 }} />}
      {extra}
      <Segmented
        value={mode}
        onChange={(m) => setMode(m as 'visual' | 'code')}
        options={[
          { label: 'Visual', value: 'visual' },
          { label: 'Code', value: 'code' },
        ]}
        style={{ marginTop: 8, marginBottom: 8 }}
      />
      {mode === 'visual' ? (
        <VisualHtmlEditor value={draft} onChange={setDraft} slotToken={slotToken} />
      ) : (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
        <div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>HTML</div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck={false}
            style={{
              width: '100%',
              height: 320,
              fontFamily: 'monospace',
              fontSize: 12,
              padding: 10,
              border: '1px solid #d9d9d9',
              borderRadius: 6,
              resize: 'vertical',
            }}
          />
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Preview</div>
          <div style={{ height: 320, border: '1px solid #f0f0f0', borderRadius: 6, overflow: 'auto', background: '#fff' }}>
            <RawHtml html={draft.replace('{{content}}', '<div style="padding:16px;color:#bbb;text-align:center;">[ chart content ]</div>')} />
          </div>
        </div>
      </div>
      )}
    </Modal>
  );
}
