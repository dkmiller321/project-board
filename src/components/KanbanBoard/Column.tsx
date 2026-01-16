import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { ColumnId, TaskCard } from '../../types';
import { COLUMN_TITLES } from '../../types';
import { useApp } from '../../context/AppContext';
import { Card } from './Card';
import styles from './KanbanBoard.module.css';

interface ColumnProps {
  columnId: ColumnId;
  cards: TaskCard[];
}

export function Column({ columnId, cards }: ColumnProps) {
  const { actions } = useApp();
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: columnId,
    data: {
      type: 'column',
      columnId,
    },
  });

  const handleAddCard = () => {
    const title = newCardTitle.trim();
    if (title) {
      actions.addCard(columnId, title);
      setNewCardTitle('');
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddCard();
    } else if (e.key === 'Escape') {
      setNewCardTitle('');
      setIsAdding(false);
    }
  };

  const cardIds = cards.map((c) => c.id);

  return (
    <div className={styles.column}>
      <div className={styles.columnHeader}>
        <h3 className={styles.columnTitle}>{COLUMN_TITLES[columnId]}</h3>
        <span className={styles.columnCount}>{cards.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`${styles.columnContent} ${isOver ? styles.columnOver : ''}`}
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <Card key={card.id} card={card} />
          ))}
        </SortableContext>
        {cards.length === 0 && !isAdding && (
          <div className={styles.emptyColumn}>Drop cards here</div>
        )}
      </div>
      <div className={styles.columnFooter}>
        {isAdding ? (
          <div className={styles.addCardForm}>
            <input
              type="text"
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (!newCardTitle.trim()) {
                  setIsAdding(false);
                }
              }}
              placeholder="Card title..."
              className={styles.addCardInput}
              autoFocus
            />
            <div className={styles.addCardActions}>
              <button onClick={handleAddCard} className={styles.addCardBtn}>
                Add
              </button>
              <button
                onClick={() => {
                  setNewCardTitle('');
                  setIsAdding(false);
                }}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setIsAdding(true)} className={styles.addCardTrigger}>
            + Add card
          </button>
        )}
      </div>
    </div>
  );
}
