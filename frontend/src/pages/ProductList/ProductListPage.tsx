import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../../data/productsLocal';
import { categories, sortOptions } from '../../data/mock';
import { ProductCard } from '../../features/products/ProductCard/ProductCard';
import styles from './ProductListPage.module.css';

export function ProductListPage() {
  const [sortBy, setSortBy] = useState('relevance');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const toggleCategory = (slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]
    );
  };

  const sortedProducts = useMemo(() => {
    let result = [...getProducts()];

    // Filter
    if (selectedCategories.length > 0) {
      result = result.filter((p) =>
        selectedCategories.includes(p.category.slug)
      );
    }

    // Sort
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        result.reverse();
        break;
      default:
        break;
    }

    return result;
  }, [sortBy, selectedCategories]);

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
                  checked={selectedCategories.includes(cat.slug)}
                  onChange={() => toggleCategory(cat.slug)}
                />
                <span className={styles.filterLabel}>{cat.name}</span>
                <span className={styles.filterCount}>{cat.itemCount}</span>
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
                  {sortedProducts.length}
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
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {sortedProducts.length > 0 ? (
            <div className={styles.productsGrid}>
              {sortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
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
