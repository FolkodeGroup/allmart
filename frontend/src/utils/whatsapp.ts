import type { CartItem } from '../types';
import type { OrderFormData } from '../components/ui/OrderConfirmationForm';

/* ── Formateador de precios ARS ── */
function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(price);
}

/* ── Construye el mensaje de WhatsApp con el resumen del pedido ── */
export function buildWhatsAppMessage(
  client: OrderFormData,
  items: CartItem[],
  totalPrice: number,
  // shippingLabel: string = 'A calcular'
): string {
  const date = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const productLines = items
    .map(({ product, quantity }) => {
      const subtotal = formatPrice(product.price * quantity);
      return `  • ${product.name} x${quantity} — ${subtotal}`;
    })
    .join('\n');

  const message = [
    '🛍️ *Nuevo pedido — ALLMART*',
    `📅 Fecha: ${date}`,
    '',
    '👤 *Datos del cliente*',
    `  Nombre: ${client.firstName} ${client.lastName}`,
    `  Email: ${client.email}`,
    '',
    '📦 *Productos*',
    productLines,
    '',
    '📊 *Resumen*',
    `  *Total: ${formatPrice(totalPrice)}*`,
    '',
    '¡Gracias por tu compra! 🙌',
  ].join('\n');

  return message;
}

/* ── Genera la URL de WhatsApp con el mensaje codificado ── */
export function buildWhatsAppUrl(message: string, phone?: string): string {
  const encoded = encodeURIComponent(message);
  const base = phone ? `https://wa.me/${phone}` : 'https://wa.me/';
  return `${base}?text=${encoded}`;
}
