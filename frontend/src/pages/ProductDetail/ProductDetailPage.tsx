import { useState } from 'react';
import type { VariantGroup } from '../../context/AdminProductsContext';
import { useParams, Link } from 'react-router-dom';
import { getProducts } from '../../data/productsLocal';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { ProductCard } from '../../features/products/ProductCard/ProductCard';
import styles from './ProductDetailPage.module.css';
import { useCart } from '../../components/layout/context/CartContextUtils';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(price);
}

function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

export function ProductDetailPage() {
  const { addToCart } = useCart();
  const { slug } = useParams<{ slug: string }>();
  const product = getProducts().find((p) => p.slug === slug);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Selección de variantes
  const variantGroups: VariantGroup[] = (product as any).variants ?? [];
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  if (!product) {
    return (
      <main className={styles.page}>
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <h1>Producto no encontrado</h1>
          <p>El producto que buscás no existe o fue removido.</p>
          <Link to="/productos">
            <Button variant="primary">Volver al catálogo</Button>
          </Link>
        </div>
      </main>
    );
  }

  const relatedProducts = getProducts()
    .filter(
      (p) => p.category.id === product.category.id && p.id !== product.id
    )
    .slice(0, 4);

  const hasDiscount = product.discount && product.discount > 0;
  const isNew = product.tags.includes('nuevo');

  const [addedFeedback, setAddedFeedback] = useState(false);

  const handleAddToCart = () => {
    if (!product) return;
    // En el futuro: pasar variantes seleccionadas al carrito
    addToCart({ product, quantity });
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };
  
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
                  role="tab"
                  aria-selected={idx === selectedImage}
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
            <span className={styles.currentPrice}>
              {formatPrice(product.price)}
            </span>
            {hasDiscount && product.originalPrice && (
              <>
                <span className={styles.originalPrice}>
                  {formatPrice(product.originalPrice)}
                </span>
                <span className={styles.discountBadge}>
                  Ahorrás {formatPrice(product.originalPrice - product.price)}
                </span>
              </>
            )}
          </div>


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
