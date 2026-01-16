import { useState, useMemo } from 'react';
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

  // Group cards by column
  const cardsByColumn = useMemo(() => {
    const grouped: Record<ColumnId, TaskCard[]> = {
      todo: [],
      progress: [],
      complete: [],
    };

    state.cards.forEach((card) => {
      if (card.column_id in grouped) {
        grouped[card.column_id].push(card);
      }
    });

    // Sort each column by position
    COLUMN_IDS.forEach((colId) => {
      grouped[colId].sort((a, b) => a.position - b.position);
    });

    return grouped;
  }, [state.cards]);

  const findColumnForCard = (cardId: string): ColumnId | null => {
    const card = state.cards.find((c) => c.id === cardId);
    return card ? card.column_id : null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const cardId = active.id as string;
    const card = state.cards.find((c) => c.id === cardId);

    if (card) {
      setActiveCard(card);
      setActiveColumnId(card.column_id);
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

    const overColumnCards = cardsByColumn[overColumn];
    let newIndex = overColumnCards.length;

    if (!COLUMN_IDS.includes(overId as ColumnId)) {
      const overIndex = overColumnCards.findIndex((c) => c.id === overId);
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
    const columnCards = cardsByColumn[currentColumn];
    const cardIds = columnCards.map((c) => c.id);

    const activeIndex = cardIds.indexOf(activeId);
    const overIndex = cardIds.indexOf(overId);

    if (activeIndex !== -1 && overIndex !== -1) {
      const newCardIds = arrayMove(cardIds, activeIndex, overIndex);
      actions.reorderCards(currentColumn, newCardIds);
    }

    setActiveCard(null);
    setActiveColumnId(null);
  };

  if (state.loading) {
    return (
      <div className={styles.board}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

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
          <Column
            key={columnId}
            columnId={columnId}
            cards={cardsByColumn[columnId]}
          />
        ))}
        <DragOverlay>
          {activeCard && activeColumnId ? (
            <Card card={activeCard} isDragOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
