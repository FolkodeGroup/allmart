import { useRef, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  Sofa,
  Users,
  Coffee,
  Utensils,
  Lightbulb,
  Shirt,
  Wrench,
  Home,
  Package,
  ArrowRight,
} from 'lucide-react';
import type { Category } from '../../../types';
import styles from './CategoryMegaMenu.module.css';

// Map category names to icons
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  hogar: <Home size={20} />,
  sala: <Sofa size={20} />,
  dormitorio: <Sofa size={20} />,
  cocina: <Utensils size={20} />,
  baño: <Users size={20} />,
  comedor: <Utensils size={20} />,
  'cafe y mate': <Coffee size={20} />,
  bebidas: <Coffee size={20} />,
  reposteria: <Utensils size={20} />,
  iluminacion: <Lightbulb size={20} />,
  textiles: <Shirt size={20} />,
  herramientas: <Wrench size={20} />,
  organizacion: <Package size={20} />,
  jardineria: <Home size={20} />,
  ferreria: <Wrench size={20} />,
};

function getCategoryIcon(categoryName: string): React.ReactNode {
  const lowerName = categoryName.toLowerCase().trim();
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (lowerName.includes(key) || key.includes(lowerName)) {
      return icon;
    }
  }
  return <Package size={20} />;
}

interface CategoryMegaMenuProps {
  categories: Category[];
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export function CategoryMegaMenu({
  categories,
  isOpen,
  onToggle,
  onClose,
}: CategoryMegaMenuProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPanelStyle, setMenuPanelStyle] = useState<CSSProperties>();

  // Filter visible and organize by parent
  const visible = categories.filter((cat) => cat.isVisible);
  const roots = visible
    .filter((cat) => !cat.parentId)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const childrenByParent = new Map<string, Category[]>();

  for (const category of visible) {
    if (category.parentId) {
      const current = childrenByParent.get(category.parentId) ?? [];
      current.push(category);
      childrenByParent.set(category.parentId, current);
    }
  }

  for (const children of childrenByParent.values()) {
    children.sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        menuRef.current &&
        triggerRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const updatePanelPosition = () => {
      const triggerRect = triggerRef.current?.getBoundingClientRect();
      if (!triggerRect) return;

      const top = Math.max(Math.round(triggerRect.bottom + 10), 84);
      setMenuPanelStyle({
        '--mega-menu-top': `${top}px`,
      } as CSSProperties);
    };

    updatePanelPosition();

    window.addEventListener('resize', updatePanelPosition);
    window.addEventListener('scroll', updatePanelPosition, true);

    return () => {
      window.removeEventListener('resize', updatePanelPosition);
      window.removeEventListener('scroll', updatePanelPosition, true);
    };
  }, [isOpen]);

  const getCategoryLabel = (category: Category): string => {
    const trimmed = category.name?.trim();
    if (trimmed) return trimmed;
    
    const decoded = decodeURIComponent(category.slug || '').trim();
    if (!decoded) return 'Categoría';
    
    const normalized = decoded.replace(/[-_]+/g, ' ').trim();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

  return (
    <div className={styles.megaMenuContainer}>
      <button
        ref={triggerRef}
        className={`${styles.megaMenuTrigger} ${isOpen ? styles.active : ''}`}
        onClick={onToggle}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        Todas las Categorías
        <ChevronDown size={16} className={styles.triggerIcon} aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className={styles.megaMenuPanel}
          style={menuPanelStyle}
          role="menu"
        >
          <div className={styles.megaMenuHeader}>
            <h2 className={styles.megaMenuTitle}>Explora nuestras categorías</h2>
            <p className={styles.megaMenuSubtitle}>
              Encuentra todo lo que necesitas
            </p>
          </div>

          <div className={styles.megaMenuContent}>
            {/* Main categories with children */}
            {roots.map((root) => {
              const children = childrenByParent.get(root.id) ?? [];
              return (
                <div key={root.id} className={styles.menuColumn}>
                  <div className={styles.columnHeader}>
                    <div className={styles.iconWrapper}>
                      {getCategoryIcon(root.name)}
                    </div>
                    <h3 className={styles.columnTitle}>
                      <Link
                        to={`/productos?category=${encodeURIComponent(root.slug)}`}
                        className={styles.columnTitleLink}
                        onClick={onClose}
                      >
                        {getCategoryLabel(root)}
                      </Link>
                    </h3>
                  </div>

                  {children.length > 0 && (
                    <ul className={styles.subCategories}>
                      {children.map((child) => (
                        <li key={child.id}>
                          <Link
                            to={`/productos?category=${encodeURIComponent(child.slug)}`}
                            className={styles.subCategoryLink}
                            onClick={onClose}
                          >
                            <span className={styles.subCategoryName}>
                              {getCategoryLabel(child)}
                            </span>
                            {child.itemCount ? (
                              <span className={styles.itemCount}>
                                {child.itemCount}
                              </span>
                            ) : null}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}

            {/* "All Products" section */}
            <div className={styles.menuColumn}>
              <Link
                to="/productos"
                className={styles.allProductsLink}
                onClick={onClose}
              >
                <span className={styles.allProductsText}>Ver catálogo completo</span>
                <ArrowRight size={18} className={styles.allProductsIcon} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
