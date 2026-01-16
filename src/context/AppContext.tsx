import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useSupabaseState } from '../hooks/useSupabaseState';
import type { TaskCard, TodoItem, ColumnId } from '../types';

interface AppState {
  cards: TaskCard[];
  todos: TodoItem[];
  notes: string;
  loading: boolean;
}

interface AppContextValue {
  state: AppState;
  actions: {
    addCard: (columnId: ColumnId, title: string) => void;
    updateCard: (cardId: string, title: string, description?: string) => void;
    deleteCard: (cardId: string) => void;
    moveCard: (cardId: string, fromColumn: ColumnId, toColumn: ColumnId, newIndex: number) => void;
    reorderCards: (columnId: ColumnId, cardIds: string[]) => void;
    addTodo: (text: string) => void;
    toggleTodo: (todoId: string) => void;
    deleteTodo: (todoId: string) => void;
    updateNotes: (notes: string) => void;
  };
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { state, actions } = useSupabaseState();

  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
