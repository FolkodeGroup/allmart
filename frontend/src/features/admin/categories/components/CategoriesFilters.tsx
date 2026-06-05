import React from 'react';
import styles from '../AdminCategories.module.css';
import { CategorySearchInput } from '../../../../components/ui/CategorySearchInput';

interface CategoriesFiltersProps {
  search: string;
  setSearch: (v: string) => void;
  total: number;
  minProducts: number | '';
  setMinProducts: (v: number | '') => void;
  maxProducts: number | '';
  setMaxProducts: (v: number | '') => void;
  isVisible: 'all' | 'visible' | 'hidden';
  setIsVisible: (v: 'all' | 'visible' | 'hidden') => void;
}

export const CategoriesFilters: React.FC<CategoriesFiltersProps> = ({
  search,
  setSearch,
  total,
  minProducts,
  setMinProducts,
  maxProducts,
  setMaxProducts,
  isVisible,
  setIsVisible,
}) => {
  return (
    <div
      className={styles.filters}
      style={{

      }}
    >
      {/* 🔍 Buscador */}
      <div className={styles.searchWrapper}>
        <CategorySearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar categoría por nombre o slug..."
        />
        {/* 📊 Cantidad */}
        <span className={styles.count}>{total} categorías</span>
      </div>


      <div className={styles.filtersRow}>
        {/* 🔢 Mín productos */}
        <input
          type="number"
          min={0}
          value={minProducts}
          onChange={(e) =>
            setMinProducts(
              e.target.value === '' ? '' : Math.max(0, Number(e.target.value))
            )
          }
          placeholder="Mín. productos"
          className={styles.filtersRowItem}
        />

        {/* 🔢 Máx productos */}
        <input
          type="number"
          min={0}
          value={maxProducts}
          onChange={(e) =>
            setMaxProducts(
              e.target.value === '' ? '' : Math.max(0, Number(e.target.value))
            )
          }
          placeholder="Máx. productos"
          className={styles.filtersRowItem}
        />

        {/* 👁️ Estado */}
        <select
          value={isVisible}
          onChange={(e) =>
            setIsVisible(e.target.value as 'all' | 'visible' | 'hidden')
          }
          className={styles.filtersRowItem}
        >
          <option value="all">Todas</option>
          <option value="visible">Visibles</option>
          <option value="hidden">Ocultas</option>
        </select>
      </div>
    </div>
  );
};
