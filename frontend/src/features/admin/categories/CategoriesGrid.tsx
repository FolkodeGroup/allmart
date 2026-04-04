
import type { FC } from 'react';
import { useLayoutEffect, useRef } from 'react';
import type { Category } from '../../../types';
import styles from './AdminCategories.module.css';
import { CategoryCard } from './CategoryCard';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeSlideIn } from './animationConfig';
import { Tooltip } from '../../../components/ui/Tooltip';

interface CategoriesGridProps {
  categories: Category[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  getProductCount?: (category: Category) => number | undefined;
  selectedIds: string[];
  onSelect: (id: string, checked: boolean) => void;
  allSelected: boolean;
  onSelectAll: (checked: boolean) => void;
  onToggleVisibility?: (id: string, newVisible: boolean) => void;
}

export const CategoriesGrid: FC<CategoriesGridProps> = ({
  categories,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
  getProductCount,
  selectedIds,
  onSelect,
  allSelected,
  onSelectAll,
  onToggleVisibility,
}) => {
  const gridRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const gridElement = gridRef.current;
    if (!gridElement) return;

    let frameId = 0;

    const recalculateHeights = () => {
      cancelAnimationFrame(frameId);

      frameId = window.requestAnimationFrame(() => {
        const cardItems = Array.from(
          gridElement.querySelectorAll<HTMLElement>('[data-uniform-category-card="true"]')
        );

        if (cardItems.length === 0) return;

        // Reset first so cards can shrink when content/viewport changes.
        cardItems.forEach((item) => {
          item.style.minHeight = '0px';
        });

        const maxHeight = cardItems.reduce((max, item) => {
          return Math.max(max, Math.ceil(item.getBoundingClientRect().height));
        }, 0);

        cardItems.forEach((item) => {
          item.style.minHeight = `${maxHeight}px`;
        });
      });
    };

    recalculateHeights();

    const resizeObserver = new ResizeObserver(() => {
      recalculateHeights();
    });

    resizeObserver.observe(gridElement);
    gridElement.querySelectorAll<HTMLElement>('[data-uniform-category-card="true"]').forEach((item) => {
      resizeObserver.observe(item);
    });

    window.addEventListener('resize', recalculateHeights);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', recalculateHeights);
    };
  }, [categories]);

  return (
    <div>
      {/* Header con checkbox general y ayuda contextual */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, gap: 8 }}>
        <Tooltip content="Seleccionar todas las categorías visibles (para acciones masivas)">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={e => onSelectAll(e.target.checked)}
            aria-label="Seleccionar todas las categorías visibles"
            tabIndex={0}
          />
        </Tooltip>
        <span style={{ fontWeight: 500 }}>Seleccionar todas las categorías</span>
      </div>
      <div className={styles.grid} ref={gridRef}>
        <AnimatePresence>
          {categories.map(cat => (
            <motion.div
              key={cat.id}
              variants={fadeSlideIn}
              initial="hidden"
              animate="visible"
              exit="exit"
              layout
              className={styles.gridItem}
              data-uniform-category-card="true"
              style={{ willChange: 'opacity, transform' }}
            >
              <CategoryCard
                category={cat}
                onEdit={onEdit}
                onDelete={onDelete}
                canEdit={canEdit}
                canDelete={canDelete}
                productCount={getProductCount?.(cat)}
                selected={selectedIds.includes(cat.id)}
                onSelect={onSelect}
                onToggleVisibility={onToggleVisibility}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
