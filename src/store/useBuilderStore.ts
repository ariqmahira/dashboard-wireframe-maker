import { create } from 'zustand';
import { temporal } from 'zundo';
import { nanoid } from 'nanoid';
import type {
  Card,
  ChartType,
  Filter,
  FilterGroup,
  FilterType,
  Placeholder,
  Project,
  Section,
  Selection,
} from './types';
import { createDefaultProject, makeCard, makeFilter, makeFilterCard } from './defaultProject';

type PlaceholderKey = 'header' | 'sidemenu' | 'footer';

interface BuilderState {
  project: Project;
  selection: Selection;
  previewMode: boolean;

  setProjectName: (name: string) => void;
  addSection: () => void;
  updateSection: (id: string, patch: Partial<Omit<Section, 'id' | 'cards'>>) => void;
  removeSection: (id: string) => void;
  moveSection: (fromIndex: number, toIndex: number) => void;

  addCard: (sectionId: string, type: ChartType) => void;
  addFilterCard: (sectionId: string, type: FilterType) => void;
  updateCard: (sectionId: string, cardId: string, patch: Partial<Omit<Card, 'id'>>) => void;
  removeCard: (sectionId: string, cardId: string) => void;
  duplicateCard: (sectionId: string, cardId: string) => void;
  setSpan: (sectionId: string, cardId: string, span: number) => void;
  setOffset: (sectionId: string, cardId: string, offset: number) => void;
  setRowSpan: (sectionId: string, cardId: string, rowSpan: number) => void;
  moveCard: (
    fromSectionId: string,
    fromIndex: number,
    toSectionId: string,
    toIndex: number
  ) => void;

  addFilter: (group: FilterGroup, type: FilterType) => void;
  updateFilter: (group: FilterGroup, id: string, patch: Partial<Omit<Filter, 'id'>>) => void;
  removeFilter: (group: FilterGroup, id: string) => void;

  setPlaceholder: (key: PlaceholderKey, patch: Partial<Placeholder>) => void;
  setCardTemplate: (html: string) => void;

  loadProject: (project: Project) => void;
  select: (selection: Selection) => void;
  setPreview: (value: boolean) => void;
}

function touch(project: Project): Project {
  return { ...project, meta: { ...project.meta, updatedAt: new Date().toISOString() } };
}

function mapSections(
  project: Project,
  fn: (sections: Section[]) => Section[]
): Project {
  return touch({ ...project, sections: fn(project.sections) });
}

function updateSectionCards(
  project: Project,
  sectionId: string,
  fn: (cards: Card[]) => Card[]
): Project {
  return mapSections(project, (sections) =>
    sections.map((s) => (s.id === sectionId ? { ...s, cards: fn(s.cards) } : s))
  );
}

