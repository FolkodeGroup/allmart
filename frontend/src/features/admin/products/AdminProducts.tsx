import React, { useState, useRef, useEffect } from 'react';

// CheckboxGeneral: componente auxiliar para manejar indeterminate correctamente
const CheckboxGeneral = ({ checked, indeterminate, onChange }: { checked: boolean; indeterminate: boolean; onChange: (checked: boolean) => void }) => {
  const ref = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
        width: '100%',
        maxWidth: '100vw',
      }}
    >
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        aria-label="Seleccionar todos los productos visibles"
        style={{
          marginRight: 8,
          width: 24,
          height: 24,
          accentColor: 'var(--color-primary, #2563eb)',
        }}
      />
      <span
        style={{
          fontSize: 16,
          color: '#555',
          fontWeight: 500,
          userSelect: 'none',
          lineHeight: 1.2,
        }}
      >
        Seleccionar todos los productos visibles
      </span>
    </div>
  );
};
// Utilidad para mantener selección entre páginas
function usePersistentSelection() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const add = (ids: string[]) => setSelectedIds(prev => Array.from(new Set([...prev, ...ids])));
  const remove = (ids: string[]) => setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
  const toggle = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const clear = () => setSelectedIds([]);
  return { selectedIds, add, remove, toggle, clear, setSelectedIds };
}
import { useAdminProducts } from '../../../context/AdminProductsContext';
import { useAdminCategories } from '../../../context/AdminCategoriesContext';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { AdminProductForm } from './AdminProductForm';
import { AdminProductCard } from './AdminProductCard';
import { BulkEditBar } from './BulkEditBar';
import * as productsService from './productsService';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { PackageSearch, AlertCircle } from 'lucide-react';
import { ModalConfirm } from '../../../components/ui/ModalConfirm/ModalConfirm';
import sectionStyles from '../shared/AdminSection.module.css';
import styles from './AdminProducts.module.css';

