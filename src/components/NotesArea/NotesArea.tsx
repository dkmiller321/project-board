import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import styles from './NotesArea.module.css';

export function NotesArea() {
  const { state, actions } = useApp();
  const [localNotes, setLocalNotes] = useState(state.notes);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalNotes(state.notes);
  }, [state.notes]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setLocalNotes(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      actions.updateNotes(value);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Notes</h2>
      <textarea
        className={styles.textarea}
        value={localNotes}
        onChange={handleChange}
        placeholder="Freeform notes..."
      />
    </div>
  );
}
