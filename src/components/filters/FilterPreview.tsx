import { useState } from 'react';
import { Button, Modal } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import { FilterControl } from './FilterItem';
import { useBuilderStore } from '../../store/useBuilderStore';
import type { Filter } from '../../store/types';

function FilterRows({ filters }: { filters: Filter[] }) {
  return (
    <>
      {filters.map((f) => (
        <div key={f.id} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>{f.label}</div>
          <FilterControl filter={f} />
        </div>
      ))}
    </>
  );
}

/** Read-only filter panel shown in preview mode and mirroring the exported sidebar. */
export default function FilterPreview() {
  const { common, advanced } = useBuilderStore((s) => s.project.filters);
  const sections = useBuilderStore((s) => s.project.sections);
  const [open, setOpen] = useState(false);

  const showSectionNav = sections.length > 1;

  if (!common.length && !advanced.length && !showSectionNav) return null;

  return (
    <aside style={{ width: 260, flex: '0 0 auto', background: '#fff', borderLeft: '1px solid #eee', padding: 16, overflow: 'auto' }}>
      {showSectionNav && (
        <nav style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, borderBottom: '1px solid #f0f0f0', paddingBottom: 6 }}>
            Sections
          </div>
          {sections.map((s, i) => (
            <a
              key={s.id}
              href={`#cwb-sec-${s.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(`cwb-sec-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              style={{ display: 'block', padding: '4px 0', fontSize: 13, color: '#1677ff', textDecoration: 'none', cursor: 'pointer' }}
            >
              {s.title || `Section ${i + 1}`}
            </a>
          ))}
        </nav>
      )}

      {(common.length > 0 || advanced.length > 0) && <div style={{ fontWeight: 600, marginBottom: 14 }}>Filters</div>}

      {common.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, borderBottom: '1px solid #f0f0f0', paddingBottom: 6 }}>
            Common Filter
          </div>
          <FilterRows filters={common} />
        </div>
      )}

      {advanced.length > 0 && (
        <Button block icon={<FilterOutlined />} onClick={() => setOpen(true)}>
          Advanced Filter
        </Button>
      )}

      <Modal title="Advanced Filter" open={open} onCancel={() => setOpen(false)} footer={null} destroyOnClose>
        <FilterRows filters={advanced} />
      </Modal>
    </aside>
  );
}
