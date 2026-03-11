import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { handleResponse } from '../../utils/apiErrorHandler';
import type { Role } from '../../utils/permissions';
import styles from './AdminLogin.module.css';

export function AdminLogin() {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Log para depuración
      console.log('Login payload:', { user, password });
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, password }),
      });
      
      const data = await handleResponse<{ success: boolean; data: { token: string; role: string }; message?: string }>(res);
      
      // Log para depuración
      console.log('Login response:', data);
      
      if (data.success && data.data && data.data.token) {
        const { token, role: userRole } = data.data;
        const role: Role = userRole === 'editor' ? 'editor' : 'admin';
        login(user, token, role);
        toast.success(`¡Bienvenido, ${user}!`);
        navigate('/admin/dashboard');
      } else {
        toast.error(data.message || 'Credenciales inválidas');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de red o servidor');
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
        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
