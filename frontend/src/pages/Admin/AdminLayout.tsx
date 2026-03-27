// src/pages/Admin/AdminLayout.tsx
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { useAdminOrders } from "../../context/AdminOrdersContext";
import { useAdminProducts } from "../../context/AdminProductsContext";
import { AdminHeader } from "../../components/layout/AdminHeader/AdminHeader";
import { Button } from '../../components/ui/Button/Button';
import styles from "./AdminLayout.module.css";

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
  const location = useLocation();

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
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={12}
        toastOptions={{
          duration: 4000,
          style: {
            background: "var(--color-neutral-dark)",
            color: "var(--color-neutral-light)",
            borderRadius: "var(--radius-lg, 8px)",
            border: "1px solid rgba(255,255,255,0.1)",
            padding: "16px",
            fontFamily: "var(--font-ui)",
            fontSize: "var(--text-sm)",
            boxShadow: "var(--shadow-lg)",
          },
          success: {
            style: {
              background: "rgba(118, 146, 130, 0.15)",
              borderColor: "rgba(118, 146, 130, 0.4)",
              color: "var(--color-primary)",
            },
            iconTheme: {
              primary: "var(--color-primary)",
              secondary: "rgba(118, 146, 130, 0.15)",
            },
          },
          error: {
            style: {
              background: "rgba(220, 100, 100, 0.15)",
              borderColor: "rgba(220, 100, 100, 0.4)",
              color: "#dc6464",
            },
            iconTheme: {
              primary: "#dc6464",
              secondary: "rgba(220, 100, 100, 0.15)",
            },
          },
        }}
      />
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
                  <span
                    key={item.to}
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
                  key={item.to}
                  {...commonProps}
                  to={item.to}
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
      // ... en el renderizado del main
      <main className={styles.main}>
        <AdminHeader />
        {/* Contenedor relativo para evitar saltos */}
        <div
          className={styles.content}
          style={{ display: "flex", flexDirection: "column" }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {" "}
            {/* initial={false} evita el parpadeo al cargar la primera vez */}
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }} // Muy rápido para evitar que el ojo note el cambio
              style={{
                flex: 1,
                width: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
