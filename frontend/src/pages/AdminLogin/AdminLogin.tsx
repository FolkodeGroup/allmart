import { useState } from 'react';
import styles from './AdminLogin.module.css';

export function AdminLogin({ onLogin }: { onLogin: (user: string, token: string) => void }) {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        onLogin(user, data.token);
      } else {
        setError(data.message || 'Credenciales inválidas');
      }
    } catch (err) {
      setError('Error de red o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.backdrop}>
      <form className={styles.panel} onSubmit={handleSubmit}>
        <h2 className={styles.heading}>Panel de Administración</h2>
        <label className={styles.label} htmlFor="user">Usuario</label>
        <input
          className={styles.input}
          id="user"
          type="text"
          value={user}
          onChange={e => setUser(e.target.value)}
          autoComplete="username"
          required
        />
        <label className={styles.label} htmlFor="password">Contraseña</label>
        <input
          className={styles.input}
          id="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        {error && <div className={styles.error}>{error}</div>}
        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
