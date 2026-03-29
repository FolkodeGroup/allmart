import { useState, useEffect } from 'react';
import type { VariantGroup } from '../../context/AdminProductsContext';
import { useParams, Link } from 'react-router-dom';
import type { Product } from '../../types';
import {
  fetchPublicProductBySlug,
  fetchPublicProducts,
  mapApiProductToProduct,
} from '../../services/productsService';
import { fetchPublicCategories } from '../../services/categoriesService';
import { publicCollectionsService } from '../../services/publicCollectionsService';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { ProductPrice } from '../../components/ui/ProductPrice/ProductPrice';
import { ProductCard } from '../../features/products/ProductCard/ProductCard';

import styles from './ProductDetailPage.module.css';
import { useCart } from '../../components/layout/context/CartContextUtils';

function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

export function ProductDetailPage() {
  const { addToCart } = useCart();
  const { slug } = useParams<{ slug: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [dynamicDiscount, setDynamicDiscount] = useState<any>(null);

  /* Cargar producto por slug */
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    setSelectedImage(0);

    Promise.all([fetchPublicProductBySlug(slug), fetchPublicCategories()])
      .then(([apiProduct, categories]) => {
        const mappedProduct = mapApiProductToProduct(apiProduct, categories);
        setProduct(mappedProduct);

        // Cargar productos relacionados de la misma categoría
        const categorySlugs = categories.find((c) => c.id === apiProduct.categoryId)?.slug;
        return fetchPublicProducts({ category: categorySlugs, limit: 5 }).then(({ data }) => {
          const related = data
            .map((p) => mapApiProductToProduct(p, categories))
            .filter((p) => p.id !== apiProduct.id)
            .slice(0, 4);
          setRelatedProducts(related);
        });
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  /* Cargar descuento dinámico desde API */
  useEffect(() => {
    if (!product) return;
    
    const loadDiscount = async () => {
      try {
        const discount = await publicCollectionsService.getProductDiscount(
          product.id,
          product.price,
          product.categoryId
        );
        setDynamicDiscount(discount);
      } catch (error) {
        console.error('Error loading discount:', error);
        setDynamicDiscount(null);
      }
    };

    loadDiscount();
  }, [product?.id, product?.price, product?.categoryId]);

  const variantGroups: VariantGroup[] = product ? (product as any).variants ?? [] : [];
  const hasDiscount = product ? product.discount && product.discount > 0 : false;
  const isNew = product ? product.tags.includes('nuevo') : false;

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({ product, quantity });
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
      {/* Breadcrumb */}
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

      {/* Product */}
      <div className={styles.productLayout}>
        {/* Gallery */}
        <div className={styles.gallery}>
          <div className={styles.mainImageWrapper}>
            <img
              className={styles.mainImage}
              src={product.images[selectedImage]}
              alt={product.name}
              loading="eager"
            />
          </div>
          {product.images.length > 1 && (
            <div className={styles.thumbnails} role="tablist" aria-label="Imágenes del producto">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  className={`${styles.thumbnail} ${
                    idx === selectedImage ? styles.active : ''
                  }`}
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

        {/* Info */}
        <div className={styles.info}>
          <div className={styles.badges}>
            {hasDiscount && (
              <Badge variant="discount">-{product.discount}%</Badge>
            )}
            {isNew && <Badge variant="new">Nuevo</Badge>}
          </div>

          <span className={styles.category}>{product.category.name}</span>
          <h1 className={styles.productName}>{product.name}</h1>

          <div className={styles.rating}>
            <span className={styles.stars}>{renderStars(product.rating)}</span>
            <span className={styles.ratingText}>
              {product.rating} ({product.reviewCount} opiniones)
            </span>
          </div>

          <span className={styles.sku}>SKU: {product.sku}</span>

          {/* Price */}
          <div className={styles.priceBlock}>
            {dynamicDiscount ? (
              <ProductPrice
                price={dynamicDiscount.finalPrice}
                originalPrice={dynamicDiscount.originalPrice}
                discount={dynamicDiscount.discountPercentage}
                size="lg"
              />
            ) : (
              <ProductPrice
                price={product.price}
                originalPrice={product.originalPrice}
                discount={product.discount}
                size="lg"
              />
            )}
          </div>

          {/* Promotion Information */}
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


          {/* Variantes (si existen) */}
          {variantGroups.length > 0 && (
            <div className={styles.variantsBlock}>
              {variantGroups.map(group => (
                <div key={group.id} className={styles.variantGroup}>
                  <span className={styles.variantLabel}>{group.name}:</span>
                  <div className={styles.variantOptions}>
                    {group.values.map(val => (
                      <button
                        key={val}
                        type="button"
                        className={
                          selectedVariants[group.id] === val
                            ? styles.variantOptionSelected
                            : styles.variantOption
                        }
                        onClick={() => setSelectedVariants(prev => ({ ...prev, [group.id]: val }))}
                        tabIndex={0}
                        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setSelectedVariants(prev => ({ ...prev, [group.id]: val }))}
                        aria-pressed={selectedVariants[group.id] === val}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Description */}
          <p className={styles.description}>{product.description}</p>

          {/* Features */}
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

          {/* Actions */}
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
              <Button variant="secondary" size="lg">
                ♡
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
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
    </main>
  );
}
