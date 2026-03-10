import { useState, useRef } from 'react';
import { useAdminProducts } from '../../../context/AdminProductsContext';
import { useAdminCategories } from '../../../context/AdminCategoriesContext';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { AdminProductForm } from './AdminProductForm';
import sectionStyles from './AdminSection.module.css';
import styles from './AdminProducts.module.css';

export function AdminProducts() {
  const { products, deleteProduct } = useAdminProducts();
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

  const handleNew = () => { setEditId(null); setShowForm(true); };
  const handleEdit = (id: string) => { setEditId(id); setShowForm(true); };
  const handleDelete = (id: string) => {
    deleteProduct(id);
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
                // Opcional: enfocar input
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
            onChange={e => setCategoryFilter(e.target.value)}
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
      {filtered.length === 0 ? (
        <div className={sectionStyles.emptyState}>
          <span className={sectionStyles.emptyIcon}>📦</span>
          <p className={sectionStyles.emptyText}>No se encontraron productos.</p>
        </div>
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
              {filtered.map(p => (
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
