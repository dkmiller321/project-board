import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { TaskCard, TodoItem, ColumnId } from '../types';
import type { CardRow, TodoRow, NoteRow, CardInsert, CardUpdate, TodoInsert, TodoUpdate, NoteInsert } from '../types/database';

function mapCardRow(row: CardRow): TaskCard {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    description: row.description ?? undefined,
    column_id: row.column_id as ColumnId,
    position: row.position,
    created_at: row.created_at,
  };
}

function mapTodoRow(row: TodoRow): TodoItem {
  return {
    id: row.id,
    user_id: row.user_id,
    text: row.text,
    completed: row.completed,
    created_at: row.created_at,
  };
}

export function useSupabaseState() {
  const { user } = useAuth();
  const [cards, setCards] = useState<TaskCard[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch all data on mount and when user changes
  useEffect(() => {
    if (!user) {
      setCards([]);
      setTodos([]);
      setNotes('');
      setLoading(false);
      return;
    }

    async function fetchData() {
      if (!user) return;

      setLoading(true);

      const [cardsResult, todosResult, notesResult] = await Promise.all([
        supabase
          .from('cards')
          .select('*')
          .eq('user_id', user.id)
          .order('position', { ascending: true }),
        supabase
          .from('todos')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true }),
        supabase.from('notes').select('*').eq('user_id', user.id).single(),
      ]);

      if (cardsResult.data) {
        setCards((cardsResult.data as CardRow[]).map(mapCardRow));
      }

      if (todosResult.data) {
        setTodos((todosResult.data as TodoRow[]).map(mapTodoRow));
      }

      if (notesResult.data) {
        setNotes((notesResult.data as NoteRow).content || '');
      }

      setLoading(false);
    }

    fetchData();
  }, [user]);

  // Realtime subscriptions
  useEffect(() => {
    if (!user) return;

    const cardsChannel = supabase
      .channel('cards-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cards',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newCard = mapCardRow(payload.new as CardRow);
            setCards((prev) => [...prev, newCard]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedCard = mapCardRow(payload.new as CardRow);
            setCards((prev) =>
              prev.map((card) => (card.id === updatedCard.id ? updatedCard : card))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedCard = payload.old as { id: string };
            setCards((prev) => prev.filter((card) => card.id !== deletedCard.id));
          }
        }
      )
      .subscribe();

    const todosChannel = supabase
      .channel('todos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newTodo = mapTodoRow(payload.new as TodoRow);
            setTodos((prev) => [...prev, newTodo]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedTodo = mapTodoRow(payload.new as TodoRow);
            setTodos((prev) =>
              prev.map((todo) => (todo.id === updatedTodo.id ? updatedTodo : todo))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedTodo = payload.old as { id: string };
            setTodos((prev) => prev.filter((todo) => todo.id !== deletedTodo.id));
          }
        }
      )
      .subscribe();

    const notesChannel = supabase
      .channel('notes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const note = payload.new as NoteRow;
            setNotes(note.content || '');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(cardsChannel);
      supabase.removeChannel(todosChannel);
      supabase.removeChannel(notesChannel);
    };
  }, [user]);

  // Card operations
  const addCard = useCallback(
    async (columnId: ColumnId, title: string) => {
      if (!user) return;

      const columnCards = cards.filter((c) => c.column_id === columnId);
      const position = columnCards.length;

      const insertData: CardInsert = {
        user_id: user.id,
        title,
        column_id: columnId,
        position,
      };

      const { error } = await supabase.from('cards').insert(insertData);

      if (error) console.error('Error adding card:', error);
    },
    [user, cards]
  );

  const updateCard = useCallback(
    async (cardId: string, title: string, description?: string) => {
      const updateData: CardUpdate = {
        title,
        description: description ?? null,
      };

      const { error } = await supabase
        .from('cards')
        .update(updateData)
        .eq('id', cardId);

      if (error) console.error('Error updating card:', error);
    },
    []
  );

  const deleteCard = useCallback(async (cardId: string) => {
    const { error } = await supabase.from('cards').delete().eq('id', cardId);

    if (error) console.error('Error deleting card:', error);
  }, []);

  const moveCard = useCallback(
    async (cardId: string, _fromColumn: ColumnId, toColumn: ColumnId, newIndex: number) => {
      // Optimistically update local state
      setCards((prev) => {
        const card = prev.find((c) => c.id === cardId);
        if (!card) return prev;

        const otherCards = prev.filter((c) => c.id !== cardId);
        const targetColumnCards = otherCards
          .filter((c) => c.column_id === toColumn)
          .sort((a, b) => a.position - b.position);

        // Update positions
        targetColumnCards.splice(newIndex, 0, { ...card, column_id: toColumn });
        const updatedTargetCards = targetColumnCards.map((c, idx) => ({
          ...c,
          position: idx,
        }));

        const nonTargetCards = otherCards.filter((c) => c.column_id !== toColumn);
        return [...nonTargetCards, ...updatedTargetCards];
      });

      // Update in database
      const targetColumnCards = cards
        .filter((c) => c.column_id === toColumn && c.id !== cardId)
        .sort((a, b) => a.position - b.position);

      const updateData: CardUpdate = {
        column_id: toColumn,
        position: newIndex,
      };

      const { error } = await supabase
        .from('cards')
        .update(updateData)
        .eq('id', cardId);

      if (error) {
        console.error('Error moving card:', error);
        return;
      }

      // Update positions of other cards in target column
      const updates = targetColumnCards.map((card, idx) => {
        const newPosition = idx >= newIndex ? idx + 1 : idx;
        const positionUpdate: CardUpdate = { position: newPosition };
        return supabase.from('cards').update(positionUpdate).eq('id', card.id);
      });

      await Promise.all(updates);
    },
    [cards]
  );

  const reorderCards = useCallback(async (columnId: ColumnId, cardIds: string[]) => {
    // Optimistically update local state
    setCards((prev) => {
      const columnCards = prev.filter((c) => c.column_id === columnId);
      const otherCards = prev.filter((c) => c.column_id !== columnId);

      const reorderedCards = cardIds.map((id, idx) => {
        const card = columnCards.find((c) => c.id === id);
        return card ? { ...card, position: idx } : null;
      }).filter((c): c is TaskCard => c !== null);

      return [...otherCards, ...reorderedCards];
    });

    // Update positions in database
    const updates = cardIds.map((id, idx) => {
      const positionUpdate: CardUpdate = { position: idx };
      return supabase.from('cards').update(positionUpdate).eq('id', id);
    });

    const results = await Promise.all(updates);
    results.forEach((result, idx) => {
      if (result.error) console.error(`Error reordering card ${cardIds[idx]}:`, result.error);
    });
  }, []);

  // Todo operations
  const addTodo = useCallback(
    async (text: string) => {
      if (!user) return;

      const insertData: TodoInsert = {
        user_id: user.id,
        text,
      };

      const { error } = await supabase.from('todos').insert(insertData);

      if (error) console.error('Error adding todo:', error);
    },
    [user]
  );

  const toggleTodo = useCallback(async (todoId: string) => {
    const todo = todos.find((t) => t.id === todoId);
    if (!todo) return;

    const updateData: TodoUpdate = {
      completed: !todo.completed,
    };

    const { error } = await supabase
      .from('todos')
      .update(updateData)
      .eq('id', todoId);

    if (error) console.error('Error toggling todo:', error);
  }, [todos]);

  const deleteTodo = useCallback(async (todoId: string) => {
    const { error } = await supabase.from('todos').delete().eq('id', todoId);

    if (error) console.error('Error deleting todo:', error);
  }, []);

  // Notes operations
  const updateNotes = useCallback(
    async (content: string) => {
      if (!user) return;

      // Optimistically update local state
      setNotes(content);

      const insertData: NoteInsert = {
        user_id: user.id,
        content,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('notes').upsert(insertData, { onConflict: 'user_id' });

      if (error) console.error('Error updating notes:', error);
    },
    [user]
  );

  return {
    state: { cards, todos, notes, loading },
    actions: {
      addCard,
      updateCard,
      deleteCard,
      moveCard,
      reorderCards,
      addTodo,
      toggleTodo,
      deleteTodo,
      updateNotes,
    },
  };
}
