import { useState } from 'react';
import { ProductImage } from '../../components/ui/ProductImage';
import { Link } from 'react-router-dom';
import { useCart } from '../../components/layout/context/CartContextUtils';
import { OrderConfirmationForm } from '../../components/ui/OrderConfirmationForm';
import styles from './CartPage.module.css';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(price);
}

export function CartPage() {
  const { items, totalItems, totalPrice, removeFromCart, updateQuantity, clearCart } =
    useCart();

  const [showForm, setShowForm] = useState(false);






  if (items.length === 0) {
    return (
      <main className={styles.page}>
        <div className={styles.empty}>
          <span className={styles.emptyIcon} aria-hidden="true">🛒</span>
          <h1 className={styles.emptyTitle}>Tu carrito está vacío</h1>
          <p className={styles.emptyText}>
            Explorá nuestro catálogo y encontrá los productos que estabas buscando.
          </p>
          <Link to="/productos" className={styles.emptyLink}>
            Ver productos
          </Link>
        </div>
      </main>
    );
  }

  const shippingThreshold = 50000;
  const freeShipping = totalPrice >= shippingThreshold;

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>
        Mi carrito
        <span className={styles.headingCount}>
          ({totalItems} {totalItems === 1 ? 'producto' : 'productos'})
        </span>
      </h1>

      <div className={styles.layout}>
        {/* ── Lista de ítems ── */}
        <ul className={styles.itemList} aria-label="Productos en el carrito">
          {items.map(({ product, quantity }) => (
            <li key={product.id} className={styles.item}>
              <Link to={`/productos/${product.slug}`}>
                <ProductImage
                  src={product.images[0]}
                  alt={product.name}
                  className={styles.itemImage}
                  width={64}
                  height={64}
                  placeholder={'data:image/svg+xml,%3Csvg width="64" height="64" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="64" height="64" fill="%23f3f3f3"/%3E%3C/svg%3E'}
                />
              </Link>

              <div className={styles.itemInfo}>
                <Link to={`/productos/${product.slug}`} className={styles.itemName}>
                  {product.name}
                </Link>
                <span className={styles.itemCategory}>{product.category.name}</span>
                <span className={styles.itemUnitPrice}>
                  {formatPrice(product.price)} c/u
                </span>

                <div className={styles.qtyControl} role="group" aria-label={`Cantidad de ${product.name}`}>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => updateQuantity(product.id, quantity - 1)}
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
                      updateQuantity(product.id, Math.max(1, parseInt(e.target.value) || 1))
                    }
                    aria-label={`Cantidad de ${product.name}`}
                  />
                  <button
                    className={styles.qtyBtn}
                    onClick={() => updateQuantity(product.id, quantity + 1)}
                    aria-label="Aumentar cantidad"
                    type="button"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className={styles.itemRight}>
                <span className={styles.itemSubtotal}>
                  {formatPrice(product.price * quantity)}
                </span>
                <button
                  className={styles.removeBtn}
                  onClick={() => removeFromCart(product.id)}
                  aria-label={`Quitar ${product.name} del carrito`}
                  type="button"
                >
                  ✕ Quitar
                </button>
              </div>
            </li>
          ))}
        </ul>

        {/* ── Resumen ── */}
        <aside className={styles.summary} aria-label="Resumen del pedido">
          <h2 className={styles.summaryTitle}>Resumen</h2>

          <div className={styles.summaryRow}>
            <span>Subtotal ({totalItems} {totalItems === 1 ? 'ítem' : 'ítems'})</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>

          <div className={styles.summaryRow}>
            <span>Envío</span>
            <span>{freeShipping ? 'Gratis' : 'A calcular'}</span>
          </div>

          {!freeShipping && (
            <div className={styles.summaryRow}>
              <span>Faltan {formatPrice(shippingThreshold - totalPrice)} para envío gratis</span>
            </div>
          )}

          <hr className={styles.summaryDivider} />

          <div className={styles.summaryTotal}>
            <span>Total</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>

          <button
            className={styles.checkoutBtn}
            type="button"
            onClick={() => setShowForm(true)}
          >
            Iniciar compra
          </button>

          <button
            className={styles.clearBtn}
            onClick={clearCart}
            type="button"
          >
            Vaciar carrito
          </button>
        </aside>
      </div>

      {/* ── Modal formulario de confirmación ── */}
      {showForm && (
        <OrderConfirmationForm
          totalPrice={totalPrice}
          cartItems={items}
          onCartClear={clearCart}
          onCancel={() => setShowForm(false)}
        />
      )}
    </main>
  );
}
