
import type { FC } from 'react';
import type { Category } from '../../../types';
import styles from './AdminCategories.module.css';
import { CategoryCard } from './CategoryCard';
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
}) => (
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
    <div className={styles.grid}>
      {categories.map(cat => (
        <CategoryCard
          key={cat.id}
          category={cat}
          onEdit={onEdit}
          onDelete={onDelete}
          canEdit={canEdit}
          canDelete={canDelete}
          productCount={getProductCount?.(cat)}
          selected={selectedIds.includes(cat.id)}
          onSelect={onSelect}
        />
      ))}
    </div>
  </div>
);
