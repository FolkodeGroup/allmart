import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminHeader } from '../../components/layout/AdminHeader/AdminHeader';
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
  
  const [isCollapsed, setIsCollapsed] = useState(() => {
      const saved = localStorage.getItem('admin-sidebar-collapsed');
      return saved ? JSON.parse(saved) : false;
    });
  
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  useEffect(() => {
      localStorage.setItem('admin-sidebar-collapsed', JSON.stringify(isCollapsed));
    }, [isCollapsed]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className={`${styles.wrapper} ${isCollapsed ? styles.collapsed : ''}`}>
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={12}
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--color-neutral-dark)',
            color: 'var(--color-neutral-light)',
            borderRadius: 'var(--radius-lg, 8px)',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '16px',
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            boxShadow: 'var(--shadow-lg)',
          },
          success: {
            style: {
              background: 'rgba(118, 146, 130, 0.15)',
              borderColor: 'rgba(118, 146, 130, 0.4)',
              color: 'var(--color-primary)',
            },
            iconTheme: {
              primary: 'var(--color-primary)',
              secondary: 'rgba(118, 146, 130, 0.15)',
            },
          },
          error: {
            style: {
              background: 'rgba(220, 100, 100, 0.15)',
              borderColor: 'rgba(220, 100, 100, 0.4)',
              color: '#dc6464',
            },
            iconTheme: {
              primary: '#dc6464',
              secondary: 'rgba(220, 100, 100, 0.15)',
            },
          },
        }}
      />
      <button className={styles.mobileToggle} onClick={() => setIsMobileOpen(true)}>
        ☰
      </button>
      {isMobileOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setIsMobileOpen(false)}
          role="button"
          tabIndex={0}
          onKeyDown={e => (e.key === 'Escape' || e.key === 'Enter') && setIsMobileOpen(false)}
        />
        )}
      <aside className={`${styles.sidebar} ${isMobileOpen ? styles.mobileVisible : ''}`}>
        <div className={styles.brand}>
          <span className={styles.brandLogo}>allmart</span>
          {!isCollapsed && <span className={styles.brandTag}>Admin</span>}
          <button 
            className={styles.desktopToggle} 
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label="Colapsar/Expandir barra lateral"
          >
            {isCollapsed ? '❯' : '❮'}
          </button>
        </div>

        <nav className={styles.nav}>
          {navItems.map(item => {
            const locked = item.permission !== null && !can(item.permission);
            const commonProps = {
              key: item.to,
              title: isCollapsed ? item.label : '',
              'data-label': item.label,
              onClick: () => setIsMobileOpen(false) // Cierra drawer al clickear en mobile
              };
            if (locked) {
              return (
                <span
                  {...commonProps}
                  className={`${styles.navItem} ${styles.navItemLocked}`}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span className={styles.navLabel}>{item.label}</span>
                  <span className={styles.navLockIcon}>🔒</span>
                </span>
              );
            }
            
            
            
            return (
              <NavLink
                {...commonProps}
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
              {role && !isCollapsed && (
                <span className={`${styles.roleBadge} ${styles[`roleBadge_${role}`]}`}>
                  {ROLE_LABELS[role] ?? role}
                </span>
              )}
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            {isCollapsed ? '🚪' : 'Cerrar sesión'}
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <AdminHeader />
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
