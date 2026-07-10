import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { Product, Category } from '../../types';
import {
  fetchPublicProducts,
  mapApiProductToProduct,
  type PublicProductsParams,
} from '../../services/productsService';
import { fetchPublicCategories } from '../../services/categoriesService';
import { publicCollectionsService, type PublicCollection } from '../../services/publicCollectionsService';
import { configService, type SortOption } from '../../services/configService';
import { ProductCard } from '../../features/products/ProductCard/ProductCard';
import { DEFAULT_IMAGE_PLACEHOLDER, normalizeImageUrl, type ImageUrlCandidate } from '../../utils/imageUrl';
import styles from './ProductListPage.module.css';

const FALLBACK_SORT_OPTIONS: SortOption[] = [
  { label: 'Relevancia', value: 'relevance' },
  { label: 'Menor precio', value: 'price_asc' },
  { label: 'Mayor precio', value: 'price_desc' },
  { label: 'Mejor puntuación', value: 'rating' },
  { label: 'Más nuevos', value: 'newest' },
];

const PRICE_RANGE_OPTIONS = [
  { id: '0-10000', label: 'Hasta $10.000' },
  { id: '10000-25000', label: '$10.000 - $25.000' },
  { id: '25000-50000', label: '$25.000 - $50.000' },
  { id: '50000-', label: 'Más de $50.000' },
] as const;

function getProductCategoryIds(product: Product): string[] {
  const ids = new Set<string>();
  if (Array.isArray(product.categoryIds)) {
    product.categoryIds.filter(Boolean).forEach((id) => ids.add(id));
  }
  if (product.categoryId) ids.add(product.categoryId);
  if (product.category?.id) ids.add(product.category.id);
  return Array.from(ids);
}

/**
 * Resuelve la mejor imagen posible para un producto de colección.
 * Utiliza la URL del R2 de Cloudflare resuelta en el lote, y tiene como respaldo la búsqueda en memoria de productos activos.
 */
function getCollectionProductImage(
  product: { id: string; imageUrl?: ImageUrlCandidate }, 
  liveProducts: Product[]
): string {
  // 1. Usar el imageUrl de la colección si ya está resuelto en vivo desde R2
  const url = normalizeImageUrl(product.imageUrl);
  if (url && !url.includes('placeholder.png')) {
    return url;
  }

  // 2. Respaldo: Buscar en los productos cargados en memoria en la cuadrícula de la página
  const liveProduct = liveProducts.find((p) => p.id === product.id);
  if (liveProduct && liveProduct.images && liveProduct.images.length > 0) {
    const firstImg = liveProduct.images[0];
    if (firstImg && !firstImg.includes('placeholder.png')) {
      return firstImg;
    }
  }

  // 3. Fallback final si no hay ninguna imagen disponible
  return DEFAULT_IMAGE_PLACEHOLDER;
}

