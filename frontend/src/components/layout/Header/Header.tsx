import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CircleUserRound, Menu, Search, ShoppingCart, X } from 'lucide-react';
import type { Category, NavigationItem } from '../../../types';
import { fetchPublicCategories } from '../../../services/categoriesService';
import styles from './Header.module.css';
import { useCart } from '../context/CartContextUtils';

const baseNavigation: NavigationItem[] = [
  { label: 'Ofertas', href: '/productos?tag=oferta' },
  { label: 'Novedades', href: '/productos?tag=nuevo' },
];

const fallbackNavigation: NavigationItem[] = [
  ...baseNavigation,
  { label: 'Ver todo el catalogo', href: '/productos' },
];

function buildNavigationFromCategories(categories: Category[]): NavigationItem[] {
  const visible = categories.filter((category) => category.isVisible);
  const roots = visible.filter((category) => !category.parentId);
  const childrenByParent = new Map<string, Category[]>();

  for (const category of visible) {
    if (category.parentId) {
      const current = childrenByParent.get(category.parentId) ?? [];
      current.push(category);
      childrenByParent.set(category.parentId, current);
    }
  }

  const rootItems: NavigationItem[] = roots.map((category) => {
    const children = childrenByParent.get(category.id) ?? [];
    return {
      label: category.name,
      href: `/productos?category=${encodeURIComponent(category.slug)}`,
      children: children.length
        ? children.map((child) => ({
            label: child.name,
            href: `/productos?category=${encodeURIComponent(child.slug)}`,
          }))
        : undefined,
    };
  });

  return [
    ...baseNavigation,
    ...rootItems,
    { label: 'Ver todo el catalogo', href: '/productos' },
  ];
}

export function Header() {
  const { totalItems } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>(fallbackNavigation);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  useEffect(() => {
    let ignore = false;

    fetchPublicCategories()
      .then((categories) => {
        if (!ignore && categories.length > 0) {
          setNavigationItems(buildNavigationFromCategories(categories));
        }
      })
      .catch((err) => {
        console.error('Error loading navigation categories:', err);
        if (!ignore) {
          setNavigationItems(fallbackNavigation);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <header
      className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}
      role="banner"
    >
      <div className={styles.inner}>
        <div className={styles.topRow}>
          <div className={styles.logo}>
            <Link to="/" className={styles.logoText} aria-label="Allmart - Inicio">
              allmart
            </Link>
          </div>

          <div className={styles.searchBar}>
            <div className={styles.searchWrapper}>
              <input
                type="search"
                className={styles.searchInput}
                placeholder="¿Qué producto estás buscando?"
                aria-label="Buscar productos"
              />
              <Search size={18} strokeWidth={2.25} className={styles.searchIcon} aria-hidden="true" />
            </div>
          </div>

          <div className={styles.userActions}>
            <Link to="/admin/login" className={styles.iconBtn} aria-label="Ingresar como administrador">
              <CircleUserRound size={19} strokeWidth={2.1} aria-hidden="true" />
              <span className={styles.actionLabel}>Ingresar</span>
            </Link>

            <Link to="/carrito" className={styles.iconBtn} aria-label="Carrito de compras">
              <ShoppingCart size={19} strokeWidth={2.1} aria-hidden="true" />
              <span className={styles.actionLabel}>Carrito</span>
              <span className={styles.cartCount}>{totalItems > 0 ? totalItems : 0}</span>
            </Link>
          </div>

          <div className={styles.mobileMenuTogle}>
            <button
              className={styles.menuToggle}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={mobileMenuOpen}
              type="button"
            >
              {mobileMenuOpen ? (
                <X size={20} strokeWidth={2.2} aria-hidden="true" />
              ) : (
                <Menu size={20} strokeWidth={2.2} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className={styles.navBarStrip}>
        <div className={styles.inner}>
          <nav className={styles.nav} role="navigation" aria-label="Navegación principal">
            {navigationItems.map((item) => (
              <div className={styles.navItem} key={item.href}>
                {item.children ? (
                  <>
                    <Link
                      to={item.href}
                      className={styles.navLink}
                      aria-haspopup="true"
                    >
                      {item.label}
                      <span className={styles.chevron} aria-hidden="true">▾</span>
                    </Link>
                    <div className={styles.dropdown} role="menu">
                      {item.children.map((child) => (
                        <Link
                          key={child.label}
                          to={child.href}
                          className={styles.dropdownLink}
                          role="menuitem"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </>
                ) : (
                  <Link to={item.href} className={styles.navLink}>
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      <nav
        className={`${styles.mobileNav} ${mobileMenuOpen ? styles.open : ''}`}
        role="navigation"
        aria-label="Navegación móvil"
      >
        {navigationItems.map((item) => (
          <div key={item.href}>
            <Link
              to={item.href}
              className={styles.mobileNavLink}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
            {item.children && (
              <div className={styles.mobileSubLinks}>
                {item.children.map((child) => (
                  <Link
                    key={child.label}
                    to={child.href}
                    className={styles.mobileSubLink}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </header>
  );
}
