import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { navigation } from '../../../data/mock';
import styles from './Header.module.css';

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  return (
    <header
      className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}
      role="banner"
    >
      <div className={styles.inner}>
        {/* Logo */}
        <div className={styles.logo}>
          <Link to="/" className={styles.logoText} aria-label="Allmart - Inicio">
            allmart
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className={styles.nav} role="navigation" aria-label="Navegación principal">
          {navigation.map((item) => (
            <div className={styles.navItem} key={item.label}>
              {item.children ? (
                <>
                  <button
                    className={styles.navLink}
                    aria-expanded="false"
                    aria-haspopup="true"
                    type="button"
                  >
                    {item.label}
                    <span className={styles.chevron} aria-hidden="true">▾</span>
                  </button>
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

        {/* Actions */}
        <div className={styles.actions}>
          <div className={`${styles.searchWrapper} ${searchOpen ? styles.open : ''}`}>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Buscar productos..."
              aria-label="Buscar productos"
              onBlur={() => setSearchOpen(false)}
            />
            <button
              className={styles.searchBtn}
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Abrir búsqueda"
              type="button"
            >
              🔍
            </button>
          </div>

          <button className={styles.iconBtn} aria-label="Mi cuenta" type="button">
            👤
          </button>

          <Link to="/carrito" className={styles.iconBtn} aria-label="Carrito de compras">
            🛒
            <span className={styles.cartCount}>0</span>
          </Link>

          {/* Mobile menu toggle */}
          <button
            className={styles.menuToggle}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileMenuOpen}
            type="button"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <nav
        className={`${styles.mobileNav} ${mobileMenuOpen ? styles.open : ''}`}
        role="navigation"
        aria-label="Navegación móvil"
      >
        {navigation.map((item) => (
          <div key={item.label}>
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
