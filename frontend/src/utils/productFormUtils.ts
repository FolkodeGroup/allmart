/**
 * Utilidades para el formulario de productos
 * Incluye generación de slugs, SKUs, validación inline, etc.
 */

/**
 * Genera un slug a partir de un nombre de producto
 * @param name - Nombre del producto
 * @returns Slug generado
 * @example
 * generateSlug("Mi Producto Especial") => "mi-producto-especial"
 */
export const generateSlug = (name: string): string => {
  if (!name || typeof name !== 'string') return '';

  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Reemplaza espacios con guiones
    .replace(/[^a-z0-9-]/g, '') // Elimina caracteres especiales
    .replace(/-+/g, '-') // Reemplaza múltiples guiones con uno
    .replace(/^-+|-+$/g, ''); // Elimina guiones al inicio y final
};

/**
 * Genera una sugerencia de SKU basada en un patrón inteligente
 * El patrón es: Primeras letras del nombre + primera letra de la categoría + número incremental
 * @param productName - Nombre del producto
 * @param categoryName - Nombre de la categoría
 * @param sequenceNumber - Número secuencial (ej: timestamp o contador)
 * @returns SKU sugerido
 * @example
 * generateSkuSuggestion("Laptop Pro", "Electrónica", 1001) => "LAP-E-1001"
 */
export const generateSkuSuggestion = (
  productName: string,
  categoryName: string = '',
  sequenceNumber: number = Date.now() % 10000
): string => {
  if (!productName || typeof productName !== 'string') return '';

  // Extracta las primeras 3-4 letras del nombre del producto (en mayúsculas)
  const namePrefix = productName
    .replace(/\s+/g, '')
    .substring(0, 3)
    .toUpperCase();

  // Extracta la primera letra de la categoría (en mayúsculas)
  const categoryPrefix = categoryName
    .trim()
    .charAt(0)
    .toUpperCase() || 'X';

  // Formatea el número secuencial con padding
  const paddedNumber = String(sequenceNumber).padStart(4, '0');

  return `${namePrefix}-${categoryPrefix}-${paddedNumber}`;
};

/**
 * Debounce una función con tipo genérico
 * @param func - Función a debounce
 * @param delay - Delay en milisegundos
 * @returns Función debounceada
 * @example
 * const debouncedSearch = debounce((term: string) => search(term), 300);
 */
export const debounce = <T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Valida un slug
 * @param slug - Slug a validar
 * @returns boolean - true si es válido
 */
export const isValidSlug = (slug: string): boolean => {
  if (!slug || typeof slug !== 'string') return false;
  // Solo permite letras minúsculas, números y guiones
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
};

/**
 * Valida un SKU
 * @param sku - SKU a validar
 * @returns boolean - true si es válido
 */
export const isValidSku = (sku: string): boolean => {
  if (!sku || typeof sku !== 'string') return false;
  // Permite letras mayúsculas, números y guiones
  return /^[A-Z0-9]+(-[A-Z0-9]+)*$/.test(sku);
};

/**
 * Sanitiza un input de autocomplete
 * @param input - Input a sanitizar
 * @returns Input sanitizado
 */
export const sanitizeAutocompleteInput = (input: string): string => {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' '); // Normaliza espacios múltiples
};

/**
 * Filtra un array de sugerencias basado en un término de búsqueda
 * @param term - Término de búsqueda
 * @param suggestions - Array de sugerencias
 * @param limit - Límite de resultados (por defecto 10)
 * @returns Array filtrado
 */
export const filterSuggestions = (
  term: string,
  suggestions: string[],
  limit: number = 10
): string[] => {
  if (!term.trim()) return [];

  const sanitized = sanitizeAutocompleteInput(term);

  return suggestions
    .filter(s => s.toLowerCase().includes(sanitized))
    .sort((a, b) => {
      const aStartsWith = a.toLowerCase().startsWith(sanitized);
      const bStartsWith = b.toLowerCase().startsWith(sanitized);
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      return a.localeCompare(b);
    })
    .slice(0, limit);
};

/**
 * Obtiene el tipo de error para un campo en tiempo real
 * @param value - Valor del campo
 * @param fieldName - Nombre del campo
 * @param customValidators - Validadores personalizados
 * @returns Mensaje de error o vacío si es válido
 */
export const getInlineFieldError = (
  value: unknown,
  fieldName: string,
  customValidators?: Record<string, (value: unknown) => string | null>
): string => {
  // Si existen validadores personalizados, úsalos
  if (customValidators && customValidators[fieldName]) {
    const error = customValidators[fieldName](value);
    return error || '';
  }

  // Validaciones por defecto según el tipo de campo
  switch (fieldName) {
    case 'name':
      if (!value || (typeof value === 'string' && !value.trim())) {
        return 'El nombre es obligatorio';
      }
      if (typeof value === 'string' && value.length > 255) {
        return 'El nombre no puede exceder 255 caracteres';
      }
      return '';

    case 'price':
      if (typeof value === 'number' && value < 0.01) {
        return 'El precio debe ser mayor a 0';
      }
      return '';

    case 'stock':
      if (typeof value === 'number' && value < 0) {
        return 'El stock no puede ser negativo';
      }
      return '';

    case 'slug':
      if (typeof value === 'string' && value && !isValidSlug(value)) {
        return 'El slug debe contener solo letras minúsculas, números y guiones';
      }
      return '';

    case 'sku':
      if (typeof value === 'string' && value && !isValidSku(value)) {
        return 'El SKU debe contener solo letras mayúsculas, números y guiones';
      }
      return '';

    default:
      return '';
  }
};

