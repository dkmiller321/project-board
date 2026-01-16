import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TaskCard, ColumnId } from '../../types';
import { useApp } from '../../context/AppContext';
import styles from './KanbanBoard.module.css';

interface CardProps {
  card: TaskCard;
  columnId: ColumnId;
  isDragOverlay?: boolean;
}

export function Card({ card, columnId, isDragOverlay }: CardProps) {
  const { actions } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(card.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: 'card',
      card,
      columnId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== card.title) {
      actions.updateCard(card.id, trimmed, card.description);
    } else {
      setEditTitle(card.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditTitle(card.title);
      setIsEditing(false);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    actions.deleteCard(card.id, columnId);
  };

  if (isDragOverlay) {
    return (
      <div className={`${styles.card} ${styles.cardDragging}`}>
        <span className={styles.cardTitle}>{card.title}</span>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={styles.card}
      {...attributes}
      {...listeners}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={styles.cardInput}
        />
      ) : (
        <>
          <span
            className={styles.cardTitle}
            onDoubleClick={() => setIsEditing(true)}
          >
            {card.title}
          </span>
          <button
            onClick={handleDelete}
            className={styles.cardDelete}
            aria-label="Delete card"
          >
            ×
          </button>
        </>
      )}
    </div>
  );
}
