import { useState, useEffect} from 'react';
import { Link } from 'react-router-dom';
import { navigation } from '../../../data/mock';
import styles from './Header.module.css';
import { useCart } from '../context/CartContextUtils';
// import logo from '../../../assests/images/logos/favicon_io/android-chrome-192x192.png'

function MobileNavItem({ item, closeMenu }: { item: any, closeMenu: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  if (!item.children) {
    return (
      <Link to={item.href} className={styles.mobileNavLink} onClick={closeMenu}>
        {item.label}
      </Link>
    ); 
  }

  return (
  <div className={styles.mobileNavItemContainer}>
    <button
      type='button'
      className={styles.mobileCategoryBtn}
      onClick={() => setIsOpen(!isOpen)}
      aria-expanded={!isOpen}
    >
      <span>{item.label}</span>
      <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>▾</span>
    </button>
    
    <div className={`${styles.mobileSubLink} ${isOpen ? styles.show : ''}`}>
      {item.children.map((child: any) => (
        <Link
          key={child.label}
          to={child.href}
          className={styles.mobileSubLink}
          onClick={closeMenu}
        >
          {child.label}
        </Link>
      ))}
    </div>
  </div>
)
}



export function Header() {
  const { totalItems } = useCart()
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
        
        
        <div className={styles.topRow}>
          <div className={styles.logo}>
            <Link to="/" className={styles.logoText} aria-label="Allmart - Inicio">
              {/*  <img src={logo} alt='Allmart Logo' className={ styles.logoImage }></img> */}
              <span className={ styles.logoText }>allmart</span>
            </Link>
          </div>
          
          <div className={styles.searchBar}>
            <div className={`${styles.searchWrapper} ${searchOpen ? styles.open : ''}`}>
              <input
                type="search"
                className={styles.searchInput}
                placeholder="¿Qué producto estás buscando?"
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
          </div>
          <div className={styles.userActions}>
            <button className={styles.iconBtn} aria-label="Mi cuenta" type="button">
              👤
            </button>
          
            <Link to="/carrito" className={styles.iconBtn} aria-label="Carrito de compras">
              🛒
              <span className={styles.cartCount}>{ totalItems > 0 ? totalItems : null }</span>
            </Link>
          </div>
          <div className={styles.mobileMenuTogle}>
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
      </div>
      
      {!mobileMenuOpen && (
        <div className={`${styles.navBarStrip} ${isSidebarCollapsed ? styles.collapsed : ''}`}>
          <div className={styles.inner}>
            
            <button
              className={styles.collapsedBtn}
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              type='button'
            >
              {isSidebarCollapsed ? '→' : '←'}
            </button>
            
            {/* Desktop Nav */}
            <nav className={styles.nav} role="navigation" aria-label="Navegación principal">
              {navigation.map((item) => (
                <div className={styles.navItem} key={item.label}>
                  {item.children ? (
                    <>
                      <button className={styles.navLink} type="button">
                        <span className={styles.navIcon}>{item.icon || '📦'} </span>
                        <span className={styles.navLabel}>{item.label}</span>
                        <span className={styles.chevron} aria-hidden="true">▾</span>
                        aria-expanded="false"
                        aria-haspopup="true"
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
                      <span className={styles.navIcon}>{item.icon || '📦'} </span>
                      <span className={styles.navLabel}>{item.label}</span>
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}

        
        

      {/* Mobile Nav */}
      <nav
        className={`${styles.mobileNav} ${mobileMenuOpen ? styles.open : ''}`}
        role="navigation"
        aria-label="Navegación móvil"
      >
        {navigation.map((item) => (
          <MobileNavItem
            key={item.label}
            item={item}
            closeMenu={() => setMobileMenuOpen(false)}
          />
        ))}
      </nav>
    </header>
  );
}
