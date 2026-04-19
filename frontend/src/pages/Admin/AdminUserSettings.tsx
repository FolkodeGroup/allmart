import { useState, useCallback } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import styles from './AdminUserSettings.module.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  editor: 'Editor',
};

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

const PREFS_KEY = 'allmart_admin_prefs';

interface AdminPrefs {
  itemsPerPage: number;
  defaultView: 'grid' | 'list';
  compactMode: boolean;
  notifyOrders: boolean;
  notifyLowStock: boolean;
  notifyPendingPayments: boolean;
}

const DEFAULT_PREFS: AdminPrefs = {
  itemsPerPage: 25,
  defaultView: 'list',
  compactMode: false,
  notifyOrders: true,
  notifyLowStock: true,
  notifyPendingPayments: false,
};

function loadPrefs(): AdminPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_PREFS };
}

function savePrefs(prefs: AdminPrefs): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionIcon}>{icon}</span>
        <h2 className={styles.sectionTitle}>{title}</h2>
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className={styles.toggleRow}>
      <div className={styles.toggleText}>
        <span className={styles.toggleLabel}>{label}</span>
        {description && <span className={styles.toggleDesc}>{description}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className={styles.toggleThumb} />
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdminUserSettings() {
  const { user, role, token } = useAdminAuth();

  // ── Password change state ──
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Preferences state ──
  const [prefs, setPrefs] = useState<AdminPrefs>(() => loadPrefs());
  const [prefsSaved, setPrefsSaved] = useState(false);

  const updatePref = useCallback(<K extends keyof AdminPrefs>(key: K, value: AdminPrefs[K]) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      savePrefs(next);
      return next;
    });
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2000);
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (newPassword.length < 8) {
      setPasswordStatus({ type: 'error', message: 'La nueva contraseña debe tener al menos 8 caracteres.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'Las contraseñas nuevas no coinciden.' });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/admin/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordStatus({ type: 'error', message: data.message || 'Error al cambiar la contraseña.' });
      } else {
        setPasswordStatus({ type: 'success', message: 'Contraseña actualizada correctamente.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      setPasswordStatus({ type: 'error', message: 'Error de conexión. Intentá de nuevo.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const userInitials = user
    ?.split('@')[0]
    .split('.')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  const passwordStrength = (() => {
    if (!newPassword) return null;
    if (newPassword.length < 8) return { level: 0, label: 'Muy corta', color: '#ef4444' };
    const checks = [/[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/];
    const passed = checks.filter((r) => r.test(newPassword)).length;
    if (passed === 0) return { level: 1, label: 'Débil', color: '#f97316' };
    if (passed === 1) return { level: 2, label: 'Media', color: '#eab308' };
    if (passed === 2) return { level: 3, label: 'Fuerte', color: '#22c55e' };
    return { level: 4, label: 'Muy fuerte', color: '#16a34a' };
  })();

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Configuración de cuenta</h1>
        <p className={styles.pageSubtitle}>Gestioná tu perfil, seguridad y preferencias del panel.</p>
      </div>

      <div className={styles.layout}>

        {/* ── Perfil ── */}
        <SectionCard
          title="Mi perfil"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          }
        >
          <div className={styles.profileRow}>
            <div className={styles.profileAvatar}>
              <span>{userInitials}</span>
            </div>
            <div className={styles.profileInfo}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Correo electrónico</label>
                <div className={styles.readonlyField}>
                  <span>{user}</span>
                  <span className={styles.readonlyBadge}>Solo lectura</span>
                </div>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Rol</label>
                <div className={styles.readonlyField}>
                  <span
                    className={styles.rolePill}
                    data-role={role ?? 'editor'}
                  >
                    {ROLE_LABELS[role ?? ''] ?? role}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <p className={styles.infoNote}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Para cambiar el email o el rol, contactá al administrador del sistema.
          </p>
        </SectionCard>

        {/* ── Seguridad ── */}
        <SectionCard
          title="Seguridad"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          }
        >
          <form onSubmit={handleChangePassword} className={styles.passwordForm} noValidate>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="current-password">Contraseña actual</label>
              <div className={styles.passwordInput}>
                <input
                  id="current-password"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={styles.input}
                  placeholder="Ingresá tu contraseña actual"
                  autoComplete="current-password"
                  required
                />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowCurrent((v) => !v)} aria-label="Mostrar contraseña">
                  {showCurrent ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="new-password">Nueva contraseña</label>
              <div className={styles.passwordInput}>
                <input
                  id="new-password"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={styles.input}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  required
                />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowNew((v) => !v)} aria-label="Mostrar contraseña">
                  {showNew ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
              {passwordStrength && (
                <div className={styles.strengthBar}>
                  <div className={styles.strengthSegments}>
                    {[1, 2, 3, 4].map((n) => (
                      <div
                        key={n}
                        className={styles.strengthSegment}
                        style={{ backgroundColor: n <= passwordStrength.level ? passwordStrength.color : undefined }}
                      />
                    ))}
                  </div>
                  <span className={styles.strengthLabel} style={{ color: passwordStrength.color }}>
                    {passwordStrength.label}
                  </span>
                </div>
              )}
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="confirm-password">Confirmar nueva contraseña</label>
              <div className={styles.passwordInput}>
                <input
                  id="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`${styles.input} ${confirmPassword && confirmPassword !== newPassword ? styles.inputError : ''}`}
                  placeholder="Repetí la nueva contraseña"
                  autoComplete="new-password"
                  required
                />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowConfirm((v) => !v)} aria-label="Mostrar contraseña">
                  {showConfirm ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
              {confirmPassword && confirmPassword !== newPassword && (
                <span className={styles.fieldError}>Las contraseñas no coinciden</span>
              )}
            </div>

            {passwordStatus && (
              <div className={`${styles.statusAlert} ${styles[`status_${passwordStatus.type}`]}`}>
                {passwordStatus.type === 'success' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                )}
                <span>{passwordStatus.message}</span>
              </div>
            )}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
            >
              {isChangingPassword ? (
                <>
                  <span className={styles.spinner} />
                  Actualizando...
                </>
              ) : 'Actualizar contraseña'}
            </button>
          </form>
        </SectionCard>

        {/* ── Preferencias de visualización ── */}
        <SectionCard
          title="Preferencias de visualización"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
          }
        >
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Registros por página (tablas)</label>
            <div className={styles.radioGroup}>
              {ITEMS_PER_PAGE_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`${styles.radioChip} ${prefs.itemsPerPage === n ? styles.radioChipActive : ''}`}
                  onClick={() => updatePref('itemsPerPage', n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Vista predeterminada</label>
            <div className={styles.radioGroup}>
              <button
                type="button"
                className={`${styles.radioChip} ${prefs.defaultView === 'list' ? styles.radioChipActive : ''}`}
                onClick={() => updatePref('defaultView', 'list')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                Lista
              </button>
              <button
                type="button"
                className={`${styles.radioChip} ${prefs.defaultView === 'grid' ? styles.radioChipActive : ''}`}
                onClick={() => updatePref('defaultView', 'grid')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                Cuadrícula
              </button>
            </div>
          </div>

          <ToggleSwitch
            checked={prefs.compactMode}
            onChange={(v) => updatePref('compactMode', v)}
            label="Modo compacto"
            description="Reduce el espaciado en tablas y listados"
          />

          {prefsSaved && (
            <div className={`${styles.statusAlert} ${styles.status_success}`} style={{ marginTop: '12px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Preferencias guardadas</span>
            </div>
          )}
        </SectionCard>

        {/* ── Notificaciones del panel ── */}
        <SectionCard
          title="Notificaciones del panel"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          }
        >
          <p className={styles.sectionNote}>
            Controlá qué alertas se muestran visualmente en el panel de administración.
          </p>
          <ToggleSwitch
            checked={prefs.notifyOrders}
            onChange={(v) => updatePref('notifyOrders', v)}
            label="Nuevos pedidos"
            description="Alertas cuando ingresen pedidos nuevos"
          />
          <ToggleSwitch
            checked={prefs.notifyLowStock}
            onChange={(v) => updatePref('notifyLowStock', v)}
            label="Stock bajo"
            description="Alertas cuando un producto quede con poco stock"
          />
          <ToggleSwitch
            checked={prefs.notifyPendingPayments}
            onChange={(v) => updatePref('notifyPendingPayments', v)}
            label="Pagos pendientes"
            description="Alertas de pedidos con pago no confirmado"
          />
        </SectionCard>

      </div>
    </div>
  );
}