export const useBuilderStore = create<BuilderState>()(
  temporal(
    (set) => ({
      project: createDefaultProject(),
      selection: null,
      previewMode: false,

      setProjectName: (name) =>
        set((st) => ({ project: touch({ ...st.project, meta: { ...st.project.meta, name } }) })),

      addSection: () =>
        set((st) => {
          const section: Section = {
            id: nanoid(8),
            title: 'New Section',
            subtitle: '',
            cards: [],
          };
          return {
            project: mapSections(st.project, (s) => [...s, section]),
            selection: { kind: 'section', sectionId: section.id },
          };
        }),

      updateSection: (id, patch) =>
        set((st) => ({
          project: mapSections(st.project, (sections) =>
            sections.map((s) => (s.id === id ? { ...s, ...patch } : s))
          ),
        })),

      removeSection: (id) =>
        set((st) => ({
          project: mapSections(st.project, (sections) => sections.filter((s) => s.id !== id)),
          selection: null,
        })),

      moveSection: (fromIndex, toIndex) =>
        set((st) => ({
          project: mapSections(st.project, (sections) => {
            if (fromIndex < 0 || fromIndex >= sections.length) return sections;
            const next = [...sections];
            const [moved] = next.splice(fromIndex, 1);
            next.splice(Math.min(Math.max(0, toIndex), next.length), 0, moved);
            return next;
          }),
        })),

      addCard: (sectionId, type) =>
        set((st) => {
          const card = makeCard(type);
          return {
            project: updateSectionCards(st.project, sectionId, (cards) => [...cards, card]),
            selection: { kind: 'card', sectionId, cardId: card.id },
          };
        }),

      addFilterCard: (sectionId, type) =>
        set((st) => {
          const card = makeFilterCard(type);
          return {
            project: updateSectionCards(st.project, sectionId, (cards) => [...cards, card]),
            selection: { kind: 'card', sectionId, cardId: card.id },
          };
        }),

      updateCard: (sectionId, cardId, patch) =>
        set((st) => ({
          project: updateSectionCards(st.project, sectionId, (cards) =>
            cards.map((c) => (c.id === cardId ? { ...c, ...patch } : c))
          ),
        })),

      removeCard: (sectionId, cardId) =>
        set((st) => ({
          project: updateSectionCards(st.project, sectionId, (cards) =>
            cards.filter((c) => c.id !== cardId)
          ),
          selection: null,
        })),

      duplicateCard: (sectionId, cardId) =>
        set((st) => ({
          project: updateSectionCards(st.project, sectionId, (cards) => {
            const idx = cards.findIndex((c) => c.id === cardId);
            if (idx === -1) return cards;
            const copy: Card = { ...cards[idx], id: nanoid(8) };
            const next = [...cards];
            next.splice(idx + 1, 0, copy);
            return next;
          }),
        })),

      setSpan: (sectionId, cardId, span) =>
        set((st) => ({
          project: updateSectionCards(st.project, sectionId, (cards) =>
            cards.map((c) => (c.id === cardId ? { ...c, span: Math.min(24, Math.max(1, span)) } : c))
          ),
        })),

      setOffset: (sectionId, cardId, offset) =>
        set((st) => ({
          project: updateSectionCards(st.project, sectionId, (cards) =>
            cards.map((c) => (c.id === cardId ? { ...c, offset: Math.min(23, Math.max(0, offset)) } : c))
          ),
        })),

      setRowSpan: (sectionId, cardId, rowSpan) =>
        set((st) => ({
          project: updateSectionCards(st.project, sectionId, (cards) =>
            cards.map((c) => (c.id === cardId ? { ...c, rowSpan: Math.min(24, Math.max(1, rowSpan)) } : c))
          ),
        })),

      moveCard: (fromSectionId, fromIndex, toSectionId, toIndex) =>
        set((st) => {
          const fromSection = st.project.sections.find((s) => s.id === fromSectionId);
          if (!fromSection) return {};
          const moved = fromSection.cards[fromIndex];
          if (!moved) return {};

          if (fromSectionId === toSectionId) {
            // reorder within the same section
            return {
              project: updateSectionCards(st.project, fromSectionId, (cards) => {
                const next = [...cards];
                next.splice(fromIndex, 1);
                next.splice(Math.min(Math.max(0, toIndex), next.length), 0, moved);
                return next;
              }),
            };
          }

          let project = st.project;
          project = updateSectionCards(project, fromSectionId, (cards) =>
            cards.filter((_, i) => i !== fromIndex)
          );
          project = updateSectionCards(project, toSectionId, (cards) => {
            const next = [...cards];
            next.splice(Math.min(Math.max(0, toIndex), next.length), 0, moved);
            return next;
          });
          return { project };
        }),

      addFilter: (group, type) =>
        set((st) => {
          const filter: Filter = makeFilter(type, 'New Filter');
          return {
            project: touch({
              ...st.project,
              filters: { ...st.project.filters, [group]: [...st.project.filters[group], filter] },
            }),
          };
        }),

      updateFilter: (group, id, patch) =>
        set((st) => ({
          project: touch({
            ...st.project,
            filters: {
              ...st.project.filters,
              [group]: st.project.filters[group].map((f) => (f.id === id ? { ...f, ...patch } : f)),
            },
          }),
        })),

      removeFilter: (group, id) =>
        set((st) => ({
          project: touch({
            ...st.project,
            filters: {
              ...st.project.filters,
              [group]: st.project.filters[group].filter((f) => f.id !== id),
            },
          }),
        })),

      setPlaceholder: (key, patch) =>
        set((st) => ({
          project: touch({
            ...st.project,
            placeholders: {
              ...st.project.placeholders,
              [key]: { ...st.project.placeholders[key], ...patch },
            },
          }),
        })),

      setCardTemplate: (html) =>
        set((st) => ({ project: touch({ ...st.project, cardContainerTemplate: html }) })),

      loadProject: (project) => set({ project, selection: null }),
      select: (selection) => set({ selection }),
      setPreview: (value) => set({ previewMode: value }),
    }),
    {
      // only track the document in undo history, not UI selection / preview toggle
      partialize: (state) => ({ project: state.project }),
      limit: 100,
    }
  )
);
