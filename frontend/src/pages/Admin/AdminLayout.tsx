import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [isCollapsed, setIsCollapsed] = useState(() => {
      const saved = localStorage.getItem('admin-sidebar-collapsed');
      return saved ? JSON.parse(saved) : false;
    });
  
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  useEffect(() => {
      localStorage.setItem('admin-sidebar-collapsed', JSON.stringify(isCollapsed));
    }, [isCollapsed]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className={`${styles.wrapper} ${isCollapsed ? styles.collapsed : ''}`}>
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

        <div className={styles.sidebarFooter} ref={dropdownRef}>
          <button
            className={styles.profileBtn}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-label="Abrir menú de perfil"
          >
            <div className={styles.avatar}>👤</div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{user}</span>
              {role && !isCollapsed && (
                <span className={`${styles.roleBadge} ${styles[`roleBadge_${role}`]}`}>
                  {ROLE_LABELS[role] ?? role}
                </span>
              )}
            </div>
            <span className={`${styles.chevron} ${isDropdownOpen ? styles.chevronOpen : ''}`}>
              ▼
            </span>
          </button>

          {isDropdownOpen && (
            <div className={styles.dropdown}>
              <button className={styles.dropdownItem}>
                <span className={styles.dropdownIcon}>⚙️</span>
                <span>Configuración</span>
              </button>
              <button
                className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                onClick={() => {
                  setIsDropdownOpen(false);
                  handleLogout();
                }}
              >
                <span className={styles.dropdownIcon}>🚪</span>
                <span>Cerrar sesión</span>
              </button>
            </div>
          )}
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
