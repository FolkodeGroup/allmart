//src/components/layout/Admin/AdminHeader.tsx
import { useLocation } from "react-router-dom";
import styles from "./AdminHeader.module.css";
import { useEffect, useState } from "react";
import { CommandPalette } from "./CommandPalette";
import { useSearch } from "../../../hooks/useSearch";
import type { ProductSearch, OrderSearch, UserSearch } from "../../../types";


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
      path: "/admin/dashboard",
      isActive: segments.length === 0,
    },
  ];

  segments.forEach((segment, index) => {
    const isActive = index === segments.length - 1;
    const label =
      ROUTE_NAMES[segment] ||
      segment.charAt(0).toUpperCase() + segment.slice(1);

    breadcrumbs.push({
      label,
      path: `/admin/${segment}`,
      isActive,
    });
  });

  return breadcrumbs;
}

export function AdminHeader() {
  const location = useLocation();
  const breadcrumbs = generateBreadcrumbs(location.pathname);
  const currentSection =
    breadcrumbs[breadcrumbs.length - 1]?.label || "Dashboard";
  const [commandOpen, setCommandOpen] = useState(false);

  const products: ProductSearch[] = [
    { id: "1", name: "Auriculares Bluetooth", slug: "auriculares-bluetooth" },
    { id: "2", name: "Mouse Logitech", slug: "mouse-logitech" },
  ];

  const orders: OrderSearch[] = [{ id: "101" }, { id: "102" }];

  const users: UserSearch[] = [
    {
      id: "1",
      firstName: "Juan",
      lastName: "Perez",
      email: "juan@mail.com",
      isActive: true,
    },
  ];

  const items = useSearch(products, orders, users);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen(true);
      }

      if (e.key === "Escape") {
        setCommandOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <h1 className={styles.title}>{currentSection}</h1>
      </div>
      <button
        className={styles.searchInput}
        onClick={() => setCommandOpen(true)}
        type="button"
      >
        Buscar prod, order o user....
      </button>
      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        items={items}
      />
    </header>
  );
}
