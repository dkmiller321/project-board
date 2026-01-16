import { useReducer, useEffect, useCallback } from 'react';
import type { AppState, AppAction } from '../types';
import { loadFromStorage, saveToStorage } from './usePersistedState';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const initialState: AppState = {
  cards: {},
  columns: {
    todo: { cardIds: [] },
    progress: { cardIds: [] },
    complete: { cardIds: [] },
  },
  todos: [],
  notes: '',
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_CARD': {
      const cardId = generateId();
      return {
        ...state,
        cards: {
          ...state.cards,
          [cardId]: {
            id: cardId,
            title: action.payload.title,
            createdAt: Date.now(),
          },
        },
        columns: {
          ...state.columns,
          [action.payload.columnId]: {
            cardIds: [...state.columns[action.payload.columnId].cardIds, cardId],
          },
        },
      };
    }

    case 'UPDATE_CARD': {
      const card = state.cards[action.payload.cardId];
      if (!card) return state;
      return {
        ...state,
        cards: {
          ...state.cards,
          [action.payload.cardId]: {
            ...card,
            title: action.payload.title,
            description: action.payload.description,
          },
        },
      };
    }

    case 'DELETE_CARD': {
      const { cardId, columnId } = action.payload;
      const { [cardId]: _, ...remainingCards } = state.cards;
      return {
        ...state,
        cards: remainingCards,
        columns: {
          ...state.columns,
          [columnId]: {
            cardIds: state.columns[columnId].cardIds.filter((id) => id !== cardId),
          },
        },
      };
    }

    case 'MOVE_CARD': {
      const { cardId, fromColumn, toColumn, newIndex } = action.payload;
      const sourceCards = state.columns[fromColumn].cardIds.filter((id) => id !== cardId);
      const destCards = [...state.columns[toColumn].cardIds];

      if (fromColumn === toColumn) {
        destCards.splice(newIndex, 0, cardId);
        return {
          ...state,
          columns: {
            ...state.columns,
            [toColumn]: { cardIds: destCards },
          },
        };
      }

      destCards.splice(newIndex, 0, cardId);
      return {
        ...state,
        columns: {
          ...state.columns,
          [fromColumn]: { cardIds: sourceCards },
          [toColumn]: { cardIds: destCards },
        },
      };
    }

    case 'REORDER_CARDS': {
      return {
        ...state,
        columns: {
          ...state.columns,
          [action.payload.columnId]: { cardIds: action.payload.cardIds },
        },
      };
    }

    case 'ADD_TODO': {
      return {
        ...state,
        todos: [
          ...state.todos,
          {
            id: generateId(),
            text: action.payload.text,
            completed: false,
          },
        ],
      };
    }

    case 'TOGGLE_TODO': {
      return {
        ...state,
        todos: state.todos.map((todo) =>
          todo.id === action.payload.todoId
            ? { ...todo, completed: !todo.completed }
            : todo
        ),
      };
    }

    case 'DELETE_TODO': {
      return {
        ...state,
        todos: state.todos.filter((todo) => todo.id !== action.payload.todoId),
      };
    }

    case 'UPDATE_NOTES': {
      return {
        ...state,
        notes: action.payload.notes,
      };
    }

    case 'LOAD_STATE': {
      return action.payload;
    }

    default:
      return state;
  }
}

export function useAppState() {
  const [state, dispatch] = useReducer(appReducer, initialState, () => {
    return loadFromStorage(initialState);
  });

  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  const actions = {
    addCard: useCallback((columnId: AppState['columns'] extends Record<infer K, unknown> ? K : never, title: string) => {
      dispatch({ type: 'ADD_CARD', payload: { columnId, title } });
    }, []),

    updateCard: useCallback((cardId: string, title: string, description?: string) => {
      dispatch({ type: 'UPDATE_CARD', payload: { cardId, title, description } });
    }, []),

    deleteCard: useCallback((cardId: string, columnId: AppState['columns'] extends Record<infer K, unknown> ? K : never) => {
      dispatch({ type: 'DELETE_CARD', payload: { cardId, columnId } });
    }, []),

    moveCard: useCallback((cardId: string, fromColumn: AppState['columns'] extends Record<infer K, unknown> ? K : never, toColumn: AppState['columns'] extends Record<infer K, unknown> ? K : never, newIndex: number) => {
      dispatch({ type: 'MOVE_CARD', payload: { cardId, fromColumn, toColumn, newIndex } });
    }, []),

    reorderCards: useCallback((columnId: AppState['columns'] extends Record<infer K, unknown> ? K : never, cardIds: string[]) => {
      dispatch({ type: 'REORDER_CARDS', payload: { columnId, cardIds } });
    }, []),

    addTodo: useCallback((text: string) => {
      dispatch({ type: 'ADD_TODO', payload: { text } });
    }, []),

    toggleTodo: useCallback((todoId: string) => {
      dispatch({ type: 'TOGGLE_TODO', payload: { todoId } });
    }, []),

    deleteTodo: useCallback((todoId: string) => {
      dispatch({ type: 'DELETE_TODO', payload: { todoId } });
    }, []),

    updateNotes: useCallback((notes: string) => {
      dispatch({ type: 'UPDATE_NOTES', payload: { notes } });
    }, []),
  };

  return { state, actions, dispatch };
}
