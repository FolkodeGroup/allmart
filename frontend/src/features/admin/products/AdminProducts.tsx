import { useState, useRef, useEffect } from 'react';
import { useAdminProducts } from '../../../context/AdminProductsContext';
import { useAdminCategories } from '../../../context/AdminCategoriesContext';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { AdminProductForm } from './AdminProductForm';
import { AdminProductCard } from './AdminProductCard';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { PackageSearch, AlertCircle } from 'lucide-react';
import sectionStyles from '../shared/AdminSection.module.css';
import styles from './AdminProducts.module.css';

export function AdminProducts() {
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

      {/* Tabla */}
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
              deleteConfirm={deleteConfirm === p.id}
              onCancelDelete={() => setDeleteConfirm(null)}
              onConfirmDelete={() => handleDelete(p.id)}
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
    </div>
  );
}
