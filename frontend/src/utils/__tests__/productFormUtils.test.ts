import { describe, expect, it } from 'vitest';
import {
  generateSlug,
  generateSkuSuggestion,
  debounce,
  isValidSlug,
  isValidSku,
  sanitizeAutocompleteInput,
  filterSuggestions,
  getInlineFieldError,
  calculateNameQualityScore,
  extractUniqueFieldValues,
} from '../productFormUtils';

describe('productFormUtils', () => {
  describe('generateSlug', () => {
    it('debería convertir el nombre a slug válido en minúsculas', () => {
      expect(generateSlug('Mi Producto Especial')).toBe('mi-producto-especial');
    });

    it('debería reemplazar múltiples espacios con un guión', () => {
      expect(generateSlug('Producto   Con   Espacios')).toBe('producto-con-espacios');
    });

    it('debería remover caracteres especiales', () => {
      expect(generateSlug('Producto@#$%Especial')).toBe('productoespecial');
    });

    it('debería remover guiones al inicio y final', () => {
      expect(generateSlug('-Producto-Especial-')).toBe('producto-especial');
    });

    it('debería reemplazar múltiples guiones con uno solo', () => {
      expect(generateSlug('Producto---Especial')).toBe('producto-especial');
    });

    it('debería devolver cadena vacía para entrada vacía o nula', () => {
      expect(generateSlug('')).toBe('');
      expect(generateSlug('   ')).toBe('');
    });

    it('debería manejar acentos correctamente', () => {
      expect(generateSlug('Café Con Leche')).toBe('caf-con-leche');
    });
  });

  describe('generateSkuSuggestion', () => {
    it('debería generar SKU con patrón correcto', () => {
      const sku = generateSkuSuggestion('Laptop Pro', 'Electrónica', 1001);
      expect(sku).toBe('LAP-E-1001');
    });

    it('debería usar categoría vacía con X si no se proporciona', () => {
      const sku = generateSkuSuggestion('Producto Test', '', 2022);
      expect(sku).toMatch(/^PRO-X-2022$/);
    });

    it('debería usar solo primeras 3 letras del nombre', () => {
      const sku = generateSkuSuggestion('Extraordinario', 'Categoría', 1);
      expect(sku).toMatch(/^EXT-C-/);
    });

    it('debería remover espacios del nombre para las primeras letras', () => {
      const sku = generateSkuSuggestion('Apple MacBook Pro', 'Electrónica', 5000);
      expect(sku).toMatch(/^APP-E-5000$/);
    });

    it('debería rellenar el número con ceros', () => {
      const sku = generateSkuSuggestion('Test', 'Test', 5);
      expect(sku).toMatch(/^TES-T-0005$/);
    });

    it('debería devolver cadena vacía para entrada nula', () => {
      expect(generateSkuSuggestion('', 'Categoría')).toBe('');
    });
  });

  describe('debounce', () => {
    it('debería ejecutar función después del delay', async () => {
      let callCount = 0;
      const fn = () => callCount++;
      const debouncedFn = debounce(fn, 50);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(callCount).toBe(0);

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(callCount).toBe(1);
    });

    it('debería cancelar llamadas anteriores', async () => {
      const calls: number[] = [];
      const fn = (n: number) => calls.push(n);
      const debouncedFn = debounce(fn, 50);

      debouncedFn(1);
      await new Promise(resolve => setTimeout(resolve, 25));
      debouncedFn(2);
      await new Promise(resolve => setTimeout(resolve, 25));
      debouncedFn(3);

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(calls).toEqual([3]);
    });
  });

  describe('isValidSlug', () => {
    it('debería validar slugs correctos', () => {
      expect(isValidSlug('producto-especial')).toBe(true);
      expect(isValidSlug('prod-123')).toBe(true);
      expect(isValidSlug('a')).toBe(true);
    });

    it('debería rechazar slugs con caracteres inválidos', () => {
      expect(isValidSlug('Producto-Especial')).toBe(false);
      expect(isValidSlug('producto_especial')).toBe(false);
      expect(isValidSlug('producto-')).toBe(false);
      expect(isValidSlug('-producto')).toBe(false);
    });

    it('debería rechazar slugs vacíos', () => {
      expect(isValidSlug('')).toBe(false);
    });
  });

  describe('isValidSku', () => {
    it('debería validar SKUs correctos', () => {
      expect(isValidSku('LAP-E-1001')).toBe(true);
      expect(isValidSku('ABC123')).toBe(true);
      expect(isValidSku('A')).toBe(true);
    });

    it('debería rechazar SKUs con minúsculas', () => {
      expect(isValidSku('lap-e-1001')).toBe(false);
    });

    it('debería rechazar SKUs con caracteres especiales no permitidos', () => {
      expect(isValidSku('LAP_E_1001')).toBe(false);
      expect(isValidSku('LAP-E-')).toBe(false);
    });
  });

  describe('sanitizeAutocompleteInput', () => {
    it('debería remover espacios al inicio y final', () => {
      expect(sanitizeAutocompleteInput('  texto  ')).toBe('texto');
    });

    it('debería normalizar espacios múltiples', () => {
      expect(sanitizeAutocompleteInput('texto   con   espacios')).toBe('texto con espacios');
    });

    it('debería convertir a minúsculas', () => {
      expect(sanitizeAutocompleteInput('TEXTO')).toBe('texto');
    });
  });

  describe('filterSuggestions', () => {
    const suggestions = ['Apple', 'Application', 'Pineapple', 'Banana', 'Band'];

    it('debería filtrar sugerencias que contengan el término', () => {
      const result = filterSuggestions('App', suggestions);
      expect(result).toContain('Apple');
      expect(result).toContain('Application');
      expect(result).not.toContain('Banana');
    });

    it('debería priorizar coincidencias al inicio', () => {
      const result = filterSuggestions('App', suggestions);
      const appleIndex = result.indexOf('Apple');
      const pineappleIndex = result.indexOf('Pineapple');
      expect(appleIndex).toBeLessThan(pineappleIndex);
    });

    it('debería respetar el límite de resultados', () => {
      const result = filterSuggestions('a', suggestions, 2);
      expect(result.length).toBeLessThanOrEqual(2);
    });

    it('debería devolver array vacío para término vacío', () => {
      expect(filterSuggestions('', suggestions)).toEqual([]);
    });
  });

  describe('getInlineFieldError', () => {
    it('debería validar campo name correctamente', () => {
      expect(getInlineFieldError('', 'name')).toBe('El nombre es obligatorio');
      expect(getInlineFieldError('   ', 'name')).toBe('El nombre es obligatorio');
      expect(getInlineFieldError('Producto', 'name')).toBe('');
    });

    it('debería validar campo price correctamente', () => {
      expect(getInlineFieldError(0, 'price')).toBe('El precio debe ser mayor a 0');
      expect(getInlineFieldError(-5, 'price')).toBe('El precio debe ser mayor a 0');
      expect(getInlineFieldError(10.5, 'price')).toBe('');
    });

    it('debería validar campo stock correctamente', () => {
      expect(getInlineFieldError(-1, 'stock')).toBe('El stock no puede ser negativo');
      expect(getInlineFieldError(0, 'stock')).toBe('');
    });

    it('debería validar campo discount correctamente', () => {
      expect(getInlineFieldError(150, 'discount')).toBe('El descuento debe estar entre 0 y 100');
      expect(getInlineFieldError(-10, 'discount')).toBe('El descuento debe estar entre 0 y 100');
      expect(getInlineFieldError(50, 'discount')).toBe('');
    });

    it('debería validar campo slug correctamente', () => {
      expect(getInlineFieldError('Producto-Especial', 'slug')).toBe(
        'El slug debe contener solo letras minúsculas, números y guiones'
      );
      expect(getInlineFieldError('producto-especial', 'slug')).toBe('');
    });
  });

  describe('calculateNameQualityScore', () => {
    it('debería dar score alto para nombre de buena longitud', () => {
      const score = calculateNameQualityScore('Laptop Pro 15 Deluxe');
      expect(score).toBeGreaterThanOrEqual(60);
    });

    it('debería dar score bajo para nombre vacío', () => {
      expect(calculateNameQualityScore('')).toBe(0);
    });

    it('debería dar score más alto para nombres con caracteres descriptivos', () => {
      const score1 = calculateNameQualityScore('Producto Premium Professional Edition 2024');
      const score2 = calculateNameQualityScore('aaaa');
      expect(score1).toBeGreaterThan(score2);
    });

    it('debería nunca exceder 100', () => {
      const score = calculateNameQualityScore('Excelente producto premium profesional edition 2024');
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('extractUniqueFieldValues', () => {
    const data = [
      { name: 'Producto A', category: 'Electrónica' },
      { name: 'Producto B', category: 'Electrónica' },
      { name: 'Producto C', category: 'Ropa' },
      { name: '', category: 'Otro' }, // Vacío - debe ignorarse
    ];

    it('debería extraer valores únicos de un campo', () => {
      const result = extractUniqueFieldValues(data, 'category');
      expect(result).toContain('Electrónica');
      expect(result).toContain('Ropa');
      expect(result).toContain('Otro');
      expect(result.length).toBe(3);
    });

    it('debería ignorar valores vacíos', () => {
      const result = extractUniqueFieldValues(data, 'name');
      expect(result).not.toContain('');
      expect(result).toHaveLength(3);
    });

    it('debería retornar array ordenado', () => {
      const result = extractUniqueFieldValues(data, 'category');
      const expected = ['Electrónica', 'Otro', 'Ropa'];
      expect(result).toEqual(expected);
    });
  });
});