export function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCategory = searchParams.get('category') ?? '';
  const urlSubCategory = searchParams.get('sub') ?? '';
  const urlTag = searchParams.get('tag') ?? '';
  const urlPriceRanges = searchParams.get('priceRanges') ?? '';
  const urlColeccion = searchParams.get('coleccion') ?? '';
  const tag = urlTag.trim().toLowerCase();
  const hasFeaturedTag = tag === 'destacado';
  const hasOfertaTag = tag === 'oferta';
  const hasNovedadTag = tag === 'novedad';
  const [sortBy, setSortBy] = useState('relevance');
  const [selectedCategory, setSelectedCategory] = useState<string>(urlSubCategory || urlCategory);
  const [showOnlyFeatured, setShowOnlyFeatured] = useState(hasFeaturedTag);
  const [showOnlyOnSale, setShowOnlyOnSale] = useState(hasOfertaTag);
  const [showOnlyNovedad, setShowOnlyNovedad] = useState(hasNovedadTag);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState<number | null>(null);
  const [page, setPage] = useState<number>(1);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sortOptions, setSortOptions] = useState<SortOption[]>(FALLBACK_SORT_OPTIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDiscounts, setActiveDiscounts] = useState<Set<string>>(new Set());
  const [categoryCollections, setCategoryCollections] = useState<PublicCollection[]>([]);
  const [activeCollection, setActiveCollection] = useState<PublicCollection | null>(null);
  const [collectionLoading, setCollectionLoading] = useState(false);

  const urlSlugs = searchParams.get('slugs') ?? '';
  const slugList = useMemo(
    () => urlSlugs ? urlSlugs.split(',').filter(Boolean) : [],
    [urlSlugs]
  );

  const isCollectionView = urlColeccion.length > 0;

  useEffect(() => {
    const next = urlSubCategory || urlCategory;
    setSelectedCategory((prev) => (prev === next ? prev : next));
  }, [urlCategory, urlSubCategory]);

  useEffect(() => {
    setShowOnlyFeatured((prev) => (prev === hasFeaturedTag ? prev : hasFeaturedTag));
  }, [hasFeaturedTag]);

  useEffect(() => {
    setShowOnlyOnSale((prev) => (prev === hasOfertaTag ? prev : hasOfertaTag));
  }, [hasOfertaTag]);

  useEffect(() => {
    setShowOnlyNovedad((prev) => (prev === hasNovedadTag ? prev : hasNovedadTag));
  }, [hasNovedadTag]);

  useEffect(() => {
    const nextRanges = urlPriceRanges
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    const sortedCurrent = [...selectedPriceRanges].sort();
    const sortedNext = [...nextRanges].sort();
    const hasSameSelection = sortedCurrent.length === sortedNext.length
      && sortedCurrent.every((value, index) => value === sortedNext[index]);

    if (!hasSameSelection) {
      setSelectedPriceRanges(nextRanges);
    }
  }, [urlPriceRanges, selectedPriceRanges]);

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

  /* Cargar colecciones de categoría cuando se selecciona una categoría */
  /* NOTA: Se integra búsqueda en vivo cruzada para que carguen siempre las imágenes correctas de R2 */
  useEffect(() => {
    if (!selectedCategory) {
      setCategoryCollections([]);
      return;
    }

    let cancelled = false;

    publicCollectionsService
      .getCollectionsByPosition('category')
      .then(async (collections) => {
        if (cancelled) return;

        // Extraer todos los slugs de los productos que componen el banner de categorías
        const allSlugs = collections
          .flatMap((col) => col.products?.map((p) => p.slug) || [])
          .filter(Boolean);

        if (allSlugs.length > 0) {
          try {
            // Consultar en lote las imágenes activas de R2 Cloudflare sin filtros de categoría
            const productsResponse = await fetchPublicProducts({ slugs: allSlugs.join(','), limit: 50 });
            if (cancelled) return;

            const imageMap = new Map<string, string>();
            productsResponse.data.forEach((p) => {
              if (Array.isArray(p.images) && p.images.length > 0) {
                const first = p.images[0];
                const url = typeof first === 'string'
                  ? first
                  : (first && typeof first === 'object' && typeof first.url === 'string' ? first.url : '');
                if (url) {
                  imageMap.set(p.slug, url);
                }
              }
            });

            // Enriquecer la colección del banner con las imágenes en vivo
            const updatedCollections = collections.map((col) => ({
              ...col,
              products: col.products?.map((p) => ({
                ...p,
                imageUrl: imageMap.get(p.slug) || p.imageUrl,
              })),
            }));

            setCategoryCollections(updatedCollections);
          } catch (fetchErr) {
            console.error('Error fetching live product images for category collections:', fetchErr);
            setCategoryCollections(collections);
          }
        } else {
          setCategoryCollections(collections);
        }
      })
      .catch((error) => {
        console.error('Error loading category collections:', error);
        if (!cancelled) setCategoryCollections([]);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCategory]);

  /* Cargar colección específica cuando viene ?coleccion= en la URL */
  useEffect(() => {
    if (!urlColeccion) {
      setActiveCollection(null);
      return;
    }
    setCollectionLoading(true);
    publicCollectionsService
      .getCollectionBySlug(urlColeccion)
      .then((col) => setActiveCollection(col))
      .catch(() => setActiveCollection(null))
      .finally(() => setCollectionLoading(false));
  }, [urlColeccion]);

  /* Cargar productos cuando cambian los filtros */
  useEffect(() => {
    const params: PublicProductsParams = { limit: 9, page };
    if (selectedCategory) params.category = selectedCategory;
    if (urlTag) params.tag = urlTag;
    if (urlSlugs) params.slugs = urlSlugs;
    if (sortBy !== 'relevance') params.sort = sortBy as PublicProductsParams['sort'];
    if (showOnlyFeatured) params.isFeatured = true;
    if (showOnlyOnSale) params.isOnSale = true;
    if (showOnlyNovedad) params.isNovedad = true;
    if (selectedPriceRanges.length > 0) params.priceRanges = selectedPriceRanges.join(',');
    setError(null);
    if (page === 1) setLoading(true);
    else setIsLoadingMore(true);

    fetchPublicProducts(params)
      .then(({ data, total }) => {
        setTotalProducts(total ?? null);
        const mappedProducts = data.map((p) => mapApiProductToProduct(p, categories));

        if (page === 1) {
          setProducts(mappedProducts);
        } else {
          setProducts((prev) => [...prev, ...mappedProducts]);
        }
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => {
        if (page === 1) setLoading(false);
        else setIsLoadingMore(false);
      });
  }, [sortBy, selectedCategory, showOnlyOnSale, urlTag, tag, showOnlyFeatured, activeDiscounts, categories, urlSlugs, slugList, page, showOnlyNovedad, selectedPriceRanges]);

  /* Resetear paginación cuando cambian filtros relevantes */
  useEffect(() => {
    setPage(1);
  }, [sortBy, selectedCategory, showOnlyOnSale, urlTag, tag, showOnlyFeatured, showOnlyNovedad, selectedPriceRanges]);

  const handleLoadMore = () => {
    if (isLoadingMore) return;
    setPage((p) => p + 1);
  };

  const updateTagParam = (nextTag: string | null) => {
    const updated = new URLSearchParams(searchParams);
    if (nextTag) {
      updated.set('tag', nextTag);
    } else {
      updated.delete('tag');
    }
    setSearchParams(updated, { replace: true });
  };

  const togglePriceRange = (rangeId: string) => {
    const nextRanges = selectedPriceRanges.includes(rangeId)
      ? selectedPriceRanges.filter((item) => item !== rangeId)
      : [...selectedPriceRanges, rangeId];

    const updated = new URLSearchParams(searchParams);
    if (nextRanges.length > 0) {
      updated.set('priceRanges', nextRanges.join(','));
    } else {
      updated.delete('priceRanges');
    }

    setSelectedPriceRanges(nextRanges);
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

  const visibleProducts = products;

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

  /* Vista de colección específica */
  if (isCollectionView) {
    const colProducts = activeCollection?.products ?? [];
    return (
      <main className={styles.page}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to="/">Inicio</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <Link to="/productos">Productos</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>
            {activeCollection?.name ?? urlColeccion}
          </span>
        </nav>

        <div style={{ maxWidth: 'var(--container-2xl)', margin: '0 auto', padding: '0 var(--space-6)' }}>
          {collectionLoading ? (
            <p style={{ color: 'var(--color-text-secondary)', padding: 'var(--space-8) 0' }}>Cargando colección...</p>
          ) : !activeCollection ? (
            <p style={{ color: 'var(--color-text-secondary)', padding: 'var(--space-8) 0' }}>Colección no encontrada.</p>
          ) : (
            <>
              {/* Header de la colección */}
              <div className={styles.collectionViewHeader}>
                {activeCollection.imageUrl && (
                  <img src={activeCollection.imageUrl} alt={activeCollection.name} className={styles.collectionViewBanner} />
                )}
                <div className={styles.collectionViewMeta}>
                  <h1 className={styles.collectionViewTitle}>{activeCollection.name}</h1>
                  {activeCollection.description && (
                    <p className={styles.collectionViewDesc}>{activeCollection.description}</p>
                  )}
                  <span className={styles.collectionViewCount}>
                    {colProducts.length} {colProducts.length === 1 ? 'producto' : 'productos'}
                  </span>
                </div>
              </div>

              {/* Grilla de productos */}
              {colProducts.length === 0 ? (
                <p style={{ color: 'var(--color-text-secondary)', padding: 'var(--space-8) 0' }}>Esta colección aún no tiene productos.</p>
              ) : (
                <div className={styles.collectionViewGrid}>
                  {colProducts.map((product) => {
                    const imageUrl = getCollectionProductImage(product, products);
                    return (
                      <button
                        key={product.id}
                        type="button"
                        className={styles.collectionViewCard}
                        onClick={() => { window.location.href = `/producto/${product.slug}`; }}
                      >
                        <div className={styles.collectionViewImg}>
                          <img
                            src={imageUrl}
                            alt={product.name}
                            loading="lazy"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (target.src !== DEFAULT_IMAGE_PLACEHOLDER) {
                                target.src = DEFAULT_IMAGE_PLACEHOLDER;
                              }
                            }}
                          />
                        </div>
                        <div className={styles.collectionViewCardInfo}>
                          <p className={styles.collectionViewCardName}>{product.name}</p>
                          <p className={styles.collectionViewCardPrice}>
                            ${Number(product.price).toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link to="/">Inicio</Link>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>Productos</span>
      </nav>

      {categoryCollections.length > 0 && (
        <div className={styles.collectionBannerWrapper}>
          <div className={styles.categoryCollections}>
            {categoryCollections.map((collection) => (
              <div key={collection.id} className={styles.categoryBanner}>
                <div className={styles.categoryBannerLabel}>
                  <span className={styles.categoryBannerTitle}>{collection.name}</span>
                  {collection.description && (
                    <span className={styles.categoryBannerDesc}>{collection.description}</span>
                  )}
                </div>
                <div className={styles.categoryBannerProducts}>
                  {(collection.products ?? []).slice(0, 5).map((product) => {
                    const imageUrl = getCollectionProductImage(product, products);
                    return (
                      <button
                        key={product.id}
                        type="button"
                        className={styles.categoryBannerCard}
                        onClick={() => { window.location.href = `/producto/${product.slug}`; }}
                        title={product.name}
                      >
                        <div className={styles.categoryBannerImg}>
                          <img
                            src={imageUrl}
                            alt={product.name}
                            loading="lazy"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (target.src !== DEFAULT_IMAGE_PLACEHOLDER) {
                                target.src = DEFAULT_IMAGE_PLACEHOLDER;
                              }
                            }}
                          />
                        </div>
                        <p className={styles.categoryBannerProductName}>{product.name}</p>
                        <p className={styles.categoryBannerPrice}>
                          ${Number(product.price).toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                        </p>
                      </button>
                    );
                  })}
                </div>
                <a
                  href={`/productos?coleccion=${encodeURIComponent(collection.slug)}`}
                  className={styles.categoryBannerViewAll}
                >
                  Ver todos
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.layout}>
        <aside
          className={`${styles.sidebar} ${filtersOpen ? styles.open : ''}`}
          aria-label="Filtros de productos"
        >
          <div className={styles.filterGroup}>
            <h3 className={styles.filterTitle}>Precio</h3>
            {PRICE_RANGE_OPTIONS.map((option) => (
              <label className={styles.filterOption} key={option.id}>
                <input
                  type="checkbox"
                  className={styles.filterCheckbox}
                  checked={selectedPriceRanges.includes(option.id)}
                  onChange={() => togglePriceRange(option.id)}
                />
                <span className={styles.filterLabel}>{option.label}</span>
              </label>
            ))}
          </div>

          <div className={styles.filterGroup}>
            <h3 className={styles.filterTitle}>Etiquetas</h3>
            <label className={styles.filterOption}>
              <input
                type="checkbox"
                className={styles.filterCheckbox}
                checked={showOnlyOnSale}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setShowOnlyOnSale(checked);
                  updateTagParam(checked ? 'oferta' : null);
                }}
              />
              <span className={styles.filterLabel}>En oferta</span>
            </label>
            <label className={styles.filterOption}>
              <input
                type="checkbox"
                className={styles.filterCheckbox}
                checked={showOnlyNovedad}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setShowOnlyNovedad(checked);
                  updateTagParam(checked ? 'novedad' : null);
                }}
              />
              <span className={styles.filterLabel}>Novedades</span>
            </label>
            <label className={styles.filterOption}>
              <input
                type="checkbox"
                className={styles.filterCheckbox}
                checked={showOnlyFeatured}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setShowOnlyFeatured(checked);
                  updateTagParam(checked ? 'destacado' : null);
                }}
              />
              <span className={styles.filterLabel}>Destacados</span>
            </label>
          </div>
        </aside>

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
                </span>
                {totalProducts ? (
                  <> de <span className={styles.resultCountBold}>{totalProducts}</span> productos</>
                ) : (
                  ' productos'
                )}
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

          {!loading && !error && totalProducts !== null && products.length < totalProducts && (
            <div className={styles.loadMoreWrap}>
              <button
                type="button"
                className={styles.loadMoreBtn}
                onClick={handleLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? 'Cargando...' : 'Cargar más'}
              </button>
            </div>
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