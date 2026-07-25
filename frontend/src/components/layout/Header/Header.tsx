import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CircleUserRound, Heart, Menu, ShoppingCart, X } from 'lucide-react';
import type { NavigationItem, Category, Product } from '../../../types';
import { fetchPublicCategories } from '../../../services/categoriesService';
import { buildNavigationFromCategories, fallbackNavigation } from '../navigation/publicNavigation';
import { CategoryMegaMenu } from './CategoryMegaMenu';
import styles from './Header.module.css';
import { useCart } from '../context/CartContextUtils';
import { useFavorites } from '../context/FavoritesContextUtils';
import { ProductSearch } from '../../ui/ProductSearch';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { fetchPublicProducts, mapApiProductToProduct } from '../../../services/productsService';

function InstagramIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false" width="18" height="18">
      <path d="M8 0C5.829 0 5.556.01 4.703.048c-.85.038-1.431.173-1.94.37a3.92 3.92 0 0 0-1.417.923A3.924 3.924 0 0 0 .423 2.758c-.197.51-.332 1.091-.37 1.94C.012 5.555 0 5.828 0 8s.01 2.445.048 3.297c.038.85.173 1.431.37 1.94.203.527.48.974.923 1.417.444.443.89.72 1.417.923.51.197 1.091.332 1.94.37C5.555 15.988 5.828 16 8 16s2.445-.01 3.297-.048c.85-.038 1.431-.173 1.94-.37a3.93 3.93 0 0 0 1.417-.923 3.93 3.93 0 0 0 .923-1.417c.197-.51.332-1.091.37-1.94C15.988 10.445 16 10.172 16 8s-.01-2.445-.048-3.297c-.038-.85-.173-1.431-.37-1.94a3.924 3.924 0 0 0-.923-1.417A3.924 3.924 0 0 0 13.242.423c-.51-.197-1.091-.332-1.94-.37C10.445.012 10.172 0 8 0m0 1.44c2.135 0 2.387.008 3.232.046.781.036 1.206.166 1.488.276.374.145.641.318.92.597.28.279.453.546.598.92.109.282.24.707.275 1.488.038.845.046 1.097.046 3.232s-.008 2.387-.046 3.232c-.036.781-.166 1.206-.276 1.488a2.49 2.49 0 0 1-.597.92 2.49 2.49 0 0 1-.92.598c-.282.109-.707.24-1.488.275-.845.038-1.097.046-3.232.046s-2.387-.008-3.232-.046c-.781-.036-1.206-.166-1.488-.276a2.49 2.49 0 0 1-.92-.597 2.49 2.49 0 0 1-.598-.92c-.109-.282-.24-.707-.275-1.488C1.448 10.387 1.44 10.135 1.44 8s.008-2.387.046-3.232c.036-.781.166-1.206.276-1.488.145-.374.318-.641.597-.92.279-.28.546-.453.92-.598.282-.109.707-.24 1.488-.275C5.613 1.448 5.865 1.44 8 1.44" />
      <path d="M8 3.892A4.108 4.108 0 1 0 8 12.108 4.108 4.108 0 0 0 8 3.892m0 6.776A2.668 2.668 0 1 1 8 5.332a2.668 2.668 0 0 1 0 5.336m4.27-6.945a.96.96 0 1 1-1.92 0 .96.96 0 0 1 1.92 0" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false" width="18" height="18">
      <path d="M13.601 2.326A7.92 7.92 0 0 0 8.02 0C3.66 0 .11 3.55.11 7.91c0 1.395.365 2.757 1.06 3.958L0 16l4.247-1.114a7.87 7.87 0 0 0 3.77.957h.003c4.36 0 7.91-3.55 7.91-7.91a7.88 7.88 0 0 0-2.33-5.607M8.02 14.5h-.003a6.53 6.53 0 0 1-3.325-.91l-.238-.141-2.52.661.673-2.456-.155-.251a6.53 6.53 0 0 1-1.006-3.493c0-3.604 2.932-6.536 6.537-6.536 1.743 0 3.38.68 4.614 1.913a6.51 6.51 0 0 1 1.916 4.625c-.002 3.604-2.934 6.536-6.537 6.536m3.584-4.892c-.197-.099-1.17-.578-1.352-.644s-.315-.099-.447.099-.513.644-.63.776-.23.148-.427.05c-.197-.099-.83-.306-1.58-.977-.584-.52-.979-1.162-1.093-1.359s-.012-.304.086-.402c.089-.088.197-.23.296-.345.099-.116.132-.198.198-.33.066-.132.033-.248-.017-.347-.05-.099-.447-1.078-.612-1.477-.161-.387-.325-.335-.447-.341l-.38-.007c-.132 0-.347.05-.529.248s-.694.677-.694 1.652.71 1.916.809 2.048c.099.132 1.397 2.133 3.386 2.992.473.204.843.326 1.132.417.476.152.91.131 1.253.08.382-.057 1.17-.478 1.336-.94.165-.463.165-.859.116-.94-.05-.082-.182-.132-.38-.231" />
    </svg>
  );
}

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

  const [results, setResults] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // 🚀 OPTIMIZACIÓN: Autocompletado directo y dinámico al backend cuando cambia el query
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    let active = true;

    fetchPublicProducts({ q: debouncedQuery, limit: 5 })
      .then((res) => {
        if (!active) return;
        const mapped = res.data.map((p) => mapApiProductToProduct(p, allCategories));
        setResults(mapped);
        setShowDropdown(true);
      })
      .catch(console.error);

    return () => {
      active = false;
    };
  }, [debouncedQuery, allCategories]);

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
                {totalItems > 0 && (<span className={styles.actionCount}>{totalItems}</span>)}
              </Link>

              <div className={styles.socialActions} aria-label="Redes sociales">
                <a
                  href="https://www.instagram.com/allmart.bazar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                  aria-label="Instagram"
                >
                  <InstagramIcon />
                </a>
                <a
                  href="https://wa.me/+5491165891091"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                  aria-label="WhatsApp"
                >
                  <WhatsAppIcon />
                </a>
              </div>
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