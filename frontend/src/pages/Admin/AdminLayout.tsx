// src/pages/Admin/AdminLayout.tsx
import { Suspense, useState, useEffect, useRef } from "react";
import { useLocation, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { useAdminOrders } from "../../context/AdminOrdersContext";
import { useAdminProducts } from "../../context/AdminProductsContext";
import { AdminHeader } from "../../components/layout/AdminHeader/AdminHeader";
import { Button } from '../../components/ui/Button/Button';
import { AdminLoadingFallback } from '../../components/ui/AdminLoadingFallback';
import styles from "./AdminLayout.module.css";
import { useUnsavedChanges } from '../../context/useUnsavedChanges';
import { ModalConfirm } from "../../components/ui/ModalConfirm";

const navItems = [
  {
    label: "Dashboard",
    to: "/admin/dashboard",
    icon: "🏠",
    permission: null,
    badge: null,
  },
  {
    label: "Productos",
    to: "/admin/productos",
    icon: "📦",
    permission: null,
    badge: "lowStock",
  },
  {
    label: "Imágenes",
    to: "/admin/imagenes",
    icon: "🖼️",
    permission: null,
    badge: null,
  },
  {
    label: "Variantes",
    to: "/admin/variantes",
    icon: "🎨",
    permission: null,
    badge: null,
  },
  {
    label: "Categorías",
    to: "/admin/categorias",
    icon: "🗂️",
    permission: null,
    badge: null,
  },
  {
    label: "Pedidos",
    to: "/admin/pedidos",
    icon: "🛒",
    permission: null,
    badge: "pending",
  },
  {
    label: "Reportes",
    to: "/admin/reportes",
    icon: "📊",
    permission: "reports.view" as const,
    badge: null,
  },
  {
    label: "Promociones",
    to: "/admin/promociones",
    icon: "🎉",
    permission: null,
    badge: null,
  },
  {
    label: "Colecciones",
    to: "/admin/colecciones",
    icon: "📚",
    permission: null,
    badge: null,
  },
  {
    label: "Banners",
    to: "/admin/banners",
    icon: "📣",
    permission: null,
    badge: null,
  },
] as const;

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  editor: "Editor",
};

type Theme = 'light' | 'dark';

