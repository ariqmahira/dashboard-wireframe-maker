import { useState } from 'react';
import {
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useBuilderStore } from '../store/useBuilderStore';
import { CHART_LABELS, type ChartType } from '../store/types';

type Sections = ReturnType<typeof useBuilderStore.getState>['project']['sections'];

function locateCard(sections: Sections, cardId: string) {
  for (const s of sections) {
    const idx = s.cards.findIndex((c) => c.id === cardId);
    if (idx !== -1) return { sectionId: s.id, index: idx };
  }
  return null;
}

/** Wires palette-to-canvas drops and cross-section card reordering for one DndContext. */
export function useCanvasDnd() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const isPalette = activeId?.startsWith('palette:');

  function targetSectionAndIndex(sections: Sections, overId: string) {
    if (overId.startsWith('section:')) {
      const sectionId = overId.slice('section:'.length);
      const sec = sections.find((s) => s.id === sectionId);
      return sec ? { sectionId, index: sec.cards.length } : null;
    }
    return locateCard(sections, overId);
  }

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    const active = String(e.active.id);
    setActiveId(null);
    if (!e.over) return;
    const { project } = useBuilderStore.getState();
    const { moveCard, addCard } = useBuilderStore.getState();
    const target = targetSectionAndIndex(project.sections, String(e.over.id));
    if (!target) return;

    if (active.startsWith('palette:')) {
      addCard(target.sectionId, active.slice('palette:'.length) as ChartType);
      return;
    }
    const from = locateCard(project.sections, active);
    if (!from) return;
    if (from.sectionId === target.sectionId && from.index === target.index) return;
    moveCard(from.sectionId, from.index, target.sectionId, target.index);
  }

  const overlay = (
    <DragOverlay>
      {isPalette && activeId && (
        <div style={{ padding: '8px 12px', background: '#1677ff', color: '#fff', borderRadius: 6, fontSize: 13 }}>
          {CHART_LABELS[activeId.slice('palette:'.length) as ChartType]}
        </div>
      )}
    </DragOverlay>
  );

  return {
    sensors,
    collisionDetection: closestCorners,
    onDragStart,
    onDragEnd,
    onDragCancel: () => setActiveId(null),
    overlay,
  };
}
