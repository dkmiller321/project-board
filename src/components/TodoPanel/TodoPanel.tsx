import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useApp } from '../../context/AppContext';
import { TodoItem } from './TodoItem';
import styles from './TodoPanel.module.css';

export function TodoPanel() {
  const { state, actions } = useApp();
  const [newTodo, setNewTodo] = useState('');

  const handleAddTodo = () => {
    const text = newTodo.trim();
    if (text) {
      actions.addTodo(text);
      setNewTodo('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddTodo();
    } else if (e.key === 'Escape') {
      setNewTodo('');
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Todos</h2>
      <div className={styles.inputWrapper}>
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a todo..."
          className={styles.input}
        />
        <button onClick={handleAddTodo} className={styles.addBtn} disabled={!newTodo.trim()}>
          +
        </button>
      </div>
      <ul className={styles.list}>
        {state.todos.length === 0 ? (
          <li className={styles.empty}>No todos yet</li>
        ) : (
          state.todos.map((todo) => <TodoItem key={todo.id} todo={todo} />)
        )}
      </ul>
    </div>
  );
}
