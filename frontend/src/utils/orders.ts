export function formatOrderCode(orderId: string): string {
  const normalized = orderId.trim();
  if (!normalized) return '';
  return normalized.slice(0, 8).toUpperCase();
}

export function formatOrderLabel(orderId: string): string {
  const code = formatOrderCode(orderId);
  return code ? `Pedido #${code}` : 'Pedido';
}