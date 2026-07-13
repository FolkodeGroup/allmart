// frontend/src/pages/ProductDetail/ProductDetailPage.tsx
import { useState, useEffect, useMemo } from 'react';
import type { VariantGroup } from '../../context/AdminProductsContext';
import { useParams, Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import type { Product } from '../../types';
import {
  fetchPublicProductBySlug,
  fetchPublicProducts,
  mapApiProductToProduct,
} from '../../services/productsService';
import { fetchPublicCategories } from '../../services/categoriesService';
import { publicCollectionsService, type ProductDiscount } from '../../services/publicCollectionsService';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { ProductPrice } from '../../components/ui/ProductPrice/ProductPrice';
import { ProductCard } from '../../features/products/ProductCard/ProductCard';
import { ProductReviews } from '../../components/ProductReviews/ProductReviews';
import VariantSelector from '../../components/VariantSelector/VariantSelector';
import DiscountBadge from '../../components/DiscountBadge';

import styles from './ProductDetailPage.module.css';
import { useCart } from '../../components/layout/context/CartContextUtils';
import { useFavorites } from '../../components/layout/context/FavoritesContextUtils';

function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

export function ProductDetailPage() {
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite, syncFavorite } = useFavorites();
  const { slug } = useParams<{ slug: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [selectedSkuId, setSelectedSkuId] = useState<string | null>(null);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [dynamicDiscount, setDynamicDiscount] = useState<ProductDiscount | null>(null);

  const selectedSku = useMemo(() => product?.skus?.find(s => s.id === selectedSkuId) ?? null, [product?.skus, selectedSkuId]);

  const skuImages = useMemo(() => {
    if (Object.keys(selectedVariants).length === 0) return (product?.images ?? []).filter(Boolean);
    const source = (selectedSku?.images && selectedSku.images.length > 0) ? selectedSku.images : (product?.images ?? []);
    const normalized = Array.isArray(source) ? source.map(String).filter(Boolean) : [];
    const unique = Array.from(new Set(normalized));
    return unique;
  }, [selectedSku, selectedVariants, product?.images]);

  useEffect(() => {
    if (selectedImage >= (skuImages?.length ?? 0)) {
      setSelectedImage(0);
    }
  }, [skuImages, selectedImage]);

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    setLoading(true);
    setError(null);
    setSelectedImage(0);
    setRelatedProducts([]);
    setSelectedVariants({});
    setQuantity(1);

    const loadProduct = async () => {
      try {
        const [apiProduct, categories] = await Promise.all([
          fetchPublicProductBySlug(slug),
          fetchPublicCategories(),
        ]);

        if (cancelled) return;

        const mappedProduct = mapApiProductToProduct(apiProduct, categories);
        setProduct(mappedProduct);
        setSelectedSkuId(null);
        setLoading(false);

        const primaryCategoryId = apiProduct.categoryId || apiProduct.categoryIds?.[0];
        const category = categories.find((c) => c.id === primaryCategoryId);

        if (!category) {
          setRelatedProducts([]);
          return;
        }

        try {
          const { data } = await fetchPublicProducts({
            category: category.slug,
            limit: 8
          });

          if (cancelled) return;

          const related = data
            .filter((p) => p.id !== apiProduct.id)
            .slice(0, 4)
            .map((p) => mapApiProductToProduct(p, categories));

          setRelatedProducts(related);
        } catch {
          if (!cancelled) {
            setRelatedProducts([]);
          }
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Error al cargar el producto');
        setLoading(false);
      }
    };

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const variantGroups: VariantGroup[] = product ? (product as unknown as { variants?: VariantGroup[] }).variants ?? [] : [];

  // 🟢 FIX: Autoseleccionar la variante más barata disponible para coincidir con el precio del catálogo
  useEffect(() => {
    if (product && product.skus && product.skus.length > 0 && Object.keys(selectedVariants).length === 0) {
      
      // Ordenamos las variantes por precio de menor a mayor
      const sortedSkus = [...product.skus].sort((a, b) => {
        const priceA = a.price ?? product.price;
        const priceB = b.price ?? product.price;
        return priceA - priceB;
      });

      // Seleccionamos la más barata que tenga stock (o la más barata en su defecto)
      const defaultSku = sortedSkus.find(s => s.stock > 0) || sortedSkus[0];

      if (defaultSku && defaultSku.attributes) {
        // Normalizamos todas las llaves a minúsculas
        const normalizedAttrs: Record<string, string> = {};
        Object.entries(defaultSku.attributes).forEach(([k, v]) => {
          normalizedAttrs[k.toLowerCase()] = v;
        });
        setSelectedVariants(normalizedAttrs);
      }
    }
  }, [product, selectedVariants]);

  // Cuando se cambia de SKU, volvemos a la primera imagen de la galería
  useEffect(() => {
    setSelectedImage(0);
  }, [selectedSkuId]);

  useEffect(() => {
    if (!product) return;

    const loadDiscount = async () => {
      try {
        const categoryIds = Array.isArray(product.categoryIds)
          ? product.categoryIds
          : product.categoryId
            ? [product.categoryId]
            : [];
        const discount = await publicCollectionsService.getProductDiscount(
          product.id,
          product.price,
          categoryIds
        );
        setDynamicDiscount(discount);
      } catch (error) {
        console.error('Error cargando descuento:', error);
      }
    };

    loadDiscount();
  }, [product]);

  const isNew = product ? product.tags.includes('nuevo') : false;
  const isProductFavorite = product ? isFavorite(product.id) : false;

  const variantMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    const seen: Record<string, Set<string>> = {};

    product?.skus?.forEach(sku => {
      Object.entries(sku.attributes || {}).forEach(([k, v]) => {
        const key = k.toLowerCase();
        const value = String(v).trim();
        if (!value) return;

        if (!map[key]) {
          map[key] = [];
          seen[key] = new Set();
        }
        if (!seen[key].has(value)) {
          map[key].push(value);
          seen[key].add(value);
        }
      });
    });

    Object.keys(map).forEach(k => {
      if (map[k].length === 0) delete map[k];
    });

    return map;
  }, [product]);

  function getAttr(sku: { attributes?: Record<string, string> }, key: string) {
    const entries = Object.entries(sku.attributes || {});
    const found = entries.find(([k]) => k.toLowerCase() === key.toLowerCase());
    return found ? found[1] : undefined;
  }

  const matchingSku = useMemo(() => {
    if (!product?.skus) return null;
    if (Object.keys(selectedVariants).length === 0) return null;

    return product.skus.find(sku => {
      return Object.entries(selectedVariants).every(([k, v]) => {
        return getAttr(sku, k) === v;
      });
    }) || null;
  }, [product, selectedVariants]);

  useEffect(() => {
    if (matchingSku) {
      setSelectedSkuId(matchingSku.id);
    } else if (Object.keys(selectedVariants).length === 0) {
      setSelectedSkuId(null);
    }
  }, [matchingSku, selectedVariants]);

  function isOptionAvailable(attr: string, value: string) {
    return product?.skus?.some(sku => {
      const matchesOther = Object.entries(selectedVariants).every(([k, v]) => {
        if (k === attr) return true;
        return getAttr(sku, k) === v;
      });

      return matchesOther && getAttr(sku, attr) === value;
    });
  }

  function findCompatibleVariants(newSelection: Record<string, string>): Record<string, string> {
    if (!product?.skus || Object.keys(variantMap).length === 0) {
      return newSelection;
    }

    const result = { ...newSelection };
    const compatibleSkus = product.skus.filter(sku => {
      return Object.entries(result).every(([k, v]) => {
        return getAttr(sku, k) === v;
      });
    });

    if (compatibleSkus.length === 0) {
      return result;
    }

    for (const attr of Object.keys(variantMap)) {
      if (!result[attr]) {
        const possibleValues = new Set<string>();
        compatibleSkus.forEach(sku => {
          const value = getAttr(sku, attr);
          if (value) {
            possibleValues.add(value);
          }
        });

        const originalOrderedValues = variantMap[attr] || [];
        for (const value of originalOrderedValues) {
          if (possibleValues.has(value)) {
            result[attr] = value;
            break;
          }
        }
      }
    }

    return result;
  }

  function normalizeColor(value: string): string | null {
    const trimmed = value.trim();
    const looksLikeColorSyntax =
      /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(trimmed) ||
      /^rgba?\s*\(/i.test(trimmed) ||
      /^hsla?\s*\(/i.test(trimmed);

    if (!looksLikeColorSyntax) return null;

    const el = document.createElement('div');
    el.style.color = trimmed;
    return el.style.color || null;
  }

  useEffect(() => {
    if (!product || !isProductFavorite) {
      return;
    }
    syncFavorite(product);
  }, [isProductFavorite, syncFavorite, product]);

  const handleAddToCart = async () => {
    if (!product) return;

    // 🟢 FIX: Renombrado a 'isSimpleProduct' y utilizado correctamente en la condición
    const isSimpleProduct = variantGroups.length === 0;

    // Antes de agregar, solicitar descuento para la cantidad seleccionada
    const categoryIds = Array.isArray(product.categoryIds)
      ? product.categoryIds
      : product.categoryId
        ? [product.categoryId]
        : [];

    const discountForQty = await (async () => {
      try {
        return await publicCollectionsService.getProductDiscount(product.id, product.price, categoryIds, quantity);
      } catch {
        return dynamicDiscount;
      }
    })();

    if (isSimpleProduct) {
      addToCart({
        product: {
          ...product,
          id: `${product.id}::original`,
          selectedAttributes: {},
        },
        quantity,
        discount: discountForQty ?? dynamicDiscount,
      });
    } else {
      const imagesForCart =
        selectedSku && Array.isArray(selectedSku.images) && selectedSku.images.length > 0
          ? selectedSku.images
          : product.images;

      const cartProductId = selectedSku
        ? `${product.id}::${selectedSku.id}`
        : `${product.id}::original`;

      const productForCart = selectedSku
        ? {
          ...product,
          id: cartProductId,
          name: product.name,
          sku: selectedSku.sku,
          price: selectedSku.price ?? product.price,
          images: imagesForCart,
          selectedAttributes: selectedSku.attributes ?? {},
        }
        : {
          ...product,
          id: cartProductId,
          name: product.name,
          images: imagesForCart,
          selectedAttributes: selectedVariants,
        };

      addToCart({ product: productForCart, quantity, discount: discountForQty ?? dynamicDiscount });
    }

    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  if (loading) {
    return (
      <main className={styles.page}>
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p>Cargando producto...</p>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className={styles.page}>
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <h1>Producto no encontrado</h1>
          <p>{error ?? 'El producto que buscás no existe o fue removido.'}</p>
          <Link to="/productos">
            <Button variant="primary">Volver al catálogo</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link to="/">Inicio</Link>
        <span className={styles.breadcrumbSep}>/</span>
        <Link to="/productos">Productos</Link>
        <span className={styles.breadcrumbSep}>/</span>
        <Link to={`/productos?category=${product.category.slug}`}>
          {product.category.name}
        </Link>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>{product.name}</span>
      </nav>

      <div className={styles.productLayout}>
        <div className={styles.gallery}>
          <div className={styles.mainImageWrapper}>
            <img
              className={styles.mainImage}
              src={skuImages[selectedImage]}
              alt={product.name}
              loading="eager"
            />
          </div>
          {(skuImages || []).length > 1 && (
            <div className={styles.thumbnails} role="tablist" aria-label="Imágenes del producto">
              {(skuImages || []).map((img, idx) => (
                <button
                  key={idx}
                  className={`${styles.thumbnail} ${idx === selectedImage ? styles.active : ''}`}
                  onClick={() => setSelectedImage(idx)}
                  tabIndex={0}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setSelectedImage(idx)}
                  aria-label={`Imagen ${idx + 1} de ${product.name}`}
                  type="button"
                >
                  <img
                    className={styles.thumbnailImg}
                    src={img}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.info}>
          <span className={styles.category}>{product.category.name}</span>
          <h1 className={styles.productName}>{product.name}</h1>
          <div className={styles.badges}>
            {dynamicDiscount && (
              <DiscountBadge
                discountPercentage={dynamicDiscount?.promotionType === 'percentage' ? dynamicDiscount.discountPercentage : undefined}
                discountAmount={dynamicDiscount?.promotionType === 'fixed' ? dynamicDiscount.discountAmount : undefined}
                promotionType={dynamicDiscount?.promotionType}
                display="inline"
              />
            )}
            {isNew && <Badge variant="new">Nuevo</Badge>}
          </div>

          <div className={styles.rating}>
            <span className={styles.stars}>{renderStars(product.rating)}</span>
            <span className={styles.ratingText}>
              {product.rating} ({product.reviewCount} opiniones)
            </span>
          </div>

          <span className={styles.sku}>
            SKU: {variantGroups.length === 0 ? product.sku : (selectedSku?.sku ?? product.sku)}
          </span>

          {/* 🟢 FIX: Eliminamos el bloque que renderizaba el botón "Original" */}
          {Object.keys(variantMap).length > 0 && (
            <div className={styles.variantsBlock}>
              {Object.entries(variantMap).map(([attr, values]) => (
                <div key={attr} className={styles.variantGroup}>
                  <span className={styles.variantLabel}>{attr}</span>
                  <div className={styles.variantOptions}>
                    {[...values].map(val => {
                      const selected = selectedVariants[attr] === val;
                      const available = isOptionAvailable(attr, val);
                      const cssColor = normalizeColor(val);
                      const isColor = !!cssColor;

                      return (
                        <button
                          key={val}
                          disabled={!available}
                          className={[
                            styles.variantOption,
                            selected ? styles.variantOptionSelected : '',
                            !available ? styles.variantDisabled : '',
                          ].join(' ').trim()}
                          onClick={() =>
                            setSelectedVariants(prev => {
                              const newSelection = { ...prev, [attr]: val };
                              return findCompatibleVariants(newSelection);
                            })
                          }
                        >
                          {isColor ? (
                            <span
                              className={styles.colorCircle}
                              style={{ background: cssColor }}
                            />
                          ) : (
                            val
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className={styles.priceBlock}>
            {(() => {
              const basePrice = selectedSku?.price ?? product.price;
              if (dynamicDiscount) {
                return <ProductPrice price={basePrice} discount={dynamicDiscount} size="lg" />;
              }
              return <ProductPrice price={basePrice} size="lg" />;
            })()}
          </div>

          {dynamicDiscount && dynamicDiscount.promotionName && (
            <div className={styles.promotionInfo}>
              <strong>Promoción: {dynamicDiscount.promotionName}</strong>
              {dynamicDiscount.validUntil && (
                <p>Válida hasta: {new Date(dynamicDiscount.validUntil).toLocaleDateString('es-AR')}</p>
              )}
              {dynamicDiscount.minPurchase && (
                <p>Compra mínima: ${dynamicDiscount.minPurchase.toLocaleString('es-AR')}</p>
              )}
            </div>
          )}

          {variantGroups.length > 0 && (
            <div className={styles.variantsBlock}>
              {variantGroups.map(group => (
                <VariantSelector
                  key={group.id}
                  group={group}
                  selected={selectedVariants[group.id]}
                  onSelect={(value) => setSelectedVariants(prev => findCompatibleVariants({ ...prev, [group.id]: value }))}
                />
              ))}
            </div>
          )}

          <p className={styles.description}>{product.description}</p>

          {product.features && product.features.length > 0 && (
            <div className={styles.features}>
              <h3 className={styles.featuresTitle}>Características</h3>
              {product.features.map((feat) => (
                <div className={styles.featureItem} key={feat}>
                  <span className={styles.featureCheck} aria-hidden="true">✓</span>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          )}

          <div className={styles.actions}>
            <div className={styles.quantityRow}>
              <div className={styles.quantityControl}>
                <button
                  className={styles.qtyBtn}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  aria-label="Reducir cantidad"
                  type="button"
                >
                  −
                </button>
                <input
                  className={styles.qtyValue}
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  aria-label="Cantidad"
                />
                <button
                  className={styles.qtyBtn}
                  onClick={() => setQuantity(quantity + 1)}
                  aria-label="Aumentar cantidad"
                  type="button"
                >
                  +
                </button>
              </div>
            </div>

            <div className={styles.buttonsRow}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleAddToCart}
                disabled={
                  addedFeedback ||
                  (variantGroups.length > 0 && variantGroups.some(g => !selectedVariants[g.id]))
                }
              >
                {addedFeedback
                  ? '¡Agregado al carrito! ✓'
                  : variantGroups.length > 0 && variantGroups.some(g => !selectedVariants[g.id])
                    ? 'Seleccioná todas las variantes'
                    : 'Agregar al carrito'}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className={isProductFavorite ? styles.favoriteButtonActive : ''}
                onClick={() => toggleFavorite(product)}
                leftIcon={<Heart size={18} fill={isProductFavorite ? 'currentColor' : 'transparent'} aria-hidden="true" />}
              >
                {isProductFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section className={styles.relatedSection} aria-label="Productos relacionados">
          <h2 className={styles.relatedTitle}>También te puede interesar</h2>
          <div className={styles.relatedGrid}>
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <div className={styles.reviewsSection}>
        <ProductReviews productId={product.id} />
      </div>
    </main>
  );
}