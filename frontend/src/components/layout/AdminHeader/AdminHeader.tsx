import { useLocation } from 'react-router-dom';
import styles from './AdminHeader.module.css';

interface Breadcrumb {
  label: string;
  path: string;
  isActive: boolean;
}

const ROUTE_NAMES: Record<string, string> = {
  dashboard: 'Dashboard',
  productos: 'Productos',
  variantes: 'Variantes',
  categorias: 'Categorías',
  pedidos: 'Pedidos',
  reportes: 'Reportes',
};

function generateBreadcrumbs(pathname: string): Breadcrumb[] {
  const segments = pathname
    .split('/')
    .filter((segment) => segment && segment !== 'admin');

  const breadcrumbs: Breadcrumb[] = [
    {
      label: 'Admin',
      path: '/admin/dashboard',
      isActive: segments.length === 0,
    },
  ];

  segments.forEach((segment, index) => {
    const isActive = index === segments.length - 1;
    const label = ROUTE_NAMES[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    
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
  const currentSection = breadcrumbs[breadcrumbs.length - 1]?.label || 'Dashboard';

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.breadcrumbSection}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.path} className={styles.breadcrumbItem}>
                {index > 0 && <span className={styles.separator}>/</span>}
                {crumb.isActive ? (
                  <span className={styles.breadcrumbActive}>{crumb.label}</span>
                ) : (
                  <a href={crumb.path} className={styles.breadcrumbLink}>
                    {crumb.label}
                  </a>
                )}
              </div>
            ))}
          </nav>
        </div>

        <div className={styles.titleSection}>
          <h1 className={styles.title}>{currentSection}</h1>
        </div>
      </div>
    </header>
  );
}
