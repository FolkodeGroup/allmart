// src/pages/Admin/AdminLayout.tsx
import { Suspense, useState, useEffect, useCallback } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useLocation, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { useAdminOrders } from "../../context/AdminOrdersContext";
import { useAdminProducts } from "../../context/useAdminProductsContext";
import { AdminHeader } from "../../components/layout/AdminHeader/AdminHeader";
import { UserProfileCard } from "../../components/layout/AdminSidebar/UserProfileCard";
import { Button } from '../../components/ui/Button/Button';
import { AdminLoadingFallback } from '../../components/ui/AdminLoadingFallback';
import styles from "./AdminLayout.module.css";
import { useUnsavedChanges } from '../../context/useUnsavedChanges';
import { ModalConfirm } from "../../components/ui/ModalConfirm";
import type { Permission } from "../../utils/permissions";

type NavBadge = "pending" | "lowStock" | null;

interface NavItem {
  label: string;
  to: string;
  icon: string;
  permission: Permission | null;
  badge: NavBadge;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    to: "/admin/dashboard",
    icon: "🏠",
    permission: null,
    badge: null,
  },
  {
    label: "Catalogo",
    to: "/admin/productos",
    icon: "🗂️",
    permission: null,
    badge: null,
    children: [
      {
        label: "Producto",
        to: "/admin/productos",
        icon: "📦",
        permission: null,
        badge: "lowStock",
      },
      {
        label: "Categorías",
        to: "/admin/categorias",
        icon: "🏷️",
        permission: null,
        badge: null,
      },
    ],
  },
  {
    label: "Pedidos",
    to: "/admin/pedidos",
    icon: "🛒",
    permission: null,
    badge: "pending",
  },
  {
    label: "Marketing",
    to: "/admin/promociones",
    icon: "📣",
    permission: null,
    badge: null,
    children: [
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
        icon: "🖼️",
        permission: null,
        badge: null,
      },
    ],
  },
  {
    label: "Reportes",
    to: "/admin/reportes",
    icon: "📊",
    permission: "reports.view",
    badge: null,
  },
];

type Theme = 'light' | 'dark';

/** Función pura para verificar si algún hijo (o descendiente) tiene la ruta activa */
function hasActiveChildPath(children: NavItem[], pathname: string): boolean {
  return children.some((child) => {
    if (pathname === child.to || pathname.startsWith(child.to + '/')) return true;
    if (child.children) return hasActiveChildPath(child.children, pathname);
    return false;
  });
}

export function AdminLayout() {
  const { can } = useAdminAuth();
  const { getPendingOrdersCount } = useAdminOrders();
  const { getLowStockCount } = useAdminProducts();
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

  // Grupos colapsables: set de `to` de items padre que están abiertos
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set());

  // Auto-expandir grupos que tienen un hijo activo según la ruta actual
  useEffect(() => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      navItems.forEach((item) => {
        if (item.children && hasActiveChildPath(item.children, location.pathname)) {
          next.add(item.to);
        }
      });
      return next;
    });
  }, [location.pathname]);

  const toggleGroup = useCallback((to: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(to)) {
        next.delete(to);
      } else {
        next.add(to);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "admin-sidebar-collapsed",
      JSON.stringify(isCollapsed),
    );
  }, [isCollapsed]);

  const getBadgeCount = (badge: NavBadge) => {
    if (badge === 'pending') return getPendingOrdersCount();
    if (badge === 'lowStock') return getLowStockCount();
    return null;
  };

  const handleNavItemClick =
    (to: string) => (e: ReactMouseEvent<HTMLAnchorElement>) => {
      setIsMobileOpen(false);
      if (isDirty) {
        e.preventDefault();
        interceptNavigation(() => navigate(to));
      }
    };

  const hasActiveChild = (children: NavItem[] | undefined): boolean => {
    if (!children?.length) return false;
    return children.some((child) => {
      if (location.pathname === child.to || location.pathname.startsWith(child.to + '/')) return true;
      return hasActiveChild(child.children);
    });
  };

  const renderNavItem = (item: NavItem, level = 0, parentLabel = '') => {
    const locked = item.permission !== null && !can(item.permission);
    const badgeCount = getBadgeCount(item.badge);
    const activeInTree = location.pathname === item.to || hasActiveChild(item.children);
    const breadcrumbLabel = parentLabel ? `${parentLabel} / ${item.label}` : item.label;
    const hasChildren = !!item.children?.length;
    const isExpanded = expandedGroups.has(item.to);

    // Items padre con hijos: botón de toggle (no navega)
    if (hasChildren && level === 0) {
      return (
        <div key={item.to} className={styles.navSection}>
          <button
            type="button"
            title={isCollapsed ? breadcrumbLabel : undefined}
            data-label={breadcrumbLabel}
            className={[
              styles.navItem,
              styles.navGroupToggle,
              activeInTree ? styles.navItemActive : '',
              locked ? styles.navItemLocked : '',
            ].filter(Boolean).join(' ')}
            onClick={() => !isCollapsed && toggleGroup(item.to)}
            aria-expanded={isExpanded}
            aria-label={breadcrumbLabel}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
            {locked && <span className={styles.navLockIcon}>🔒</span>}
            {badgeCount !== null && badgeCount > 0 && (
              <span className={styles.navBadge}>{badgeCount}</span>
            )}
            <span className={`${styles.navChevron} ${isExpanded ? styles.navChevronOpen : ''}`} aria-hidden="true">
              ›
            </span>
          </button>

          {!isCollapsed && (
            <div
              className={`${styles.navChildrenCollapsible} ${isExpanded ? styles.navChildrenOpen : ''}`}
              role="group"
              aria-label={item.label}
            >
              <div className={styles.navChildrenInner}>
                {item.children!.map((child) => renderNavItem(child, level + 1, breadcrumbLabel))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Items normales (sin hijos o anidados): NavLink
    return (
      <div key={item.to} className={level > 0 ? styles.navBranch : styles.navSection}>
        <NavLink
          title={isCollapsed ? breadcrumbLabel : ''}
          data-label={breadcrumbLabel}
          to={item.to}
          onClick={handleNavItemClick(item.to)}
          className={({ isActive }) => {
            const currentActive = isActive || activeInTree;
            return [
              styles.navItem,
              level > 0 ? styles.navItemNested : '',
              level > 1 ? styles.navItemDeepNested : '',
              currentActive ? styles.navItemActive : '',
              locked ? styles.navItemLocked : '',
            ]
              .filter(Boolean)
              .join(' ');
          }}
          aria-label={breadcrumbLabel}
        >
          <span className={styles.navIcon}>{item.icon}</span>
          <span className={styles.navLabel}>{item.label}</span>
          {locked && <span className={styles.navLockIcon}>🔒</span>}
          {badgeCount !== null && badgeCount > 0 && (
            <span className={styles.navBadge}>{badgeCount}</span>
          )}
        </NavLink>
        {!isCollapsed && item.children && item.children.length > 0 && (
          <div className={styles.navChildren} role="group" aria-label={item.label}>
            {item.children.map((child) => renderNavItem(child, level + 1, breadcrumbLabel))}
          </div>
        )}
      </div>
    );
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
            {navItems.map((item) => renderNavItem(item))}
          </nav>
        </div>

        <UserProfileCard isCollapsed={isCollapsed} />
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
