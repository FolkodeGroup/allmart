import type { CartItem } from '../types';
import type { OrderFormData } from '../components/ui/OrderConfirmationForm';

const DEFAULT_WHATSAPP_PHONE = '5491165891091';

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
  orderId?: string,
): string {
  const date = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const productLines = items
    .map(({ product, quantity }) => {
      const subtotal = formatPrice(product.price * quantity);
      return `- ${product.name} x${quantity}: ${subtotal}`;
    })
    .join('\n');

  const orderLines = [
    `- Fecha: ${date}`,
    ...(orderId ? [`- ID: ${orderId}`] : []),
  ];

  const message = [
    'Hola Allmart, acabo de realizar un pedido desde la tienda online.',
    '',
    '*Pedido*',
    ...orderLines,
    '',
    '*Cliente*',
    `- Nombre: ${client.firstName} ${client.lastName}`,
    `- Email: ${client.email}`,
    `- Celular: ${client.phone}`,
    '',
    '*Productos*',
    productLines,
    '',
    '*Total*',
    `- ${formatPrice(totalPrice)}`,
    '',
    'Mensaje generado automaticamente desde la tienda online.',
  ].join('\n');

  return message;
}

/* ── Genera la URL de WhatsApp con el mensaje codificado ── */
export function buildWhatsAppUrl(message: string, phone?: string): string {
  const encoded = encodeURIComponent(message);
  const targetPhone = (phone ?? DEFAULT_WHATSAPP_PHONE).replace(/\D/g, '');
  const base = `https://wa.me/${targetPhone}`;
  return `${base}?text=${encoded}`;
}
