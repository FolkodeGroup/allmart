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
  minProducts: number | '';
  setMinProducts: (v: number | '') => void;
  maxProducts: number | '';
  setMaxProducts: (v: number | '') => void;
  isVisible: 'all' | 'visible' | 'hidden';
  setIsVisible: (v: 'all' | 'visible' | 'hidden') => void;
}

export const CategoriesFilters: React.FC<CategoriesFiltersProps> = ({
  categories,
  search,
  setSearch,
  setSelectedSuggestion,
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
        justifyContent: 'flex-start',
        gap: 16,
        padding: '12px 18px',
        background: '#fcfbf8',
        borderRadius: 10,
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
      }}
    >
      {/* 🔍 Buscador */}
      <CategorySearchInput
        categories={categories}
        value={search}
        onChange={setSearch}
        onSelectSuggestion={(cat) => {
          setSearch(cat.name);
          setSelectedSuggestion(cat.name);
        }}
        placeholder="Buscar por nombre o slug..."
      />

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
        style={{
          width: 120,
          border: '1px solid #e5e2dd',
          borderRadius: 8,
          padding: '7px 10px',
          fontSize: 14,
          background: '#fff',
        }}
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
        style={{
          width: 120,
          border: '1px solid #e5e2dd',
          borderRadius: 8,
          padding: '7px 10px',
          fontSize: 14,
          background: '#fff',
        }}
      />

      {/* 👁️ Estado */}
      <select
        value={isVisible}
        onChange={(e) =>
          setIsVisible(e.target.value as 'all' | 'visible' | 'hidden')
        }
        style={{
          border: '1px solid #e5e2dd',
          borderRadius: 8,
          padding: '7px 10px',
          fontSize: 14,
          background: '#fff',
          minWidth: 120,
        }}
      >
        <option value="all">Todas</option>
        <option value="visible">Visibles</option>
        <option value="hidden">Ocultas</option>
      </select>

      {/* 📊 Cantidad */}
      <span className={styles.count}>{total} categorías</span>
    </div>
  );
};
