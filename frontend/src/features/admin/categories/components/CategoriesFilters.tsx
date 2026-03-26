import React from 'react';
import styles from '../AdminCategories.module.css';
import type { Category } from '../types/category';
import { CategorySearchInput } from '../../../../components/ui/CategorySearchInput';

interface CategoriesFiltersProps {
  categories: Category[];
  search: string;
  setSearch: (v: string) => void;
  setSelectedSuggestion: (v: string) => void;
  total: number;
}

export const CategoriesFilters: React.FC<CategoriesFiltersProps> = ({
  categories,
  search,
  setSearch,
  setSelectedSuggestion,
  total,
}) => (
  <div className={styles.filters}>
    <CategorySearchInput
      categories={categories}
      value={search}
      onChange={setSearch}
      onSelectSuggestion={cat => {
        setSearch(cat.name);
        setSelectedSuggestion(cat.name);
      }}
      placeholder="Buscar por nombre o slug..."
    />
    <span className={styles.count}>{total} categorías</span>
  </div>
);
