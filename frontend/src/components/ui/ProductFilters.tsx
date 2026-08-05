import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from '../../features/admin/products/AdminProducts.module.css';
import { Search, SlidersHorizontal, X, RotateCcw } from 'lucide-react';
import type { StatusFilter, StockLevelFilter } from '../../features/admin/products/productsService';
import { Dropdown } from './Dropdown/Dropdown';

interface ProductFiltersProps {
  search: string;
  setSearch: (v: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  categories: Array<{ id: string; name: string }>;
  statusFilter: StatusFilter;
  setStatusFilter: (v: StatusFilter) => void;
  stockLevelFilter: StockLevelFilter;
  setStockLevelFilter: (v: StockLevelFilter) => void;
  total: number;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  search,
  setSearch,
  inputRef,
  categoryFilter,
  setCategoryFilter,
  categories,
  statusFilter,
  setStatusFilter,
  stockLevelFilter,
  setStockLevelFilter,
  total,
}) => {
  const [mobileModalOpen, setMobileModalOpen] = useState(false);

  // Mapeo de opciones para el Dropdown de Categorías
  const categoryOptions = useMemo(() => [
    { value: '', label: 'Todas las categorías' },
    ...categories.map(c => ({ value: c.id, label: c.name }))
  ], [categories]);

  // Mapeo de opciones para el Dropdown de Estados
  const statusOptions = useMemo(() => [
    { value: 'all', label: 'Todos los estados' },
    { value: 'active', label: 'Activos' },
    { value: 'inactive', label: 'Inactivos' }
  ], []);

  // Mapeo de opciones para el Dropdown de Stocks
  const stockOptions = useMemo(() => [
    { value: 'all', label: 'Todos los stocks' },
    { value: 'no_stock', label: 'Sin stock' },
    { value: 'low_stock', label: 'Stock bajo' },
    { value: 'in_stock', label: 'Con stock' }
  ], []);

  // Contador de filtros activos (excluyendo la búsqueda por texto)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (categoryFilter) count++;
    if (statusFilter !== 'all') count++;
    if (stockLevelFilter !== 'all') count++;
    return count;
  }, [categoryFilter, statusFilter, stockLevelFilter]);

  const handleResetFilters = () => {
    setCategoryFilter('');
    setStatusFilter('all');
    setStockLevelFilter('all');
  };

  // Bloquear scroll de la página de fondo cuando el modal esté abierto
  useEffect(() => {
    if (mobileModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileModalOpen]);

  // Modal portaleado directamente a document.body para evitar distorsión por scroll/transforms
  const renderMobileModal = () => {
    if (!mobileModalOpen) return null;

    const modalContent = (
      <div className={styles.mobileFilterModalOverlay}>
        <button
          type="button"
          className={styles.mobileFilterModalBackdrop}
          onClick={() => setMobileModalOpen(false)}
          aria-label="Cerrar ventana de filtros"
          tabIndex={-1}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            margin: 0,
            zIndex: 1,
          }}
        />
        <div
          className={styles.mobileFilterModalContent}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-filter-title"
          style={{ position: 'relative', zIndex: 2 }}
        >
          <div className={styles.mobileFilterModalHeader}>
            <h3 id="mobile-filter-title" className={styles.mobileFilterModalTitle}>
              Filtrar productos
            </h3>
            <button
              type="button"
              className={styles.mobileFilterModalClose}
              onClick={() => setMobileModalOpen(false)}
              aria-label="Cerrar filtros"
            >
              <X size={20} />
            </button>
          </div>

          <div className={styles.mobileFilterModalBody}>
            <div className={styles.modalFilterField}>
              <label htmlFor="category-filter-mobile" className={styles.modalFilterLabel}>Categoría</label>
              <Dropdown
                id="category-filter-mobile"
                options={categoryOptions}
                value={categoryFilter}
                onChange={setCategoryFilter}
                placeholder="Todas las categorías"
              />
            </div>

            <div className={styles.modalFilterField}>
              <label htmlFor="status-filter-mobile" className={styles.modalFilterLabel}>Estado</label>
              <Dropdown
                id="status-filter-mobile"
                options={statusOptions}
                value={statusFilter}
                onChange={val => setStatusFilter(val as StatusFilter)}
                placeholder="Todos los estados"
              />
            </div>

            <div className={styles.modalFilterField}>
              <label htmlFor="stock-filter-mobile" className={styles.modalFilterLabel}>Disponibilidad de stock</label>
              <Dropdown
                id="stock-filter-mobile"
                options={stockOptions}
                value={stockLevelFilter}
                onChange={val => setStockLevelFilter(val as StockLevelFilter)}
                placeholder="Todos los stocks"
              />
            </div>
          </div>

          <div className={styles.mobileFilterModalFooter}>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                className={styles.modalResetBtn}
                onClick={handleResetFilters}
              >
                Limpiar todo
              </button>
            )}
            <button
              type="button"
              className={styles.mobileFilterApplyBtn}
              onClick={() => setMobileModalOpen(false)}
            >
              Ver resultados ({total})
            </button>
          </div>
        </div>
      </div>
    );

    if (typeof document === 'undefined') return modalContent;
    return createPortal(modalContent, document.body);
  };

  return (
    <nav className={styles.filters} aria-label="Filtros de productos">
      {/* Buscador Full-Width */}
      <div className={styles.searchRow}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <label htmlFor="search-products" className="sr-only">Buscar productos</label>
          <input
            ref={inputRef}
            id="search-products"
            className={styles.searchInput}
            type="search"
            placeholder="Buscar por nombre, SKU..."
            value={search}
            autoComplete="off"
            spellCheck="false"
            autoCorrect="off"
            autoCapitalize="off"
            onChange={e => setSearch(e.target.value)}
            aria-label="Buscar productos por nombre o SKU"
          />
          <span className={styles.count} aria-live="polite">{total} productos</span>
        </div>
      </div>

      {/* Botón trigger para abrir el Bottom Sheet en Mobile (Oculto en Desktop) */}
      <div className={styles.mobileFilterBar}>
        <button
          type="button"
          className={styles.mobileFilterTriggerBtn}
          onClick={() => setMobileModalOpen(true)}
        >
          <SlidersHorizontal size={16} />
          <span>Filtros</span>
          {activeFiltersCount > 0 && (
            <span className={styles.activeFilterBadge}>{activeFiltersCount}</span>
          )}
        </button>

        {activeFiltersCount > 0 && (
          <button
            type="button"
            className={styles.resetFiltersBtnMobile}
            onClick={handleResetFilters}
            title="Limpiar filtros"
          >
            <RotateCcw size={14} />
            <span>Limpiar</span>
          </button>
        )}
      </div>

      {/* Filtros para Desktop (Siempre visibles horizontalmente) */}
      <div className={styles.filtersRowDesktop}>
        <div className={styles.filterDropdownField}>
          <span className="sr-only">Filtrar por categoría</span>
          <Dropdown
            id="category-filter-desktop"
            options={categoryOptions}
            value={categoryFilter}
            onChange={setCategoryFilter}
            placeholder="Todas las categorías"
          />
        </div>

        <div className={styles.filterDropdownField}>
          <span className="sr-only">Filtrar por estado</span>
          <Dropdown
            id="status-filter-desktop"
            options={statusOptions}
            value={statusFilter}
            onChange={val => setStatusFilter(val as StatusFilter)}
            placeholder="Todos los estados"
          />
        </div>

        <div className={styles.filterDropdownField}>
          <span className="sr-only">Filtrar por stock</span>
          <Dropdown
            id="stock-filter-desktop"
            options={stockOptions}
            value={stockLevelFilter}
            onChange={val => setStockLevelFilter(val as StockLevelFilter)}
            placeholder="Todos los stocks"
          />
        </div>

        {activeFiltersCount > 0 && (
          <button
            type="button"
            className={styles.resetFiltersBtn}
            onClick={handleResetFilters}
            title="Limpiar filtros"
          >
            <RotateCcw size={14} />
            <span>Limpiar</span>
          </button>
        )}
      </div>

      {/* Portal del Modal Bottom Sheet en Móvil */}
      {renderMobileModal()}
    </nav>
  );
};