/**
 * Calcula un score de calidad del nombre del producto para SEO
 * @param name - Nombre del producto
 * @returns Score entre 0 y 100
 */
export const calculateNameQualityScore = (name: string): number => {
  if (!name) return 0;

  let score = 0;

  // Largo óptimo (30-60 caracteres)
  const nameLen = name.length;
  if (nameLen >= 30 && nameLen <= 60) {
    score += 40;
  } else if (nameLen >= 20 && nameLen <= 70) {
    score += 20;
  } else if (nameLen > 0) {
    score += 10;
  }

  // Contiene palabras descriptivas
  const descriptiveWords = [
    'premium',
    'profesional',
    'edición',
    'modelo',
    'pack',
    'set',
    'kit',
    'pro',
    'deluxe',
    'especial',
  ];
  if (descriptiveWords.some(word => name.toLowerCase().includes(word))) {
    score += 20;
  }

  // Contiene números o variantes
  if (/[0-9]/.test(name)) {
    score += 20;
  }

  // No contiene caracteres extraños
  if (!/[<>{}[\]`]/g.test(name)) {
    score += 20;
  }

  return Math.min(score, 100);
};

/**
 * Extracts product-like data from different data formats (CSV, JSON, etc)
 * Útil para sugerencias autocomplete
 * @param data - Datos a extraer
 * @param fieldName - Campo a extraer (ej: "name", "category")
 * @returns Array de valores únicos
 */
export const extractUniqueFieldValues = (
  data: Record<string, unknown>[],
  fieldName: string
): string[] => {
  const values = new Set<string>();

  for (const item of data) {
    const value = item[fieldName];
    if (typeof value === 'string' && value.trim()) {
      values.add(value.trim());
    }
  }

  return Array.from(values).sort();
};

/**
 * Resultado tipado de validación para una combinación (variant/sku)
 */
export interface CombinationValidationErrors {
  sku?: string;
  images?: string;
  price?: string;
}

/**
 * Valida una combinación (SKU, imágenes, precio).
 * - sku: obligatorio, distinto al skuBase (si provisto), formato básico (mayúsculas/números/guiones)
 * - images: debe contener al menos una imagen (array o string que al split produce al menos 1)
 * - price: obligatorio, numérico, >= 0
 *
 * Retorna un objeto con mensajes de error por campo (vacío si no hay errores).
 */
export const validateCombination = (input: {
  sku?: unknown;
  skuBase?: string | null | undefined;
  images?: unknown; // string | string[]
  price?: unknown; // number | string
}): CombinationValidationErrors => {
  const errors: CombinationValidationErrors = {};

  const skuRaw = typeof input.sku === 'string' ? input.sku.trim() : '';
  if (!skuRaw) {
    errors.sku = 'El SKU es obligatorio';
  } else {
    // SKU debe ser distinto al skuBase
    if (input.skuBase && typeof input.skuBase === 'string' && skuRaw === input.skuBase) {
      errors.sku = 'El SKU debe ser distinto al SKU del producto base';
    }
    // formato básico: reuse isValidSku
    if (!errors.sku && !isValidSku(skuRaw)) {
      errors.sku = 'Formato inválido: solo mayúsculas, números y guiones';
    }
  }

  // Images: aceptar string (newline-separated) o array
  let imagesArr: string[] = [];
  if (typeof input.images === 'string') {
    const s = input.images.trim();
    if (s) {
      imagesArr = s.includes('\n') ? s.split('\n').map(x => x.trim()).filter(Boolean) : [s];
    }
  } else if (Array.isArray(input.images)) {
    imagesArr = (input.images as Array<unknown>).map(i => String(i)).map(x => x.trim()).filter(Boolean);
  }
  if (imagesArr.length === 0) {
    errors.images = 'Debe existir al menos una imagen para la combinación';
  }

  // Price: aceptar number o numeric string
  if (input.price === undefined || input.price === null || input.price === '') {
    errors.price = 'El precio es obligatorio';
  } else {
    const priceNum = typeof input.price === 'number' ? input.price : Number(String(input.price));
    if (Number.isNaN(priceNum)) {
      errors.price = 'El precio debe ser un número válido';
    } else if (priceNum < 0) {
      errors.price = 'El precio debe ser mayor o igual a 0';
    }
  }

  return errors;
};
