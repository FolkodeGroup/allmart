import { useRef, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import type { Category } from '../../../types';
import styles from './CategoryMegaMenu.module.css';


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
          <div className={styles.megaMenuContent}>
            {roots.map((root) => {
              const children = childrenByParent.get(root.id) ?? [];
              return (
                <div key={root.id} className={styles.menuColumn}>
                  <div className={styles.columnHeader}>
                    <h3 className={styles.columnTitle}>
                      <Link
                        to={`/productos?category=${encodeURIComponent(root.slug)}`}
                        className={styles.columnTitleLink}
                        onClick={onClose}
                      >
                        {getCategoryLabel(root)}
                        <ChevronRight size={14} className={styles.columnArrow} aria-hidden="true" />
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
                          </Link>
                        </li>
                      ))}
                      <li>
                        <Link
                          to={`/productos?category=${encodeURIComponent(root.slug)}`}
                          className={styles.viewAllLink}
                          onClick={onClose}
                        >
                          Ver todo
                        </Link>
                      </li>
                    </ul>
                  )}
                </div>
              );
            })}
          </div>

          <div className={styles.megaMenuFooter}>
            <Link
              to="/productos"
              className={styles.allProductsLink}
              onClick={onClose}
            >
              <span className={styles.allProductsText}>Ver todo</span>
              <ArrowRight size={16} className={styles.allProductsIcon} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
