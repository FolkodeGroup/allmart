import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import styles from './AdminLayout.module.css';

const navItems = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: '🏠' },
  { label: 'Productos', to: '/admin/productos', icon: '📦' },
  { label: 'Variantes', to: '/admin/variantes', icon: '🎨' },
  { label: 'Categorías', to: '/admin/categorias', icon: '🗂️' },
  { label: 'Pedidos', to: '/admin/pedidos', icon: '🛒' },
  { label: 'Reportes', to: '/admin/reportes', icon: '📊' },
];

export function AdminLayout() {
  const { user, logout } = useAdminAuth();
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
          {navItems.map(item => (
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
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <span className={styles.userIcon}>👤</span>
            <span className={styles.userName}>{user}</span>
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
