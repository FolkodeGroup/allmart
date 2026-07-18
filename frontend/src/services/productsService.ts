// frontend/src/services/productsService.ts

import { mapApiProductToProduct as originalMap } from '../features/admin/products/productsService';
import type { Category, Product } from '../types';

// Re-exportamos todo lo de la feature de administración para mantener compatibilidad
export * from '../features/admin/products/productsService';

// Tipo extendido que soporta la propiedad "stock" calculada en la grilla pública
export interface MappedPublicProduct extends Product {
  stock?: number;
}

/**
 * 🟢 OPTIMIZACIÓN EXTREMA: Interceptor de mapeo público.
 * Asegura que el descuento calculado de forma masiva por el backend (appliedDiscount)
 * y el stock consolidado se preserven, evitando llamadas en cascada individuales de red.
 */
export function mapApiProductToProduct<T extends object>(
  apiProduct: T,
  categories: Category[]
): MappedPublicProduct {
  // 🟢 SOLUCIÓN TS: Casteamos con "unknown" intermedio para evitar incompatibilidad de firma de índice en la llamada original
  const mapped = originalMap(
    apiProduct as unknown as Parameters<typeof originalMap>[0], 
    categories
  ) as MappedPublicProduct;
  
  // Accedemos a las propiedades extendidas mediante un cast seguro a Record de sólo lectura
  const rawApiProduct = apiProduct as unknown as Record<string, unknown>;
  
  return {
    ...mapped,
    appliedDiscount: (rawApiProduct.appliedDiscount as MappedPublicProduct['appliedDiscount']) || null,
    stock: typeof rawApiProduct.stock === 'number' ? rawApiProduct.stock : undefined,
  };
}