export function AdminProducts() {
    // Edición masiva
    const [bulkEditLoading, setBulkEditLoading] = useState(false);
    const [bulkEditSuccess, setBulkEditSuccess] = useState<string | null>(null);
    const [bulkEditError, setBulkEditError] = useState<string | null>(null);
    const [showBulkConfirm, setShowBulkConfirm] = useState(false);
    const [bulkEditData, setBulkEditData] = useState<{ price?: number; stock?: number; inStock?: boolean } | null>(null);

    // Simular obtención de token (ajustar según contexto real)
    const token = localStorage.getItem('token') || '';

    // Handler para aplicar edición masiva
    const handleBulkEdit = (data: { price?: number; stock?: number; inStock?: boolean }) => {
      setBulkEditData(data);
      setShowBulkConfirm(true);
    };

    // Confirmar y ejecutar edición masiva
    const confirmBulkEdit = async () => {
      if (!bulkEditData) return;
      setBulkEditLoading(true);
      setBulkEditSuccess(null);
      setBulkEditError(null);
      try {
        await Promise.all(selectedIds.map(id =>
          productsService.updateAdminProduct(id, bulkEditData, token)
        ));
        setBulkEditSuccess('¡Productos actualizados correctamente!');
        clear();
        refreshProducts({ q: search, categoryId: categoryFilter, page: apiPage, limit: 10 });
      } catch (err: any) {
        setBulkEditError('Error al actualizar productos. Intenta nuevamente.');
      } finally {
        setBulkEditLoading(false);
        setShowBulkConfirm(false);
        setBulkEditData(null);
      }
    };

    // Cancelar edición masiva
    const cancelBulkEdit = () => {
      setBulkEditData(null);
      setShowBulkConfirm(false);
    };
  const { products, deleteProduct, loading, error, refreshProducts, page: apiPage, totalPages: apiTotalPages, total } = useAdminProducts();
  const { can } = useAdminAuth();
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { categories } = useAdminCategories();

  // Selección múltiple
  const {
    selectedIds,
    add,
    remove,
    clear
  } = usePersistentSelection();

  // Determinar si todos los productos visibles están seleccionados
  const allVisibleSelected = products.length > 0 && products.every(p => selectedIds.includes(p.id));
  const someVisibleSelected = products.some(p => selectedIds.includes(p.id));

  // Handler para checkbox general
  const handleSelectAllVisible = (checked: boolean) => {
    const visibleIds = products.map(p => p.id);
    if (checked) {
      add(visibleIds);
    } else {
      remove(visibleIds);
    }
  };

  // Handler para checkbox individual
  const handleSelectProduct = (id: string, checked: boolean) => {
    if (checked) {
      add([id]);
    } else {
      remove([id]);
    }
  };

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      refreshProducts({ q: search, categoryId: categoryFilter, page: 1, limit: 10 });
    }, 400);
    return () => clearTimeout(timer);
  }, [search, categoryFilter, refreshProducts]);

  const handlePageChange = (newPage: number) => {
    refreshProducts({ q: search, categoryId: categoryFilter, page: newPage, limit: 10 });
  };

  // Sugerencias para autocompletado (usamos los productos ya cargados como base)
  const suggestions = search.length > 0
    ? products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 8)
    : [];

  const handleNew = () => { setEditId(null); setShowForm(true); };
  const handleEdit = (id: string) => { setEditId(id); setShowForm(true); };
  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
    } catch (err) {
      console.error('Error al eliminar producto:', err);
    }
    setDeleteConfirm(null);
  };

  return (
    <div className={sectionStyles.page}>
      {/* Header */}
      <div className={sectionStyles.header}>
        <div className={styles.headerTop}>
          <div>
            <span className={sectionStyles.label}>Administración</span>
            <h1 className={sectionStyles.title}>
              <span className={sectionStyles.icon}>📦</span> Productos
            </h1>
            <p className={sectionStyles.subtitle}>
              Gestioná el catálogo de productos, precios y disponibilidad.
            </p>
          </div>
          {can('products.create') && (
            <button className={styles.newBtn} onClick={handleNew}>
              + Nuevo producto
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className={styles.filters} style={{ position: 'relative' }}>
          <input
            ref={inputRef}
            className={styles.searchInput}
            type="search"
            placeholder="Buscar por nombre o SKU..."
            value={search}
            autoComplete="off"
            onChange={e => {
              setSearch(e.target.value);
              setShowSuggestions(true);
              setHighlightedIndex(-1);
            }}
            onFocus={() => search && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
            onKeyDown={e => {
              if (!showSuggestions || suggestions.length === 0) return;
              if (e.key === 'ArrowDown') {
                setHighlightedIndex(i => (i < suggestions.length - 1 ? i + 1 : 0));
                e.preventDefault();
              } else if (e.key === 'ArrowUp') {
                setHighlightedIndex(i => (i > 0 ? i - 1 : suggestions.length - 1));
                e.preventDefault();
              } else if (e.key === 'Enter' && highlightedIndex >= 0) {
                setSearch(suggestions[highlightedIndex].name);
                setShowSuggestions(false);
                setHighlightedIndex(-1);
                inputRef.current?.blur();
                setTimeout(() => inputRef.current?.focus(), 0);
                e.preventDefault();
              }
            }}
          />
          {/* Sugerencias de autocompletado */}
          {showSuggestions && suggestions.length > 0 && (
            <ul className={styles.suggestionsList} style={{ position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 10 }}>
              {suggestions.map((s, idx) => (
                <li
                  key={s.id}
                  className={styles.suggestionItem + (idx === highlightedIndex ? ' ' + styles.suggestionActive : '')}
                  style={{ cursor: 'pointer', background: idx === highlightedIndex ? 'var(--color-bg-secondary)' : undefined }}
                  onMouseDown={() => {
                    setSearch(s.name);
                    setShowSuggestions(false);
                    setHighlightedIndex(-1);
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{s.name}</span>
                  {s.sku && <span style={{ color: '#888', fontSize: 12, marginLeft: 8 }}>SKU: {s.sku}</span>}
                </li>
              ))}
            </ul>
          )}

          <select
            className={styles.select}
            value={categoryFilter}
            onChange={e => {
              setCategoryFilter(e.target.value);
            }}
          >
            <option value="">Todas las categorías</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <span className={styles.count}>{total} productos</span>
        </div>
      </div>

      {/* Panel de edición masiva */}
      {selectedIds.length > 0 && can('products.edit') && (
        <BulkEditBar
          selectedCount={selectedIds.length}
          onBulkEdit={handleBulkEdit}
          onCancel={clear}
          loading={bulkEditLoading}
        />
      )}

      {/* Mensajes de feedback */}
      {bulkEditSuccess && <div style={{ color: '#22c55e', marginBottom: 8 }}>{bulkEditSuccess}</div>}
      {bulkEditError && <div style={{ color: '#ef4444', marginBottom: 8 }}>{bulkEditError}</div>}

      {/* Modal de confirmación de edición masiva */}
      {showBulkConfirm && (
        <ModalConfirm
          open={showBulkConfirm}
          title="Confirmar edición masiva"
          message={`¿Aplicar los cambios a ${selectedIds.length} productos seleccionados? Esta acción no se puede deshacer.`}
          confirmText="Aplicar cambios"
          cancelText="Cancelar"
          onConfirm={confirmBulkEdit}
          onCancel={cancelBulkEdit}
        />
      )}
      {products.length > 0 && (can('products.edit') || can('products.delete')) && (
        <CheckboxGeneral
          checked={allVisibleSelected}
          indeterminate={someVisibleSelected && !allVisibleSelected}
          onChange={handleSelectAllVisible}
        />
      )}
      {loading && <LoadingSpinner message="Cargando catálogo de productos..." size="lg" />}

      {!loading && error && (
        <EmptyState
          icon={<AlertCircle size={48} color="#ef4444" />}
          title="Error al cargar productos"
          description={error}
          action={{ label: 'Reintentar', onClick: () => window.location.reload() }}
        />
      )}

      {!loading && !error && (products.length === 0 ? (
        <EmptyState
          icon={<PackageSearch size={48} color="#94a3b8" />}
          title="No se encontraron productos"
          description={search || categoryFilter
            ? "Probá ajustando los filtros o la búsqueda para encontrar lo que necesitás."
            : "Todavía no cargaste ningún producto al catálogo. ¡Empezá ahora!"
          }
          action={can('products.create') ? { label: 'Nuevo Producto', onClick: handleNew } : undefined}
        />
      ) : (
        <div className={styles.cardsGrid}>
          {products.map(p => (
            <AdminProductCard
              key={p.id}
              id={p.id}
              name={p.name}
              sku={p.sku}
              price={p.price}
              discount={p.discount}
              stock={p.stock}
              inStock={p.inStock}
              image={p.images && p.images[0]}
              category={p.category?.name || ''}
              canEdit={can('products.edit')}
              canDelete={can('products.delete')}
              onEdit={handleEdit}
              onDelete={() => setDeleteConfirm(p.id)}
              selected={selectedIds.includes(p.id)}
              onSelectChange={handleSelectProduct}
              showCheckbox={can('products.edit') || can('products.delete')}
            />
          ))}
        </div>
      ))}

      {/* Controles de paginación */}
      {total > 10 && (
        <div className={styles.pagination} style={{ marginTop: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          <button
            className={styles.pageBtn}
            disabled={apiPage === 1}
            onClick={() => handlePageChange(apiPage - 1)}
          >Anterior</button>
          {Array.from({ length: apiTotalPages }, (_, i) => (
            <button
              key={i + 1}
              className={styles.pageBtn + (apiPage === i + 1 ? ' ' + styles.pageActive : '')}
              onClick={() => handlePageChange(i + 1)}
            >{i + 1}</button>
          ))}
          <button
            className={styles.pageBtn}
            disabled={apiPage === apiTotalPages}
            onClick={() => handlePageChange(apiPage + 1)}
          >Siguiente</button>
        </div>
      )}

      {/* Modal de formulario */}
      {showForm && (
        <AdminProductForm
          productId={editId}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Modal de confirmación de eliminación */}
      <ModalConfirm
        open={!!deleteConfirm}
        title="Eliminar producto"
        message="¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
