import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { Product, Category } from '../../types';
import {
  fetchPublicProducts,
  mapApiProductToProduct,
  type PublicProductsParams,
} from '../../services/productsService';
import { fetchPublicCategories } from '../../services/categoriesService';
import { publicCollectionsService } from '../../services/publicCollectionsService';
import { configService, type SortOption } from '../../services/configService';
import { ProductCard } from '../../features/products/ProductCard/ProductCard';
import styles from './ProductListPage.module.css';

const FALLBACK_SORT_OPTIONS: SortOption[] = [
  { label: 'Relevancia', value: 'relevance' },
  { label: 'Menor precio', value: 'price_asc' },
  { label: 'Mayor precio', value: 'price_desc' },
  { label: 'Mejor puntuación', value: 'rating' },
  { label: 'Más nuevos', value: 'newest' },
];

function getProductCategoryIds(product: Product): string[] {
  const ids = new Set<string>();
  if (Array.isArray(product.categoryIds)) {
    product.categoryIds.filter(Boolean).forEach((id) => ids.add(id));
  }
  if (product.categoryId) ids.add(product.categoryId);
  if (product.category?.id) ids.add(product.category.id);
  return Array.from(ids);
}

export function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCategory = searchParams.get('category') ?? '';
  const urlSubCategory = searchParams.get('sub') ?? '';
  const [sortBy, setSortBy] = useState('relevance');
  const [selectedCategory, setSelectedCategory] = useState<string>(urlSubCategory || urlCategory);
  const [showOnlyOnSale, setShowOnlyOnSale] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sortOptions, setSortOptions] = useState<SortOption[]>(FALLBACK_SORT_OPTIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDiscounts, setActiveDiscounts] = useState<Set<string>>(new Set());
  const rootCategories = categories.filter((cat) => !cat.parentId);

  useEffect(() => {
    const next = urlSubCategory || urlCategory;
    setSelectedCategory((prev) => (prev === next ? prev : next));
  }, [urlCategory, urlSubCategory]);

  /* Cargar sort options dinámicas */
  useEffect(() => {
    configService.getSortOptions()
      .then(setSortOptions)
      .catch(() => setSortOptions(FALLBACK_SORT_OPTIONS));
  }, []);

  /* Cargar categorías una sola vez */
  useEffect(() => {
    fetchPublicCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  /* Cargar descuentos activos para filtro "En Oferta" */
  useEffect(() => {
    const loadActiveDiscounts = async () => {
      try {
        const discounts = await publicCollectionsService.getActiveDiscounts();
        const productIds = new Set(
          discounts.map((item: { productId: string }) => item.productId)
        );
        setActiveDiscounts(productIds);
      } catch (error) {
        console.error('Error loading active discounts:', error);
        setActiveDiscounts(new Set());
      }
    };

    loadActiveDiscounts();
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
        let mappedProducts = data.map((p) => mapApiProductToProduct(p, categories));
        
        // Filtrar por "En Oferta" si está habilitado
        if (showOnlyOnSale) {
          mappedProducts = mappedProducts.filter((p) => activeDiscounts.has(p.id));
        }
        
        setProducts(mappedProducts);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sortBy, selectedCategory, showOnlyOnSale, activeDiscounts, categories]);

  const toggleCategory = (slug: string) => {
    const next = selectedCategory === slug ? '' : slug;
    setSelectedCategory(next);
    const updated = new URLSearchParams(searchParams);
    if (next) {
      updated.set('category', next);
    } else {
      updated.delete('category');
    }
    updated.delete('sub');
    setSearchParams(updated, { replace: true });
  };

  const selectedCategoryInfo = useMemo(
    () => categories.find((cat) => cat.slug === selectedCategory),
    [categories, selectedCategory]
  );

  const selectedParentCategory = useMemo(() => {
    if (!selectedCategoryInfo) return undefined;
    if (!selectedCategoryInfo.parentId) return selectedCategoryInfo;
    return categories.find((cat) => cat.id === selectedCategoryInfo.parentId);
  }, [categories, selectedCategoryInfo]);

  const childCategories = useMemo(
    () => (selectedParentCategory ? categories.filter((cat) => cat.parentId === selectedParentCategory.id) : []),
    [categories, selectedParentCategory]
  );

  const visibleProducts = useMemo(() => {
    if (!selectedCategoryInfo) return products;

    const childIds = new Set(childCategories.map((child) => child.id));
    return products.filter((product) => {
      const ids = getProductCategoryIds(product);
      if (!selectedCategoryInfo.parentId) {
        if (ids.includes(selectedCategoryInfo.id)) return true;
        return ids.some((id) => childIds.has(id));
      }
      return ids.includes(selectedCategoryInfo.id);
    });
  }, [childCategories, products, selectedCategoryInfo]);

  const groupedProducts = useMemo(() => {
    const shouldGroup =
      Boolean(selectedCategoryInfo) && !selectedCategoryInfo?.parentId && childCategories.length > 0;
    if (!shouldGroup) return null;

    const groups = childCategories.map((category) => ({ category, products: [] as Product[] }));
    const uncategorized: Product[] = [];

    for (const product of visibleProducts) {
      const ids = getProductCategoryIds(product);
      let assigned = false;
      for (let i = 0; i < childCategories.length; i += 1) {
        if (ids.includes(childCategories[i].id)) {
          groups[i].products.push(product);
          assigned = true;
          break;
        }
      }
      if (!assigned) {
        uncategorized.push(product);
      }
    }

    return {
      groups: groups.filter((group) => group.products.length > 0),
      uncategorized,
    };
  }, [childCategories, selectedCategoryInfo, visibleProducts]);

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
            {rootCategories.map((cat) => {
              const children = categories.filter((child) => child.parentId === cat.id);
              return (
                <div key={cat.id} className={styles.categoryGroup}>
                  <label className={styles.filterOption}>
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
                  {children.length > 0 && (
                    <div className={styles.subCategoryList}>
                      {children.map((child) => (
                        <label className={`${styles.filterOption} ${styles.filterOptionChild}`} key={child.id}>
                          <input
                            type="checkbox"
                            className={styles.filterCheckbox}
                            checked={selectedCategory === child.slug}
                            onChange={() => toggleCategory(child.slug)}
                          />
                          <span className={styles.filterLabel}>{child.name}</span>
                          {child.itemCount !== undefined && (
                            <span className={styles.filterCount}>{child.itemCount}</span>
                          )}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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
              <input
                type="checkbox"
                className={styles.filterCheckbox}
                checked={showOnlyOnSale}
                onChange={(e) => setShowOnlyOnSale(e.target.checked)}
              />
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
                  {visibleProducts.length}
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

          {!loading && !error && visibleProducts.length > 0 && (
            groupedProducts ? (
              <div className={styles.groupedProducts}>
                {groupedProducts.groups.map((group) => (
                  <section key={group.category.id} className={styles.groupSection}>
                    <div className={styles.groupHeader}>
                      <h3 className={styles.groupTitle}>{group.category.name}</h3>
                      <span className={styles.groupCount}>{group.products.length}</span>
                    </div>
                    <div className={styles.productsGrid}>
                      {group.products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </section>
                ))}
                {groupedProducts.uncategorized.length > 0 && (
                  <section className={styles.groupSection}>
                    <div className={styles.groupHeader}>
                      <h3 className={styles.groupTitle}>Sin subcategoria</h3>
                      <span className={styles.groupCount}>{groupedProducts.uncategorized.length}</span>
                    </div>
                    <div className={styles.productsGrid}>
                      {groupedProducts.uncategorized.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            ) : (
              <div className={styles.productsGrid}>
                {visibleProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )
          )}

          {!loading && !error && visibleProducts.length === 0 && (
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
