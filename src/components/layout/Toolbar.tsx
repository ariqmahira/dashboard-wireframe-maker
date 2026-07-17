import { useRef } from 'react';
import { useStore } from 'zustand';
import { App, Button, Divider, Input, Space, Switch, Tooltip, Typography } from 'antd';
import {
  DownloadOutlined,
  ExportOutlined,
  EyeOutlined,
  RedoOutlined,
  UndoOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useBuilderStore } from '../../store/useBuilderStore';
import { buildHtml } from '../../export/exportHtml';
import { downloadHtml, exportJson, importJson } from '../../export/projectIo';

export default function Toolbar() {
  const { message } = App.useApp();
  const name = useBuilderStore((s) => s.project.meta.name);
  const preview = useBuilderStore((s) => s.previewMode);
  const { setProjectName, setPreview, loadProject } = useBuilderStore.getState();

  const { undo, redo, pastStates, futureStates } = useStore(useBuilderStore.temporal, (s) => s);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const project = await importJson(file);
      loadProject(project);
      message.success('Wireframe loaded');
    } catch (err) {
      message.error((err as Error).message);
    }
  }

  function onExportHtml() {
    const project = useBuilderStore.getState().project;
    try {
      downloadHtml(project, buildHtml(project));
      message.success('HTML exported');
    } catch {
      message.error('Failed to export HTML');
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 16px',
        height: '100%',
        background: '#fff',
        borderBottom: '1px solid #e8e8e8',
      }}
    >
      <Typography.Text strong style={{ fontSize: 15, color: '#1677ff', whiteSpace: 'nowrap' }}>
        ◧ Wireframe Builder
      </Typography.Text>
      <Divider type="vertical" style={{ height: 24, margin: '0 4px' }} />
      <Typography.Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
        Project
      </Typography.Text>
      <Input
        value={name}
        onChange={(e) => setProjectName(e.target.value)}
        style={{ width: 240 }}
        placeholder="Wireframe name"
      />

      <Space size={8} style={{ marginLeft: 'auto' }}>
        <Tooltip title="Undo">
          <Button icon={<UndoOutlined />} disabled={pastStates.length === 0} onClick={() => undo()} />
        </Tooltip>
        <Tooltip title="Redo">
          <Button icon={<RedoOutlined />} disabled={futureStates.length === 0} onClick={() => redo()} />
        </Tooltip>

        <Divider type="vertical" style={{ height: 24 }} />

        <Tooltip title="Toggle edit / preview">
          <Switch
            checkedChildren={<span><EyeOutlined /> Preview</span>}
            unCheckedChildren="Edit"
            checked={preview}
            onChange={setPreview}
          />
        </Tooltip>

        <Divider type="vertical" style={{ height: 24 }} />

        <Button icon={<UploadOutlined />} onClick={() => fileRef.current?.click()}>Import</Button>
        <Button icon={<DownloadOutlined />} onClick={() => exportJson(useBuilderStore.getState().project)}>Save JSON</Button>
        <Button type="primary" icon={<ExportOutlined />} onClick={onExportHtml}>Export HTML</Button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={onFile} />
      </Space>
    </div>
  );
}
