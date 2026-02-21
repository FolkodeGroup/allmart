import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import styles from './AdminLayout.module.css';

const navItems = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: '🏠', permission: null },
  { label: 'Productos', to: '/admin/productos', icon: '📦', permission: null },
  { label: 'Variantes', to: '/admin/variantes', icon: '🎨', permission: null },
  { label: 'Categorías', to: '/admin/categorias', icon: '🗂️', permission: null },
  { label: 'Pedidos', to: '/admin/pedidos', icon: '🛒', permission: null },
  { label: 'Reportes', to: '/admin/reportes', icon: '📊', permission: 'reports.view' as const },
];

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  editor: 'Editor',
};

export function AdminLayout() {
  const { user, role, logout, can } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandLogo}>allmart</span>
          <span className={styles.brandTag}>Admin</span>
        </div>

        <nav className={styles.nav}>
          {navItems.map(item => {
            const locked = item.permission !== null && !can(item.permission);
            if (locked) {
              return (
                <span
                  key={item.to}
                  className={`${styles.navItem} ${styles.navItemLocked}`}
                  title="Sin acceso para tu rol"
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span className={styles.navLabel}>{item.label}</span>
                  <span className={styles.navLockIcon}>🔒</span>
                </span>
              );
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                }
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navLabel}>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <span className={styles.userIcon}>👤</span>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{user}</span>
              {role && (
                <span className={`${styles.roleBadge} ${styles[`roleBadge_${role}`]}`}>
                  {ROLE_LABELS[role] ?? role}
                </span>
              )}
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
