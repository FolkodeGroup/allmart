//src/components/layout/Admin/AdminHeader.tsx
import { useLocation } from "react-router-dom";
import { useAdminCategories } from "../../../context/AdminCategoriesContext";
import styles from "./AdminHeader.module.css";

interface Breadcrumb {
  label: string;
  path: string;
  isActive: boolean;
}

const ROUTE_NAMES: Record<string, string> = {
  dashboard: "Dashboard",
  productos: "Productos",
  variantes: "Variantes",
  categorias: "Categorías",
  pedidos: "Pedidos",
  reportes: "Reportes",
};

function generateBreadcrumbs(pathname: string): Breadcrumb[] {
  const segments = pathname
    .split("/")
    .filter((segment) => segment && segment !== "admin");

  const breadcrumbs: Breadcrumb[] = [
    {
      label: "Admin",
      path: "/admin",
      isActive: segments.length === 0,
    },
  ];

  let currentPath = "/admin";

  segments.forEach((segment, index) => {
    const isActive = index === segments.length - 1;
    const label =
      ROUTE_NAMES[segment] ||
      segment.charAt(0).toUpperCase() + segment.slice(1);
    currentPath += `/${segment}`;

    breadcrumbs.push({
      label,
      path: currentPath,
      isActive,
    });
  });

  return breadcrumbs;
}

export function AdminHeader() {
  const location = useLocation();
  const { categories } = useAdminCategories();

  const categoryNameForPath = (() => {
    const match = location.pathname.match(/^\/admin\/categorias\/([^/]+)$/i);
    if (!match) return null;

    const rawParam = decodeURIComponent(match[1]);
    const category = categories.find(
      (item) =>
        item.id === rawParam ||
        item.slug?.toLowerCase() === rawParam.toLowerCase()
    );

    return category?.name ?? null;
  })();

  const breadcrumbs = generateBreadcrumbs(location.pathname).map((crumb, index, all) => {
    const isLast = index === all.length - 1;
    if (!isLast || !categoryNameForPath) return crumb;
    if (!crumb.path.startsWith('/admin/categorias/')) return crumb;

    return {
      ...crumb,
      label: categoryNameForPath,
    };
  });
  const currentSection =
    breadcrumbs[breadcrumbs.length - 1]?.label || "Dashboard";
  const todayLabel = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <span className={styles.kicker}>Panel administrativo</span>
        <h1 className={styles.title}>{currentSection}</h1>
        <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
          {breadcrumbs.map((breadcrumb, index) => (
            <span
              key={breadcrumb.path}
              className={breadcrumb.isActive ? styles.breadcrumbActive : ""}
            >
              {index > 0 && <span className={styles.separator}>/</span>}
              {breadcrumb.label}
            </span>
          ))}
        </nav>
      </div>

      <div className={styles.statusCard}>
        <span className={styles.statusLabel}>Sesion activa</span>
        <strong className={styles.statusValue}>Operacion en tiempo real</strong>
        <span className={styles.statusDate}>{todayLabel}</span>
      </div>
    </header>
  );
}
