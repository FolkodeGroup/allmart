import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { adminLoginSchema, type AdminLoginSchema } from '../../schemas/adminLoginSchema';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { handleResponse } from '../../utils/apiErrorHandler';
import type { Role } from '../../utils/permissions';
import { Eye, EyeOff, Lock, User, Loader2, Mail } from 'lucide-react';
import styles from './AdminLogin.module.css';
import logoSrc from '../../assets/images/logos/Allmart (7).svg';

const SAVED_USER_KEY = 'allmart_admin_user';

export function AdminLogin() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberUser, setRememberUser] = useState(() => !!localStorage.getItem(SAVED_USER_KEY));
  const [showResetModal, setShowResetModal] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useForm<AdminLoginSchema>({
    resolver: zodResolver(adminLoginSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: { user: '', password: '' },
  });

  useEffect(() => {
    const saved = localStorage.getItem(SAVED_USER_KEY);
    if (saved) {
      setValue('user', saved, { shouldValidate: true });
    }
  }, [setValue]);

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

        if (rememberUser) {
          localStorage.setItem(SAVED_USER_KEY, values.user);
        } else {
          localStorage.removeItem(SAVED_USER_KEY);
        }

        login(values.user, token, role);
        toast.success(`¡Bienvenido, ${values.user}!`, { duration: 3000 });
        navigate('/admin/dashboard');
      } else {
        toast.error(data.message || 'Credenciales inválidas');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error de red o servidor';
      toast.error(errorMsg);
    }
  };

  const togglePassword = useCallback(() => setShowPassword((p) => !p), []);

  return (
    <div className={styles.backdrop}>
      <div className={styles.loginStack}>
        <img src={logoSrc} alt="Allmart" className={styles.bgLogo} />

        <form className={styles.panel} onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.panelHeader}>
            <h2 className={styles.heading}>Panel de Administración</h2>
            <p className={styles.subheading}>Ingresá tus credenciales para continuar</p>
          </div>

          {/* Campo Usuario */}
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="user">Usuario</label>
            <div className={`${styles.inputWrapper} ${errors.user ? styles.inputWrapperError : ''}`}>
              <User size={16} className={styles.inputIcon} aria-hidden="true" />
              <input
                className={styles.input}
                id="user"
                type="text"
                placeholder="Ingresá tu usuario"
                autoComplete="username"
                {...register('user')}
                aria-invalid={!!errors.user}
              />
            </div>
            {errors.user && <span className={styles.errorText}>{errors.user.message}</span>}
          </div>

          {/* Campo Contraseña */}
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="password">Contraseña</label>
            <div className={`${styles.inputWrapper} ${errors.password ? styles.inputWrapperError : ''}`}>
              <Lock size={16} className={styles.inputIcon} aria-hidden="true" />
              <input
                className={styles.input}
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Ingresá tu contraseña"
                autoComplete="current-password"
                {...register('password')}
                aria-invalid={!!errors.password}
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={togglePassword}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <span className={styles.errorText}>{errors.password.message}</span>}
          </div>

          {/* Opciones: Recordar + Olvidé contraseña */}
          <div className={styles.optionsRow}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={rememberUser}
                onChange={(e) => setRememberUser(e.target.checked)}
              />
              <span className={styles.checkboxCustom} />
              <span className={styles.checkboxText}>Recordar usuario</span>
            </label>
            <button
              type="button"
              className={styles.forgotLink}
              onClick={() => setShowResetModal(true)}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {/* Botón principal */}
          <button className={styles.button} type="submit" disabled={!isValid || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 size={18} className={styles.spinner} />
                Ingresando...
              </>
            ) : (
              'Ingresar'
            )}
          </button>

          {/* Footer del panel */}
          <div className={styles.panelFooter}>
            <p className={styles.footerText}>
              ¿Problemas para acceder?{' '}
              <a
                href="mailto:contactofolkode@gmail.com?subject=Soporte%20Allmart%20Admin"
                className={styles.footerLink}
              >
                <Mail size={13} className={styles.footerIcon} />
                Contactar a FolKode
              </a>
            </p>
          </div>
        </form>
      </div>

      {/* Modal de reset de contraseña */}
      {showResetModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowResetModal(false)} onKeyDown={(e) => e.key === 'Escape' && setShowResetModal(false)} role="button" tabIndex={0} aria-label="Cerrar modal">
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <h3 className={styles.modalTitle}>Restablecer contraseña</h3>
            <p className={styles.modalText}>
              Para restablecer tu contraseña, contactá al equipo de soporte de FolKode. 
              Te ayudaremos a recuperar el acceso de forma segura.
            </p>
            <div className={styles.modalActions}>
              <a
                href="mailto:soporte@folkode.com?subject=Reseteo%20de%20contrase%C3%B1a%20-%20Allmart%20Admin"
                className={styles.modalPrimary}
              >
                <Mail size={16} />
                Enviar email a soporte
              </a>
              <button
                type="button"
                className={styles.modalSecondary}
                onClick={() => setShowResetModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
