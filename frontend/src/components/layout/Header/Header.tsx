import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CircleUserRound, Heart, Menu, Search, ShoppingCart, X } from 'lucide-react';
import type { NavigationItem, Category, Product } from '../../../types';
import { fetchPublicCategories } from '../../../services/categoriesService';
import { buildNavigationFromCategories, fallbackNavigation } from '../navigation/publicNavigation';
import { CategoryMegaMenu } from './CategoryMegaMenu';
import styles from './Header.module.css';
import { useCart } from '../context/CartContextUtils';
import { useFavorites } from '../context/FavoritesContextUtils';
import { ProductSearch } from '../../ui/ProductSearch';
import { useProductSearch } from '../../../hooks/useProductSearch';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { fetchPublicProducts, mapApiProductToProduct } from '../../../services/productsService';

export function Header() {
  const { totalItems } = useCart();
  const { totalItems: totalFavorites } = useFavorites();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>(fallbackNavigation);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);

  const [products, setProducts] = useState<Product[]>([]);
  const [results, setResults] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    fetchPublicProducts({})
      .then((res) => {
        setProducts(res.data.map((p) => mapApiProductToProduct(p, allCategories)));
      })
      .catch(console.error);
  }, [allCategories]);

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
          setAllCategories(categories);
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

  const filteredResults = useProductSearch({
    query: debouncedQuery,
    products,
    categories: allCategories,
  });

  useEffect(() => {
    setResults(filteredResults.slice(0, 5));
    setShowDropdown(debouncedQuery.length > 0);
  }, [filteredResults, debouncedQuery]);

  const handleSearchSubmit = () => {
    if (!query.trim()) return;
    window.location.href = `/productos?q=${encodeURIComponent(query)}`;
  };

  const handleChange = (value: string) => {
    setQuery(value);
  };

  const handleCloseDropdown = () => {
    setShowDropdown(false);
  };

  useEffect(() => {
    const handleClickOutside = (_e: MouseEvent) => {
      setShowDropdown(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <>
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

            <div className={styles.searchBar} ref={searchRef}>
              <ProductSearch
                query={query}
                onChange={handleChange}
                onSubmit={handleSearchSubmit}
                results={results}
                showDropdown={showDropdown}
                onCloseDropdown={handleCloseDropdown}
              />
            </div>

            <div className={styles.userActions}>
              <Link to="/admin/login" className={styles.iconBtn} aria-label="Ingresar como administrador">
                <CircleUserRound size={19} strokeWidth={2.1} aria-hidden="true" />
                <span className={styles.actionLabel}>Ingresar</span>
              </Link>

              <Link to="/favoritos" className={styles.iconBtn} aria-label="Mis favoritos">
                <Heart size={19} strokeWidth={2.1} aria-hidden="true" />
                <span className={styles.actionLabel}>Favoritos</span>
                <span className={styles.actionCount}>{totalFavorites > 0 ? totalFavorites : 0}</span>
              </Link>

              <Link to="/carrito" className={styles.iconBtn} aria-label="Carrito de compras">
                <ShoppingCart size={19} strokeWidth={2.1} aria-hidden="true" />
                <span className={styles.actionLabel}>Carrito</span>
                <span className={styles.actionCount}>{totalItems > 0 ? totalItems : 0}</span>
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

              {/* Mega Menu para todas las categorías */}
              {allCategories.length > 0 && (
                <div className={styles.navItem}>
                  <CategoryMegaMenu
                    categories={allCategories}
                    isOpen={megaMenuOpen}
                    onToggle={() => setMegaMenuOpen(!megaMenuOpen)}
                    onClose={() => setMegaMenuOpen(false)}
                  />
                </div>
              )}
            </nav>
          </div>
        </div>

      </header>

      <nav
        className={`${styles.mobileNav} ${mobileMenuOpen ? styles.open : ''}`}
        role="navigation"
        aria-label="Navegación móvil"
        aria-hidden={!mobileMenuOpen}
      >
        {/* Backdrop: clic para cerrar */}
        <div
          className={styles.mobileNavBackdrop}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />

        <div className={styles.mobileNavPanel}>
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

          <Link
            to="/favoritos"
            className={styles.mobileNavLink}
            onClick={() => setMobileMenuOpen(false)}
          >
            Favoritos
          </Link>

          {/* Todas las Categorías en menú móvil */}
          {allCategories.length > 0 && (
            <details className={styles.mobileCategory}>
              <summary className={styles.mobileCategorySummary}>
                Todas las Categorías
              </summary>
              <div className={styles.mobileCategoryList}>
                {allCategories
                  .filter(cat => !cat.parentId && cat.isVisible)
                  .map((category) => (
                    <div key={category.id}>
                      <Link
                        to={`/productos?category=${encodeURIComponent(category.slug)}`}
                        className={styles.mobileSubLink}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {category.name || category.slug}
                      </Link>
                    </div>
                  ))}
              </div>
            </details>
          )}
        </div>
      </nav>
    </>
  );
}
