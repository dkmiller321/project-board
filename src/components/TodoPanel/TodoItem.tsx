import type { TodoItem as TodoItemType } from '../../types';
import { useApp } from '../../context/AppContext';
import styles from './TodoPanel.module.css';

interface TodoItemProps {
  todo: TodoItemType;
}

export function TodoItem({ todo }: TodoItemProps) {
  const { actions } = useApp();

  return (
    <li className={styles.todoItem}>
      <label className={styles.todoLabel}>
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => actions.toggleTodo(todo.id)}
          className={styles.checkbox}
        />
        <span className={`${styles.todoText} ${todo.completed ? styles.completed : ''}`}>
          {todo.text}
        </span>
      </label>
      <button
        onClick={() => actions.deleteTodo(todo.id)}
        className={styles.deleteBtn}
        aria-label="Delete todo"
      >
        ×
      </button>
    </li>
  );
}
