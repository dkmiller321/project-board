import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './Auth.module.css';

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      }
    } else {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error.message);
      } else {
        setMessage('Check your email for the confirmation link.');
      }
    }

    setLoading(false);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setMessage(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Vibe Coder</h1>
        <p className={styles.subtitle}>Project Board</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="you@example.com"
              required
              disabled={loading}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="Your password"
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}
          {message && <p className={styles.message}>{message}</p>}

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <p className={styles.toggle}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button type="button" onClick={toggleMode} className={styles.toggleButton}>
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}
