import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { adminLoginSchema, type AdminLoginSchema } from '../../schemas/adminLoginSchema';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { handleResponse } from '../../utils/apiErrorHandler';
import type { Role } from '../../utils/permissions';
import styles from './AdminLogin.module.css';

export function AdminLogin() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<AdminLoginSchema>({
    resolver: zodResolver(adminLoginSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: { user: '', password: '' },
  });

  const onSubmit = async (values: AdminLoginSchema) => {
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await handleResponse<{ success: boolean; data: { token: string; role: string }; message?: string }>(res);
      if (data.success && data.data && data.data.token) {
        const { token, role: userRole } = data.data;
        const role: Role = userRole === 'editor' ? 'editor' : 'admin';
        login(values.user, token, role);
        toast.success(`¡Bienvenido, ${values.user}!`);
        navigate('/admin/dashboard');
      } else {
        toast.error(data.message || 'Credenciales inválidas');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error de red o servidor';
      toast.error(errorMsg);
    }
  };

  return (
    <div className={styles.backdrop}>
      <form className={styles.panel} onSubmit={handleSubmit(onSubmit)} noValidate>
        <h2 className={styles.heading}>Panel de Administración</h2>
        <label className={styles.label} htmlFor="user">Usuario</label>
        <input
          className={`${styles.input} ${errors.user ? styles.inputError : ''}`}
          id="user"
          type="text"
          autoComplete="username"
          {...register('user')}
          aria-invalid={!!errors.user}
        />
        {errors.user && <span className={styles.errorText}>{errors.user.message}</span>}
        <label className={styles.label} htmlFor="password">Contraseña</label>
        <input
          className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
          id="password"
          type="password"
          autoComplete="current-password"
          {...register('password')}
          aria-invalid={!!errors.password}
        />
        {errors.password && <span className={styles.errorText}>{errors.password.message}</span>}
        <button className={styles.button} type="submit" disabled={!isValid || isSubmitting}>
          {isSubmitting ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
