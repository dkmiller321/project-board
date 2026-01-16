import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import type { ColumnId, TaskCard } from '../../types';
import { useApp } from '../../context/AppContext';
import { Column } from './Column';
import { Card } from './Card';
import styles from './KanbanBoard.module.css';

const COLUMN_IDS: ColumnId[] = ['todo', 'progress', 'complete'];

export function KanbanBoard() {
  const { state, actions } = useApp();
  const [activeCard, setActiveCard] = useState<TaskCard | null>(null);
  const [activeColumnId, setActiveColumnId] = useState<ColumnId | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findColumnForCard = (cardId: string): ColumnId | null => {
    for (const colId of COLUMN_IDS) {
      if (state.columns[colId].cardIds.includes(cardId)) {
        return colId;
      }
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const cardId = active.id as string;
    const card = state.cards[cardId];
    const columnId = findColumnForCard(cardId);

    if (card && columnId) {
      setActiveCard(card);
      setActiveColumnId(columnId);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !activeColumnId) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumn = activeColumnId;
    let overColumn: ColumnId | null = null;

    if (COLUMN_IDS.includes(overId as ColumnId)) {
      overColumn = overId as ColumnId;
    } else {
      overColumn = findColumnForCard(overId);
    }

    if (!overColumn || activeColumn === overColumn) return;

    const activeCards = [...state.columns[activeColumn].cardIds];
    const overCards = [...state.columns[overColumn].cardIds];

    const activeIndex = activeCards.indexOf(activeId);
    if (activeIndex === -1) return;

    activeCards.splice(activeIndex, 1);

    let newIndex = overCards.length;
    if (!COLUMN_IDS.includes(overId as ColumnId)) {
      const overIndex = overCards.indexOf(overId);
      if (overIndex !== -1) {
        newIndex = overIndex;
      }
    }

    actions.moveCard(activeId, activeColumn, overColumn, newIndex);
    setActiveColumnId(overColumn);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !activeColumnId) {
      setActiveCard(null);
      setActiveColumnId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) {
      setActiveCard(null);
      setActiveColumnId(null);
      return;
    }

    const currentColumn = activeColumnId;
    const cardIds = [...state.columns[currentColumn].cardIds];

    const activeIndex = cardIds.indexOf(activeId);
    const overIndex = cardIds.indexOf(overId);

    if (activeIndex !== -1 && overIndex !== -1) {
      const newCardIds = arrayMove(cardIds, activeIndex, overIndex);
      actions.reorderCards(currentColumn, newCardIds);
    }

    setActiveCard(null);
    setActiveColumnId(null);
  };

  return (
    <div className={styles.board}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {COLUMN_IDS.map((columnId) => (
          <Column key={columnId} columnId={columnId} />
        ))}
        <DragOverlay>
          {activeCard && activeColumnId ? (
            <Card card={activeCard} columnId={activeColumnId} isDragOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
