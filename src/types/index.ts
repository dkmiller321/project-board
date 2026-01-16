export interface TaskCard {
  id: string;
  title: string;
  description?: string;
  createdAt: number;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export type ColumnId = 'todo' | 'progress' | 'complete';

export interface Column {
  cardIds: string[];
}

export interface AppState {
  cards: Record<string, TaskCard>;
  columns: Record<ColumnId, Column>;
  todos: TodoItem[];
  notes: string;
}

export type AppAction =
  | { type: 'ADD_CARD'; payload: { columnId: ColumnId; title: string } }
  | { type: 'UPDATE_CARD'; payload: { cardId: string; title: string; description?: string } }
  | { type: 'DELETE_CARD'; payload: { cardId: string; columnId: ColumnId } }
  | { type: 'MOVE_CARD'; payload: { cardId: string; fromColumn: ColumnId; toColumn: ColumnId; newIndex: number } }
  | { type: 'REORDER_CARDS'; payload: { columnId: ColumnId; cardIds: string[] } }
  | { type: 'ADD_TODO'; payload: { text: string } }
  | { type: 'TOGGLE_TODO'; payload: { todoId: string } }
  | { type: 'DELETE_TODO'; payload: { todoId: string } }
  | { type: 'UPDATE_NOTES'; payload: { notes: string } }
  | { type: 'LOAD_STATE'; payload: AppState };

export const COLUMN_TITLES: Record<ColumnId, string> = {
  todo: 'To Do',
  progress: 'In Progress',
  complete: 'Done',
};
