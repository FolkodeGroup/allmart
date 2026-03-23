import type { FC } from 'react';
import type { Category } from '../../../types';
import styles from './AdminCategories.module.css';
import { CategoryCard } from './CategoryCard';

interface CategoriesGridProps {
  categories: Category[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  getProductCount?: (category: Category) => number | undefined;
}

export const CategoriesGrid: FC<CategoriesGridProps> = ({
  categories,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
  getProductCount,
}) => (
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
      />
    ))}
  </div>
);
