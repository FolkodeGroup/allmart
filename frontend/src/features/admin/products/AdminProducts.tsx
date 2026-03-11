import { useState, useRef } from 'react';
import { useAdminProducts } from '../../../context/AdminProductsContext';
import { useAdminCategories } from '../../../context/AdminCategoriesContext';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { AdminProductForm } from './AdminProductForm';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { PackageSearch, AlertCircle } from 'lucide-react';
import sectionStyles from '../shared/AdminSection.module.css';
import styles from './AdminProducts.module.css';

export function AdminProducts() {
  const { products, deleteProduct, loading, error } = useAdminProducts();
  const { can } = useAdminAuth();
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { categories } = useAdminCategories();

  // Sugerencias para autocompletado (máx 8)
  const suggestions = search.length > 0
    ? products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 8)
    : [];

  // Filtrado principal
  const filtered = products.filter(p => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = !categoryFilter || p.category.id === categoryFilter;
    return matchSearch && matchCat;
  });

  // Paginación
  const PRODUCTS_PER_PAGE = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PRODUCTS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * PRODUCTS_PER_PAGE, page * PRODUCTS_PER_PAGE);

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

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);

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
              setPage(1); // Reiniciar página al buscar
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
                setPage(1); // Reiniciar página al seleccionar sugerencia
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
                    setPage(1); // Reiniciar página al seleccionar sugerencia
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
              setPage(1); // Reiniciar página al cambiar categoría
            }}
          >
            <option value="">Todas las categorías</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <span className={styles.count}>{filtered.length} productos</span>
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

      {!loading && !error && (filtered.length === 0 ? (
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
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Producto</th>
                <th className={styles.th}>Categoría</th>
                <th className={styles.th}>Precio</th>
                <th className={styles.th}>Stock</th>
                <th className={styles.th}>Estado</th>
                <th className={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(p => (
                <tr key={p.id} className={styles.row}>
                  <td className={styles.td}>
                    <div className={styles.productCell}>
                      {p.images[0] && (
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          className={styles.thumb}
                          onError={e => (e.currentTarget.style.display = 'none')}
                        />
                      )}
                      <div>
                        <div className={styles.productName}>{p.name}</div>
                        {p.sku && <div className={styles.productSku}>SKU: {p.sku}</div>}
                      </div>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.badge}>{p.category.name}</span>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.priceCell}>
                      <span className={styles.price}>{formatPrice(p.price)}</span>
                      {p.discount && p.discount > 0 && (
                        <span className={styles.discount}>-{p.discount}%</span>
                      )}
                    </div>
                  </td>
                  <td className={styles.td}>
                    <span className={p.stock > 0 ? styles.stockOk : styles.stockOut}>
                      {p.stock}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <span className={p.inStock ? styles.statusActive : styles.statusInactive}>
                      {p.inStock ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.actions}>
                      {can('products.edit') && (
                        <button
                          className={styles.editBtn}
                          onClick={() => handleEdit(p.id)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                      )}
                      {can('products.delete') && (
                        deleteConfirm === p.id ? (
                          <>
                            <button className={styles.confirmDeleteBtn} onClick={() => handleDelete(p.id)}>
                              Confirmar
                            </button>
                            <button className={styles.cancelDeleteBtn} onClick={() => setDeleteConfirm(null)}>
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <button
                            className={styles.deleteBtn}
                            onClick={() => setDeleteConfirm(p.id)}
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        )
                      )}
                      {!can('products.edit') && !can('products.delete') && (
                        <span style={{ color: 'var(--color-text-muted, #aaa)', fontSize: '12px' }}>Solo lectura</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* Controles de paginación */}
      {filtered.length > PRODUCTS_PER_PAGE && (
        <div className={styles.pagination} style={{ marginTop: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          <button
            className={styles.pageBtn}
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >Anterior</button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              className={styles.pageBtn + (page === i + 1 ? ' ' + styles.pageActive : '')}
              onClick={() => setPage(i + 1)}
            >{i + 1}</button>
          ))}
          <button
            className={styles.pageBtn}
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
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
