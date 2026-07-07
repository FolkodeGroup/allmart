import React, { useMemo } from 'react';
import styles from '../AdminCategories.module.css';
import { CategorySearchInput } from '../../../../components/ui/CategorySearchInput';
import { Dropdown } from '../../../../components/ui/Dropdown/Dropdown';

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
  // ── Mapeo de opciones para el Dropdown de Visibilidad ──
  const visibilityOptions = useMemo(() => [
    { value: 'all', label: 'Todas' },
    { value: 'visible', label: 'Visibles' },
    { value: 'hidden', label: 'Ocultas' },
  ], []);

  return (
    <div className={styles.filters}>
      {/* Buscador */}
      <div className={styles.searchWrapper}>
        <CategorySearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar categoría por nombre o slug..."
        />
        {/* Cantidad */}
        <span className={styles.count}>{total} categorías</span>
      </div>

      <div className={styles.filtersRow} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Mín productos */}
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

        {/* Máx productos */}
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

        {/* Filtro de Visibilidad Unificado con Custom Dropdown */}
        <div style={{ flex: '1 1 140px', minWidth: '140px', maxWidth: '200px' }}>
          <Dropdown
            id="visibility-filter"
            options={visibilityOptions}
            value={isVisible}
            onChange={(val) => setIsVisible(val as 'all' | 'visible' | 'hidden')}
            placeholder="Todas"
          />
        </div>
      </div>
    </div>
  );
};