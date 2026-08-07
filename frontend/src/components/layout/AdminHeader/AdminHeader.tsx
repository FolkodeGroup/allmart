// src/components/layout/AdminHeader/AdminHeader.tsx
import { useLocation } from "react-router-dom";
import { useCallback, useMemo } from "react";
import { useAdminCategories } from "../../../context/AdminCategoriesContext";
import { Menu } from "lucide-react";
import styles from "./AdminHeader.module.css";

interface Breadcrumb {
  label: string;
  path: string;
  isActive: boolean;
}

interface AdminHeaderProps {
  onOpenMobileMenu?: () => void;
}

const ROUTE_NAMES: Record<string, string> = {
  dashboard: "Dashboard",
  productos: "Productos",
  variantes: "Variantes",
  categorias: "Categorías",
  pedidos: "Pedidos",
  reportes: "Reportes",
  proveedores: "Proveedores",
  contactos: "Consultas",
  banners: "Banners",
  colecciones: "Colecciones",
  promociones: "Promociones",
  configuracion: "Configuración",
  editar: "Editar",
  detalle: "Detalle",
  nueva: "Nueva",
};

const isUUID = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

export function AdminHeader({ onOpenMobileMenu }: AdminHeaderProps) {
  const location = useLocation();
  const { categories } = useAdminCategories();

  const resolveCategoryName = useCallback((segment: string): string | null => {
    const rawParam = decodeURIComponent(segment).trim();
    const found = categories.find(
      (item) =>
        item.id === rawParam ||
        item.slug?.toLowerCase() === rawParam.toLowerCase()
    );
    return found?.name ?? null;
  }, [categories]);

  const breadcrumbs = useMemo(() => {
    const segments = location.pathname
      .split("/")
      .filter((segment) => segment && segment !== "admin");

    const list: Breadcrumb[] = [
      {
        label: "Admin",
        path: "/admin",
        isActive: segments.length === 0,
      },
    ];

    let currentPath = "/admin";

    segments.forEach((segment, index) => {
      const isActive = index === segments.length - 1;
      currentPath += `/${segment}`;

      const catName = resolveCategoryName(segment);
      let label = catName || ROUTE_NAMES[segment] || (segment.charAt(0).toUpperCase() + segment.slice(1));

      // Si es un UUID no resuelto directamente en la lista de categorías
      if (!catName && isUUID(segment)) {
        label = "Detalle";
      }

      list.push({
        label,
        path: currentPath,
        isActive,
      });
    });

    return list;
  }, [location.pathname, resolveCategoryName]);

  const currentSection = useMemo(() => {
    const segments = location.pathname.split("/").filter(Boolean);
    const catSegment = segments.find(s => resolveCategoryName(s) !== null);
    if (catSegment) {
      const name = resolveCategoryName(catSegment);
      if (location.pathname.endsWith("/editar")) {
        return `Editar — ${name}`;
      }
      if (location.pathname.endsWith("/detalle")) {
        return `Detalle — ${name}`;
      }
      return name;
    }

    return breadcrumbs[breadcrumbs.length - 1]?.label || "Dashboard";
  }, [breadcrumbs, location.pathname, resolveCategoryName]);

  const todayLabel = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {onOpenMobileMenu && (
          <button
            type="button"
            className={styles.mobileMenuBtn}
            onClick={onOpenMobileMenu}
            aria-label="Abrir menú de navegación"
          >
            <Menu size={20} strokeWidth={2.2} />
          </button>
        )}
        <div className={styles.headerTitleGroup}>
          <span className={styles.kicker}>PANEL ADMINISTRATIVO</span>
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
      </div>

      <div className={styles.statusCard}>
        <span className={styles.statusLabel}>Sesión activa</span>
        <strong className={styles.statusValue}>Operación en tiempo real</strong>
        <span className={styles.statusDate}>{todayLabel}</span>
      </div>
    </header>
  );
}