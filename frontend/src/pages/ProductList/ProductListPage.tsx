import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Product, Category } from '../../types';
import {
  fetchPublicProducts,
  mapApiProductToProduct,
  type PublicProductsParams,
} from '../../services/productsService';
import { fetchPublicCategories } from '../../services/categoriesService';
import { ProductCard } from '../../features/products/ProductCard/ProductCard';
import styles from './ProductListPage.module.css';

type SortOption = { label: string; value: string };

const SORT_OPTIONS: SortOption[] = [
  { label: 'Relevancia', value: 'relevance' },
  { label: 'Menor precio', value: 'price_asc' },
  { label: 'Mayor precio', value: 'price_desc' },
  { label: 'Mejor puntuación', value: 'rating' },
  { label: 'Más nuevos', value: 'newest' },
];

export function ProductListPage() {
  const [sortBy, setSortBy] = useState('relevance');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* Cargar categorías una sola vez */
  useEffect(() => {
    fetchPublicCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  /* Cargar productos cuando cambian los filtros */
  useEffect(() => {
    const params: PublicProductsParams = { limit: 48 };
    if (selectedCategory) params.category = selectedCategory;
    if (sortBy !== 'relevance') params.sort = sortBy as PublicProductsParams['sort'];

    setLoading(true);
    setError(null);
    fetchPublicProducts(params)
      .then(({ data }) => {
        setProducts(data.map((p) => mapApiProductToProduct(p, categories)));
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sortBy, selectedCategory, categories]);

  const toggleCategory = (slug: string) => {
    setSelectedCategory((prev) => (prev === slug ? '' : slug));
  };

  return (
    <main className={styles.page}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link to="/">Inicio</Link>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>Productos</span>
      </nav>

      <div className={styles.layout}>
        {/* Sidebar Filters */}
        <aside
          className={`${styles.sidebar} ${filtersOpen ? styles.open : ''}`}
          aria-label="Filtros de productos"
        >
          <div className={styles.filterGroup}>
            <h3 className={styles.filterTitle}>Categorías</h3>
            {categories.map((cat) => (
              <label className={styles.filterOption} key={cat.id}>
                <input
                  type="checkbox"
                  className={styles.filterCheckbox}
                  checked={selectedCategory === cat.slug}
                  onChange={() => toggleCategory(cat.slug)}
                />
                <span className={styles.filterLabel}>{cat.name}</span>
                {cat.itemCount !== undefined && (
                  <span className={styles.filterCount}>{cat.itemCount}</span>
                )}
              </label>
            ))}
          </div>

          <div className={styles.filterGroup}>
            <h3 className={styles.filterTitle}>Precio</h3>
            <label className={styles.filterOption}>
              <input type="checkbox" className={styles.filterCheckbox} />
              <span className={styles.filterLabel}>Hasta $10.000</span>
            </label>
            <label className={styles.filterOption}>
              <input type="checkbox" className={styles.filterCheckbox} />
              <span className={styles.filterLabel}>$10.000 - $25.000</span>
            </label>
            <label className={styles.filterOption}>
              <input type="checkbox" className={styles.filterCheckbox} />
              <span className={styles.filterLabel}>$25.000 - $50.000</span>
            </label>
            <label className={styles.filterOption}>
              <input type="checkbox" className={styles.filterCheckbox} />
              <span className={styles.filterLabel}>Más de $50.000</span>
            </label>
          </div>

          <div className={styles.filterGroup}>
            <h3 className={styles.filterTitle}>Etiquetas</h3>
            <label className={styles.filterOption}>
              <input type="checkbox" className={styles.filterCheckbox} />
              <span className={styles.filterLabel}>En oferta</span>
            </label>
            <label className={styles.filterOption}>
              <input type="checkbox" className={styles.filterCheckbox} />
              <span className={styles.filterLabel}>Novedades</span>
            </label>
            <label className={styles.filterOption}>
              <input type="checkbox" className={styles.filterCheckbox} />
              <span className={styles.filterLabel}>Destacados</span>
            </label>
          </div>
        </aside>

        {/* Main Content */}
        <div className={styles.main}>
          <div className={styles.toolbar}>
            <div>
              <button
                className={styles.mobileFilterBtn}
                onClick={() => setFiltersOpen(!filtersOpen)}
                type="button"
              >
                ☰ Filtros
              </button>
              <span className={styles.resultCount}>
                Mostrando{' '}
                <span className={styles.resultCountBold}>
                  {products.length}
                </span>{' '}
                productos
              </span>
            </div>

            <div className={styles.sortWrapper}>
              <label htmlFor="sort" className={styles.sortLabel}>
                Ordenar por:
              </label>
              <select
                id="sort"
                className={styles.sortSelect}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading && (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>Cargando productos...</p>
            </div>
          )}

          {!loading && error && (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>⚠️</span>
              <h3 className={styles.emptyTitle}>Error al cargar productos</h3>
              <p className={styles.emptyText}>{error}</p>
            </div>
          )}

          {!loading && !error && products.length > 0 && (
            <div className={styles.productsGrid}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {!loading && !error && products.length === 0 && (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🔍</span>
              <h3 className={styles.emptyTitle}>
                No encontramos productos
              </h3>
              <p className={styles.emptyText}>
                Intentá ajustar los filtros o explorá todas nuestras categorías.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
