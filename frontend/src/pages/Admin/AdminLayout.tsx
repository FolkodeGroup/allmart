// src/pages/Admin/AdminLayout.tsx
import { Suspense, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useLocation, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { AdminHeader } from "../../components/layout/AdminHeader/AdminHeader";
import { UserProfileCard } from "../../components/layout/AdminSidebar/UserProfileCard";
import { Button } from '../../components/ui/Button/Button';
import { AdminLoadingFallback } from '../../components/ui/AdminLoadingFallback';
import styles from "./AdminLayout.module.css";
import { useUnsavedChanges } from '../../context/useUnsavedChanges';
import { ModalConfirm } from "../../components/ui/ModalConfirm/ModalConfirm";
import type { Permission } from "../../utils/permissions";
import { useNavBadges } from "./hooks/useNavBadges";
import { useAdminTheme } from "./hooks/useAdminTheme";
import { useExpandedNavGroups } from "./hooks/useExpandedNavGroups";

type NavBadge = "pending" | "lowStock" | "outOfStock" | "unreadContacts" | null;

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
    children: [
      {
        label: "Todos los pedidos",
        to: "/admin/pedidos",
        icon: "🛒",
        permission: null,
        badge: "pending",
      },
      {
        label: "⚠️ Sin stock",
        to: "/admin/alertas-sin-stock",
        icon: "🚨",
        permission: null,
        badge: "outOfStock",
      },
    ],
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
  {
    label: "Proveedores",
    to: "/admin/proveedores",
    icon: "🏭",
    permission: "suppliers.view",
    badge: null,
  },
  {
    label: "Consultas",
    to: "/admin/contactos",
    icon: "💬",
    permission: "contacts.view",
    badge: "unreadContacts",
  },
];

export function AdminLayout() {
  const { can } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isDirty,
    interceptNavigation,
    showWarning,
    confirmNavigation,
    cancelNavigation,
  } = useUnsavedChanges();

  // Extract badge logic into custom hook
  const { getBadgeCount } = useNavBadges();

  // Extract theme logic into custom hook
  const { theme, setTheme } = useAdminTheme();

  // Extract expandedGroups logic into custom hook
  const { expandedGroups, toggleGroup } = useExpandedNavGroups(navItems);

  const [isMobileOpen, setIsMobileOpen] = useState(false);

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
            title={breadcrumbLabel}
            data-label={breadcrumbLabel}
            className={[
              styles.navItem,
              styles.navGroupToggle,
              activeInTree ? styles.navItemActive : '',
              locked ? styles.navItemLocked : '',
            ].filter(Boolean).join(' ')}
            onClick={() => toggleGroup(item.to)}
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

          <div
            className={`${styles.navChildrenCollapsible} ${isExpanded ? styles.navChildrenOpen : ''}`}
            role="group"
            aria-label={item.label}
          >
            <div className={styles.navChildrenInner}>
              {item.children!.map((child) => renderNavItem(child, level + 1, breadcrumbLabel))}
            </div>
          </div>
        </div>
      );
    }

    // Items normales (sin hijos o anidados): NavLink
    return (
      <div key={item.to} className={level > 0 ? styles.navBranch : styles.navSection}>
        <NavLink
          title={breadcrumbLabel}
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
        {item.children && item.children.length > 0 && (
          <div className={styles.navChildren} role="group" aria-label={item.label}>
            {item.children.map((child) => renderNavItem(child, level + 1, breadcrumbLabel))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`${styles.wrapper} ${theme === 'dark' ? 'admin-dark' : ''}`}>
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
          <span className={styles.brandTag}>Admin</span>
        </div>

        {/* Agrupación: Dark mode + navItems en un solo bloque */}
        <div className={styles.navGroup}>
          <Button
            className={`${styles.darkToggle} ${styles.darkToggleExpanded}`}
            aria-label="Cambiar modo oscuro"
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            variant="ghost"
          >
            <p className={styles.navItem} style={{ color: '#000', background: 'none', width: 48, height: 32 }}>
              {theme === 'dark' ? '🌙' : '☀️'}

            </p>
          </Button>
          <nav className={styles.nav}>
            {navItems.map((item) => renderNavItem(item))}
          </nav>
        </div>

        <UserProfileCard />
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
