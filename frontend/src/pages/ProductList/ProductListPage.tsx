/**
 * pages/ProductList/ProductListPage.tsx
 * Catálogo público con navegación unificada, barra horizontal de subcategorías y grilla continua.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { X, SlidersHorizontal, RotateCcw, Search } from 'lucide-react';
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
import { Dropdown } from '../../components/ui/Dropdown/Dropdown';
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

function getCollectionProductImage(
  product: { id: string; imageUrl?: ImageUrlCandidate },
  liveProducts: Product[]
): string {
  const url = normalizeImageUrl(product.imageUrl);
  if (url && !url.includes('placeholder.png')) {
    return url;
  }

  const liveProduct = liveProducts.find((p) => p.id === product.id);
  if (liveProduct && liveProduct.images && liveProduct.images.length > 0) {
    const firstImg = liveProduct.images[0];
    if (firstImg && !firstImg.includes('placeholder.png')) {
      return firstImg;
    }
  }

  return DEFAULT_IMAGE_PLACEHOLDER;
}

export function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCategory = searchParams.get('category') ?? '';
  const urlSubCategory = searchParams.get('sub') ?? '';
  const urlTag = searchParams.get('tag') ?? '';
  const urlTags = searchParams.get('tags') ?? '';
  const urlPriceRanges = searchParams.get('priceRanges') ?? '';
  const urlColeccion = searchParams.get('coleccion') ?? '';
  const urlQuery = searchParams.get('q') ?? '';

  const selectedTags = useMemo(() => {
    return Array.from(new Set([
      ...urlTags.split(','),
      urlTag,
    ]
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)));
  }, [urlTag, urlTags]);

  const showOnlyFeatured = selectedTags.includes('destacado');
  const showOnlyOnSale = selectedTags.includes('oferta');
  const showOnlyNovedad = selectedTags.includes('novedad');
  const [sortBy, setSortBy] = useState('relevance');
  const [selectedCategory, setSelectedCategory] = useState<string>(urlSubCategory || urlCategory);
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
  const [categoryCollections, setCategoryCollections] = useState<PublicCollection[]>([]);
  const [activeCollection, setActiveCollection] = useState<PublicCollection | null>(null);
  const [collectionFullProducts, setCollectionFullProducts] = useState<Product[]>([]);
  const [collectionLoading, setCollectionLoading] = useState(false);

  const urlSlugs = searchParams.get('slugs') ?? '';
  const isCollectionView = urlColeccion.length > 0;
  const priceRangesStr = selectedPriceRanges.join(',');

  useEffect(() => {
    if (filtersOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [filtersOpen]);

  useEffect(() => {
    const next = urlSubCategory || urlCategory;
    setSelectedCategory((prev) => (prev === next ? prev : next));
  }, [urlCategory, urlSubCategory]);

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

  useEffect(() => {
    configService.getSortOptions()
      .then(setSortOptions)
      .catch(() => setSortOptions(FALLBACK_SORT_OPTIONS));
  }, []);

  useEffect(() => {
    fetchPublicCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  /* Cargar colecciones contextuales */
  useEffect(() => {
    let cancelled = false;

    publicCollectionsService
      .getCollectionsByPosition('category')
      .then(async (collections) => {
        if (cancelled) return;

        const allSlugs = collections
          .flatMap((col) => col.products?.map((p) => p.slug) || [])
          .filter(Boolean);

        if (allSlugs.length > 0) {
          try {
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
                  imageMap.set(p.id, url);
                }
              }
            });

            const updatedCollections = collections.map((col) => ({
              ...col,
              products: col.products?.map((p) => ({
                ...p,
                imageUrl: imageMap.get(p.id) || p.imageUrl,
              })),
            }));

            if (!cancelled) setCategoryCollections(updatedCollections);
          } catch (fetchErr) {
            console.error('Error loading live images for category collections:', fetchErr);
            if (!cancelled) setCategoryCollections(collections);
          }
        } else {
          if (!cancelled) setCategoryCollections(collections);
        }
      })
      .catch((err) => {
        console.error('Error loading category collections:', err);
        if (!cancelled) setCategoryCollections([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* Cargar colección específica cuando viene ?coleccion= en la URL */
  useEffect(() => {
    if (!urlColeccion) {
      setActiveCollection(null);
      setCollectionFullProducts([]);
      return;
    }
    setCollectionLoading(true);
    publicCollectionsService
      .getCollectionBySlug(urlColeccion)
      .then(async (col) => {
        setActiveCollection(col);
        const colProds = col.products ?? [];
        const slugs = colProds.map((p) => p.slug).filter(Boolean);

        const liveMap = new Map<string, Product>();
        if (slugs.length > 0) {
          try {
            const { data } = await fetchPublicProducts({ slugs: slugs.join(','), limit: 50 });
            data.forEach((p) => {
              const mapped = mapApiProductToProduct(p, categories);
              liveMap.set(p.id, mapped);
              liveMap.set(p.slug, mapped);
            });
          } catch {
            // fallback
          }
        }

        const mappedFull = colProds.map((p) => {
          const live = liveMap.get(p.id) || liveMap.get(p.slug);
          if (live) return live;

          const imageUrl = getCollectionProductImage(p, products);
          const priceNum = typeof p.price === 'string' ? parseFloat(p.price) : p.price;

          return {
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: Number.isFinite(priceNum) ? priceNum : 0,
            images: [imageUrl],
            category: categories[0] ?? { id: '', name: 'Categoría', slug: 'categoria', isVisible: true },
            description: '',
            shortDescription: '',
            tags: [],
            rating: 0,
            reviewCount: 0,
            inStock: true,
            sku: '',
          } as Product;
        });

        setCollectionFullProducts(mappedFull);
      })
      .catch(() => {
        setActiveCollection(null);
        setCollectionFullProducts([]);
      })
      .finally(() => setCollectionLoading(false));
  }, [urlColeccion, categories, products]);

  /* Cargar productos según filtros */
  useEffect(() => {
    const params: PublicProductsParams = { limit: 9, page };
    if (selectedCategory) params.category = selectedCategory;
    if (selectedTags.includes('destacado')) params.isFeatured = true;
    if (selectedTags.includes('oferta')) params.isOnSale = true;
    if (selectedTags.includes('novedad')) params.isNovedad = true;
    if (urlSlugs) params.slugs = urlSlugs;
    if (urlQuery) params.q = urlQuery;

    if (sortBy !== 'relevance') params.sort = sortBy as PublicProductsParams['sort'];
    if (priceRangesStr) params.priceRanges = priceRangesStr;

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
  }, [sortBy, selectedCategory, selectedTags, urlSlugs, page, priceRangesStr, categories, urlQuery]);

  useEffect(() => {
    setPage(1);
  }, [sortBy, selectedCategory, selectedTags, priceRangesStr, urlQuery]);

  const handleLoadMore = () => {
    if (isLoadingMore) return;
    setPage((p) => p + 1);
  };

  const toggleTag = (tag: string) => {
    const nextTags = selectedTags.includes(tag)
      ? selectedTags.filter((item) => item !== tag)
      : [...selectedTags, tag];

    const updated = new URLSearchParams(searchParams);
    updated.delete('tag');
    if (nextTags.length > 0) {
      updated.set('tags', nextTags.join(','));
    } else {
      updated.delete('tags');
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

  const handleResetFilters = useCallback(() => {
    const updated = new URLSearchParams(searchParams);
    updated.delete('tag');
    updated.delete('tags');
    updated.delete('priceRanges');
    setSelectedPriceRanges([]);
    setSearchParams(updated, { replace: true });
  }, [searchParams, setSearchParams]);

  const activeFiltersCount = useMemo(() => {
    let count = selectedPriceRanges.length;
    if (showOnlyOnSale) count++;
    if (showOnlyNovedad) count++;
    if (showOnlyFeatured) count++;
    return count;
  }, [selectedPriceRanges.length, showOnlyOnSale, showOnlyNovedad, showOnlyFeatured]);

  const selectedCategoryInfo = useMemo(
    () => categories.find((cat) => cat.slug === selectedCategory),
    [categories, selectedCategory]
  );

  const selectedParentCategory = useMemo(() => {
    if (!selectedCategoryInfo) return undefined;
    if (!selectedCategoryInfo.parentId) return selectedCategoryInfo;
    return categories.find((cat) => cat.id === selectedCategoryInfo.parentId);
  }, [categories, selectedCategoryInfo]);

  // Subcategorías del contexto activo para el carrusel horizontal
  const subcategoryPills = useMemo(() => {
    if (!selectedParentCategory) return [];
    return categories.filter((cat) => cat.parentId === selectedParentCategory.id);
  }, [categories, selectedParentCategory]);

  const visibleProducts = products;

  // Filtrado determinista de colecciones asociadas
  const activeCategoryCollections = useMemo(() => {
    if (!categoryCollections || categoryCollections.length === 0) return [];

    return categoryCollections.filter((col) => {
      const paramCatId = col.params && typeof col.params.categoryId === 'string' ? (col.params.categoryId as string) : undefined;

      if (!selectedCategoryInfo) {
        return !paramCatId;
      }

      if (paramCatId) {
        return (
          paramCatId === selectedCategoryInfo.id ||
          paramCatId === selectedCategoryInfo.slug ||
          (selectedParentCategory && paramCatId === selectedParentCategory.id)
        );
      }

      if (col.products && col.products.length > 0) {
        const allowedCatIds = new Set([
          selectedCategoryInfo.id,
          ...subcategoryPills.map((c) => c.id),
        ]);

        return col.products.some((p) => {
          const liveProd = products.find((lp) => lp.id === p.id);
          if (!liveProd) return false;
          const prodCatIds = getProductCategoryIds(liveProd);
          return prodCatIds.some((catId) => allowedCatIds.has(catId));
        });
      }

      return false;
    });
  }, [categoryCollections, selectedCategoryInfo, selectedParentCategory, subcategoryPills, products]);

  const renderMobileFilterModal = () => {
    if (!filtersOpen) return null;

    const modalContent = (
      <div className={styles.mobileFilterOverlay}>
        <button
          type="button"
          className={styles.mobileFilterBackdrop}
          onClick={() => setFiltersOpen(false)}
          aria-label="Cerrar ventana de filtros"
          tabIndex={-1}
        />
        <div
          className={styles.mobileFilterContent}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-filter-modal-title"
        >
          <div className={styles.mobileFilterHandle} aria-hidden="true" />

          <div className={styles.mobileFilterHeader}>
            <h3 id="mobile-filter-modal-title" className={styles.mobileFilterTitle}>
              Filtrar productos
            </h3>
            <button
              type="button"
              className={styles.mobileFilterCloseBtn}
              onClick={() => setFiltersOpen(false)}
              aria-label="Cerrar filtros"
            >
              <X size={20} />
            </button>
          </div>

          <div className={styles.mobileFilterBody}>
            <div className={styles.mobileFilterGroup}>
              <h4 className={styles.mobileFilterGroupTitle}>Precio</h4>
              {PRICE_RANGE_OPTIONS.map((option) => (
                <label className={styles.mobileFilterOption} key={option.id}>
                  <input
                    type="checkbox"
                    className={styles.mobileFilterCheckbox}
                    checked={selectedPriceRanges.includes(option.id)}
                    onChange={() => togglePriceRange(option.id)}
                  />
                  <span className={styles.mobileFilterOptionLabel}>{option.label}</span>
                </label>
              ))}
            </div>

            <div className={styles.mobileFilterGroup}>
              <h4 className={styles.mobileFilterGroupTitle}>Etiquetas</h4>
              <label className={styles.mobileFilterOption}>
                <input
                  type="checkbox"
                  className={styles.mobileFilterCheckbox}
                  checked={showOnlyOnSale}
                  onChange={() => toggleTag('oferta')}
                />
                <span className={styles.mobileFilterOptionLabel}>En oferta</span>
              </label>
              <label className={styles.mobileFilterOption}>
                <input
                  type="checkbox"
                  className={styles.mobileFilterCheckbox}
                  checked={showOnlyNovedad}
                  onChange={() => toggleTag('novedad')}
                />
                <span className={styles.mobileFilterOptionLabel}>Novedades</span>
              </label>
              <label className={styles.mobileFilterOption}>
                <input
                  type="checkbox"
                  className={styles.mobileFilterCheckbox}
                  checked={showOnlyFeatured}
                  onChange={() => toggleTag('destacado')}
                />
                <span className={styles.mobileFilterOptionLabel}>Destacados</span>
              </label>
            </div>
          </div>

          <div className={styles.mobileFilterFooter}>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                className={styles.mobileFilterResetBtn}
                onClick={handleResetFilters}
              >
                Limpiar todo
              </button>
            )}
            <button
              type="button"
              className={styles.mobileFilterApplyBtn}
              onClick={() => setFiltersOpen(false)}
            >
              Ver resultados {totalProducts !== null ? `(${totalProducts})` : ''}
            </button>
          </div>
        </div>
      </div>
    );

    if (typeof document === 'undefined') return modalContent;
    return createPortal(modalContent, document.body);
  };

  /* Vista de colección específica */
  if (isCollectionView) {
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

        <div style={{ maxWidth: 'var(--container-2xl)', margin: '0 auto', padding: '0 var(--space-2)' }}>
          {collectionLoading ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>Cargando colección...</p>
            </div>
          ) : !activeCollection ? (
            <div className={styles.emptyState}>
              <Search className={styles.emptyIcon} size={40} aria-hidden="true" />
              <h3 className={styles.emptyTitle}>Colección no encontrada</h3>
              <p className={styles.emptyText}>La colección seleccionada no existe o fue removida.</p>
              <Link to="/productos" className={styles.loadMoreBtn} style={{ textDecoration: 'none', display: 'inline-block', marginTop: '12px' }}>
                Ver todos los productos
              </Link>
            </div>
          ) : (
            <>
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
                    {collectionFullProducts.length} {collectionFullProducts.length === 1 ? 'producto' : 'productos'}
                  </span>
                </div>
              </div>

              {collectionFullProducts.length === 0 ? (
                <div className={styles.emptyState}>
                  <p className={styles.emptyText}>Esta colección aún no tiene productos.</p>
                </div>
              ) : (
                <div className={styles.collectionViewGrid}>
                  {collectionFullProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
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
      <style>{`
        /* Carrusel Horizontal de Subcategorías (Mobile-First) */
        .subcatScrollableBar {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          padding: 8px 2px 14px 2px;
          margin-bottom: 8px;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }

        .subcatScrollableBar::-webkit-scrollbar {
          display: none;
        }

        .subcatPill {
          display: inline-flex;
          align-items: center;
          white-space: nowrap;
          padding: 8px 16px;
          border-radius: 24px;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          background: var(--color-bg-secondary, #f2efeb);
          color: var(--color-text-primary, #111827);
          border: 1px solid var(--color-border, #e5e2dd);
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        .subcatPill:hover {
          background: var(--color-primary-light, #8fa99a);
          color: #ffffff;
          border-color: var(--color-primary, #769282);
        }

        .subcatPillActive {
          background: var(--color-primary, #769282) !important;
          color: #ffffff !important;
          border-color: var(--color-primary, #769282) !important;
          box-shadow: 0 2px 6px rgba(118, 146, 130, 0.3);
        }
      `}</style>

      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link to="/">Inicio</Link>
        <span className={styles.breadcrumbSep}>/</span>
        <Link to="/productos">Productos</Link>
        {selectedParentCategory && selectedParentCategory.id !== selectedCategoryInfo?.id && (
          <>
            <span className={styles.breadcrumbSep}>/</span>
            <Link to={`/productos?category=${selectedParentCategory.slug}`}>{selectedParentCategory.name}</Link>
          </>
        )}
        {selectedCategoryInfo && (
          <>
            <span className={styles.breadcrumbSep}>/</span>
            <span className={styles.breadcrumbCurrent}>{selectedCategoryInfo.name}</span>
          </>
        )}
        {!selectedCategoryInfo && urlQuery && (
          <>
            <span className={styles.breadcrumbSep}>/</span>
            <span className={styles.breadcrumbCurrent}>{`Búsqueda: "${urlQuery}"`}</span>
          </>
        )}
        {!selectedCategoryInfo && !urlQuery && (
          <>
            <span className={styles.breadcrumbSep}>/</span>
            <span className={styles.breadcrumbCurrent}>Todos los productos</span>
          </>
        )}
      </nav>

      <div className={styles.layout}>
        {/* Sidebar Desktop (<aside>) */}
        <aside
          className={styles.sidebar}
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
                onChange={() => toggleTag('oferta')}
              />
              <span className={styles.filterLabel}>En oferta</span>
            </label>
            <label className={styles.filterOption}>
              <input
                type="checkbox"
                className={styles.filterCheckbox}
                checked={showOnlyNovedad}
                onChange={() => toggleTag('novedad')}
              />
              <span className={styles.filterLabel}>Novedades</span>
            </label>
            <label className={styles.filterOption}>
              <input
                type="checkbox"
                className={styles.filterCheckbox}
                checked={showOnlyFeatured}
                onChange={() => toggleTag('destacado')}
              />
              <span className={styles.filterLabel}>Destacados</span>
            </label>
          </div>
        </aside>

        <div className={styles.main}>
          {/* 🟢 BARRA HORIZONTAL DE SUBCATEGORÍAS (Pills/Chips en Scroll Táctil) */}
          {selectedParentCategory && subcategoryPills.length > 0 && (
            <div className="subcatScrollableBar" role="tablist" aria-label="Subcategorías">
              <Link
                to={`/productos?category=${selectedParentCategory.slug}`}
                className={`subcatPill ${selectedCategory === selectedParentCategory.slug ? 'subcatPillActive' : ''}`}
              >
                Todas en {selectedParentCategory.name}
              </Link>
              {subcategoryPills.map((sub) => (
                <Link
                  key={sub.id}
                  to={`/productos?category=${sub.slug}`}
                  className={`subcatPill ${selectedCategory === sub.slug ? 'subcatPillActive' : ''}`}
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          )}

          {/* Colecciones contextuales */}
          {activeCategoryCollections.length > 0 && (
            <div className={styles.collectionBannerWrapper}>
              <div className={styles.categoryCollections}>
                {activeCategoryCollections.map((collection) => (
                  <div key={collection.id} className={styles.categoryBanner}>
                    <div className={styles.categoryBannerHeader}>
                      <div className={styles.categoryBannerLabel}>
                        <span className={styles.categoryBannerTitle}>{collection.name}</span>
                        {collection.description && (
                          <span className={styles.categoryBannerDesc}>{collection.description}</span>
                        )}
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

                    <div className={styles.categoryBannerProducts}>
                      {(collection.products ?? []).slice(0, 8).map((product) => {
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
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.toolbar}>
            <div className={styles.toolbarLeft}>
              <button
                className={`${styles.mobileFilterBtn} ${activeFiltersCount > 0 ? styles.mobileFilterBtnActive : ''}`}
                onClick={() => setFiltersOpen(true)}
                type="button"
                aria-label="Abrir filtros"
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
                  className={styles.mobileResetBtn}
                  onClick={handleResetFilters}
                  title="Limpiar filtros"
                >
                  <RotateCcw size={14} />
                  <span>Limpiar</span>
                </button>
              )}

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
              <div className={styles.sortDropdownWrapper}>
                <Dropdown
                  id="sort"
                  className={styles.sortDropdownControl}
                  options={sortOptions.map((opt) => ({ value: opt.value, label: opt.label }))}
                  value={sortBy}
                  onChange={(value) => setSortBy(value)}
                  placeholder="Relevancia"
                />
              </div>
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

          {/* 🟢 GRILLA UNIFICADA CONTINUA (Cero fragmentación, sorting y paginación 100% consistentes) */}
          {!loading && !error && visibleProducts.length > 0 && (
            <div className={styles.productsGrid}>
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
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
              <Search className={styles.emptyIcon} size={40} aria-hidden="true" />
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

      {/* Bottom Sheet Modal de Filtros para Móvil */}
      {renderMobileFilterModal()}
    </main>
  );
}