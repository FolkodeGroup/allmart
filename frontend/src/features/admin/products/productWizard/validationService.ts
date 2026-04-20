/**
 * Servicio de validación para productos
 * Chequea unicidad de SKU, slug, y otras validaciones contra la API
 */

import { apiFetch } from '../../../../utils/apiClient';

interface ValidationCheckResponse {
  isAvailable: boolean;
  suggestions?: string[];
}

/**
 * Verifica si un SKU ya existe en la base de datos
 */
export async function checkSkuAvailability(
  sku: string,
  token?: string
): Promise<boolean> {
  try {
    const response = await apiFetch<ValidationCheckResponse>(
      `/api/admin/products/validate/sku?sku=${encodeURIComponent(sku)}`,
      {},
      token
    );
    return response.isAvailable ?? true;
  } catch (err) {
    console.error('Error checking SKU availability:', err);
    // En caso de error, asumimos que está disponible para no bloquear el formulario
    return true;
  }
}

/**
 * Verifica si un slug ya existe en la base de datos
 */
export async function checkSlugAvailability(
  slug: string,
  token?: string
): Promise<boolean> {
  try {
    const response = await apiFetch<ValidationCheckResponse>(
      `/api/admin/products/validate/slug?slug=${encodeURIComponent(slug)}`,
      {},
      token
    );
    return response.isAvailable ?? true;
  } catch (err) {
    console.error('Error checking slug availability:', err);
    // En caso de error, asumimos que está disponible
    return true;
  }
}

/**
 * Genera un slug a partir del nombre del producto
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Eliminar caracteres especiales
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/-+/g, '-') // Guiones múltiples a uno
    .replace(/^-+|-+$/g, ''); // Eliminar guiones al inicio/final
}

/**
 * Genera un SKU sugerido basado en el nombre del producto
 */
export function generateSuggestedSku(name: string): string {
  return name
    .toUpperCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Eliminar caracteres especiales
    .replace(/\s+/g, '-')
    .substring(0, 20);
}

/**
 * Genera sugerencias de SKU alternativos cuando uno existe
 */
export function generateSkuSuggestions(baseSku: string, count: number = 3): string[] {
  const suggestions: string[] = [];
  for (let i = 1; i <= count; i++) {
    suggestions.push(`${baseSku}-${i}`);
  }
  return suggestions;
}

/**
 * Genera sugerencias de slug alternativos cuando uno existe
 */
export function generateSlugSuggestions(baseSlug: string, count: number = 3): string[] {
  const suggestions: string[] = [];
  for (let i = 1; i <= count; i++) {
    suggestions.push(`${baseSlug}-${i}`);
  }
  return suggestions;
}

/**
 * Valida que un email tenga formato correcto (si es necesario en el futuro)
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida que un slug tenga el formato correcto
 */
export function validateSlugFormat(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}