export function AdminLayout() {
  const { user, role, logout, can } = useAdminAuth();
  const { getPendingOrdersCount } = useAdminOrders();
  const { getLowStockCount } = useAdminProducts();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isDirty,
    interceptNavigation,
    showWarning,
    confirmNavigation,
    cancelNavigation,
  } = useUnsavedChanges();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('admin-sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  // Dark mode state
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('admin-theme');
    return stored === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem('admin-theme', theme);
  }, [theme]);

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(
      "admin-sidebar-collapsed",
      JSON.stringify(isCollapsed),
    );
  }, [isCollapsed]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isDropdownOpen]);

  const handleLogout = () => {
    logout();
    window.location.replace('/');
  };

  return (
    <div className={`${styles.wrapper} ${isCollapsed ? styles.collapsed : ''} ${theme === 'dark' ? 'dark' : ''}`}>
      <Button
        className={styles.mobileToggle}
        onClick={() => setIsMobileOpen(true)}
        aria-label="Abrir menú móvil"
        variant="ghost"
        type="button"
      >
        ☰
      </Button>
      {isMobileOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setIsMobileOpen(false)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            (e.key === "Escape" || e.key === "Enter") && setIsMobileOpen(false)
          }
        />
      )}
      <aside
        className={`${styles.sidebar} ${isMobileOpen ? styles.mobileVisible : ""}`}
      >
        <div className={styles.brand}>
          <span className={styles.brandLogo}>allmart</span>
          {!isCollapsed && <span className={styles.brandTag}>Admin</span>}
          <Button
            className={styles.desktopToggle}
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label="Colapsar/Expandir barra lateral"
            variant="ghost"
            type="button"
          >
            {isCollapsed ? "❯" : "❮"}
          </Button>
        </div>

        {/* Agrupación: Dark mode + navItems en un solo bloque */}
        <div className={styles.navGroup}>
          <Button
            className={`${styles.darkToggle} ${isCollapsed ? styles.darkToggleCollapsed : styles.darkToggleExpanded}`}
            aria-label="Cambiar modo oscuro"
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            variant="ghost"
          >
            {theme === 'dark' ? '🌙' : '☀️'}
          </Button>
          <nav className={styles.nav}>
            {navItems.map(item => {
              const locked = item.permission !== null && !can(item.permission);
              let badgeCount: number | null = null;
              if (item.badge === 'pending') {
                badgeCount = getPendingOrdersCount();
              } else if (item.badge === 'lowStock') {
                badgeCount = getLowStockCount();
              }
              const commonProps = {
                title: isCollapsed ? item.label : '',
                'data-label': item.label,
                onClick: () => setIsMobileOpen(false)
              };
              if (locked) {
                return (
                  <NavLink
                    key={item.to}
                    {...commonProps}
                    to={item.to}
                    onClick={(e) => {
                      console.log('[NavLink onClick] isDirty del contexto:', isDirty);
                      setIsMobileOpen(false);
                      if (isDirty) {
                        e.preventDefault(); // bloquea la navegación de React Router
                        console.log('[NavLink onClick] → llamando interceptNavigation');
                        interceptNavigation(() => navigate(item.to)); // ← usar navigate, no window.location.href
                      }
                    }}
                    className={({ isActive }) =>
                      `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                    }
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    <span className={styles.navLabel}>{item.label}</span>
                    <span className={styles.navLockIcon}>🔒</span>
                    {badgeCount !== null && badgeCount > 0 && (
                      <span className={styles.navBadge}>{badgeCount}</span>
                    )}
                  </NavLink>
                );
              }
              return (
                <NavLink
                  key={item.to}
                  {...commonProps}
                  to={item.to}
                  onClick={(e) => {
                    setIsMobileOpen(false);
                    if (isDirty) {
                      e.preventDefault(); // bloquea React Router
                      interceptNavigation(() => navigate(item.to)); // ← navigate SPA, no hard reload
                    }
                  }}
                  className={({ isActive }) =>
                    `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                  }
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span className={styles.navLabel}>{item.label}</span>
                  {badgeCount !== null && badgeCount > 0 && (
                    <span className={styles.navBadge}>{badgeCount}</span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className={styles.sidebarFooter} ref={dropdownRef}>
          <Button
            className={styles.profileBtn}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-label="Abrir menú de perfil"
            variant="ghost"
            type="button"
          >
            <div className={styles.avatar}>👤</div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{user}</span>
              {role && !isCollapsed && (
                <span
                  className={`${styles.roleBadge} ${styles[`roleBadge_${role}`]}`}
                >
                  {ROLE_LABELS[role] ?? role}
                </span>
              )}
            </div>
            <span
              className={`${styles.chevron} ${isDropdownOpen ? styles.chevronOpen : ""}`}
            >
              ▼
            </span>
          </Button>

          {isDropdownOpen && (
            <div className={styles.dropdown}>
              <Button className={styles.dropdownItem} variant="ghost" type="button">
                <span className={styles.dropdownIcon}>⚙️</span>
                <span>Configuración</span>
              </Button>
              <Button
                className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                variant="ghost"
                type="button"
                onClick={() => {
                  setIsDropdownOpen(false);
                  handleLogout();
                }}
              >
                <span className={styles.dropdownIcon}>🚪</span>
                <span>Cerrar sesión</span>
              </Button>
            </div>
          )}
        </div>
      </aside>

      <main className={styles.main}>
        <AdminHeader />
        {/* Contenedor relativo para evitar saltos */}
        <div
          className={styles.content}
          style={{ display: "flex", flexDirection: "column" }}
        >
          <div
            key={location.pathname}
            style={{
              flex: 1,
              width: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Suspense fallback={<AdminLoadingFallback />}>
              <Outlet />
            </Suspense>
          </div>
        </div>
      </main>
      <ModalConfirm
        open={showWarning}
        title="Cambios sin guardar"
        description="Tenés cambios sin guardar. ¿Querés salir y descartarlos?"
        confirmText="Salir sin guardar"
        cancelText="Seguir editando"
        onConfirm={confirmNavigation}
        onCancel={cancelNavigation}
      />
    </div>
  );
}
